import { App, Notice, TFile, TFolder, debounce, parseYaml, stringifyYaml } from 'obsidian';
import type AnankePlugin from '../main';
import { archiveFolderOf, type BaseRegistration } from '../settings';
import { PROP, PROPERTY_DISPLAY_NAMES } from '../task/properties';
import { ensureFolder, isInFolder, parentPath } from '../task/registry';

type BaseData = Record<string, unknown>;
type View = Record<string, unknown>;

const ACTIVE_VIEW = 'Active';
const ARCHIVE_VIEW = 'Archive';

const VIEW_ORDER = [
	'file.name',
	...Object.values(PROP).map((key) => `note.${key}`),
];

function inFolder(folder: string): string {
	return `file.inFolder(${JSON.stringify(folder)})`;
}

const IN_FOLDER = /^file\.inFolder\(/;
const NOT_IN_FOLDER = /^!file\.inFolder\(/;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Makes `required` a top-level `and` condition of `filters`, replacing any other
 * condition that `isManaged` claims (e.g. a stale folder filter).
 */
function enforceAndFilter(
	filters: unknown,
	required: string,
	isManaged: RegExp,
): { filters: unknown; changed: boolean } {
	if (isRecord(filters) && Array.isArray(filters.and)) {
		const and: unknown[] = filters.and;
		const kept = and.filter((c) => !(typeof c === 'string' && isManaged.test(c) && c !== required));
		const hasRequired = kept.includes(required);
		if (hasRequired && kept.length === and.length) return { filters, changed: false };
		return {
			filters: { ...filters, and: hasRequired ? kept : [required, ...kept] },
			changed: true,
		};
	}
	if (filters === undefined || filters === null || filters === '') {
		return { filters: { and: [required] }, changed: true };
	}
	if (typeof filters === 'string' && isManaged.test(filters)) {
		return { filters: { and: [required] }, changed: true };
	}
	return { filters: { and: [required, filters] }, changed: true };
}

/** Applies Ananke's managed parts to a parsed base file. Returns whether anything changed. */
export function applyBaseDefinition(data: BaseData, reg: BaseRegistration): boolean {
	let changed = false;

	const global = enforceAndFilter(data.filters, inFolder(reg.taskFolder), IN_FOLDER);
	if (global.changed) {
		data.filters = global.filters;
		changed = true;
	}

	const properties = isRecord(data.properties) ? data.properties : {};
	for (const [key, displayName] of Object.entries(PROPERTY_DISPLAY_NAMES)) {
		const id = `note.${key}`;
		const current = properties[id];
		const config = isRecord(current) ? current : {};
		if (config.displayName !== displayName) {
			properties[id] = { ...config, displayName };
			changed = true;
		}
	}
	data.properties = properties;

	const views: unknown[] = Array.isArray(data.views) ? data.views : [];
	const archive = inFolder(archiveFolderOf(reg));
	const managedViews: [string, string, RegExp][] = [
		[ACTIVE_VIEW, `!${archive}`, NOT_IN_FOLDER],
		[ARCHIVE_VIEW, archive, IN_FOLDER],
	];
	for (const [name, filter, isManaged] of managedViews) {
		const view = views.find((v): v is View => isRecord(v) && v.name === name);
		if (!view) {
			views.push({ type: 'table', name, filters: { and: [filter] }, order: [...VIEW_ORDER] });
			changed = true;
			continue;
		}
		const result = enforceAndFilter(view.filters, filter, isManaged);
		if (result.changed) {
			view.filters = result.filters;
			changed = true;
		}
	}
	data.views = views;

	return changed;
}

function parseBase(text: string): BaseData | null {
	try {
		const parsed: unknown = parseYaml(text);
		if (parsed === null || parsed === undefined) return {};
		return isRecord(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

/** Creates the folders and base file if needed, then enforces the managed definitions. */
export async function enforceBase(app: App, reg: BaseRegistration): Promise<void> {
	await ensureFolder(app, reg.taskFolder);
	await ensureFolder(app, archiveFolderOf(reg));

	let file = app.vault.getFileByPath(reg.basePath);
	if (!file) {
		await ensureFolder(app, parentPath(reg.basePath));
		file = await app.vault.create(reg.basePath, '');
	}

	// Check before writing so our own write does not trigger another round.
	const current = parseBase(await app.vault.cachedRead(file));
	if (!current) {
		new Notice(`Could not parse ${reg.basePath}; base definition was not enforced.`);
		return;
	}
	if (!applyBaseDefinition(current, reg)) return;

	await app.vault.process(file, (text) => {
		const data = parseBase(text);
		if (!data || !applyBaseDefinition(data, reg)) return text;
		return stringifyYaml(data);
	});
}

export async function enforceAllBases(plugin: AnankePlugin): Promise<void> {
	for (const reg of plugin.settings.bases) {
		try {
			await enforceBase(plugin.app, reg);
		} catch (error) {
			console.error(`Ananke: failed to enforce ${reg.basePath}`, error);
			new Notice(`Failed to enforce ${reg.basePath}.`);
		}
	}
}

function renamePrefix(path: string, oldPath: string, newPath: string): string {
	if (path === oldPath) return newPath;
	if (isInFolder(path, oldPath)) return newPath + path.slice(oldPath.length);
	return path;
}

/** Keeps base definitions and registrations in sync with vault changes. */
export function registerBaseEnforcer(plugin: AnankePlugin): void {
	const { vault } = plugin.app;
	const enforce = debounce(() => void enforceAllBases(plugin), 500, true);

	plugin.registerEvent(
		vault.on('modify', (file) => {
			if (plugin.settings.bases.some((reg) => reg.basePath === file.path)) enforce();
		}),
	);

	plugin.registerEvent(
		vault.on('rename', (file, oldPath) => {
			let changed = false;
			for (const reg of plugin.settings.bases) {
				const basePath = renamePrefix(reg.basePath, oldPath, file.path);
				const taskFolder =
					file instanceof TFolder
						? renamePrefix(reg.taskFolder, oldPath, file.path)
						: reg.taskFolder;
				if (basePath !== reg.basePath || taskFolder !== reg.taskFolder) {
					reg.basePath = basePath;
					reg.taskFolder = taskFolder;
					changed = true;
				}
			}
			if (changed) {
				void plugin.saveSettings();
				enforce();
			}
		}),
	);

	plugin.registerEvent(
		vault.on('delete', (file) => {
			if (!(file instanceof TFile)) return;
			const before = plugin.settings.bases.length;
			plugin.settings.bases = plugin.settings.bases.filter((reg) => reg.basePath !== file.path);
			if (plugin.settings.bases.length !== before) {
				new Notice(`${file.path} was deleted and has been unregistered.`);
				void plugin.saveSettings();
			}
		}),
	);
}
