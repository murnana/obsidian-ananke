import { App, TFile } from 'obsidian';

export const PROP = {
	status: 'status',
	due: 'due',
	deadline: 'deadline',
	estimate: 'estimate',
	logged: 'logged',
	parent: 'parent',
	blockedBy: 'blocked-by',
} as const;

export const STATUSES = ['Not started', 'Doing', 'Done', 'Omit'] as const;
export type TaskStatus = (typeof STATUSES)[number];

/** Names shown for each property in the base views. */
export const PROPERTY_DISPLAY_NAMES: Record<string, string> = {
	[PROP.status]: 'Status',
	[PROP.due]: 'Due date',
	[PROP.deadline]: 'Deadline',
	[PROP.estimate]: 'Estimate',
	[PROP.logged]: 'Logging time',
	[PROP.parent]: 'Parent',
	[PROP.blockedBy]: 'Blocked by',
};

export type Frontmatter = Record<string, unknown>;

export function defaultTaskProperties(): Frontmatter {
	return {
		[PROP.status]: 'Not started' satisfies TaskStatus,
		[PROP.due]: null,
		[PROP.deadline]: null,
		[PROP.estimate]: null,
		[PROP.logged]: 0,
		[PROP.parent]: null,
		[PROP.blockedBy]: [],
	};
}

/** Adds the required properties that are missing. Existing values are never overwritten. */
export function fillMissingProperties(fm: Frontmatter): void {
	for (const [key, value] of Object.entries(defaultTaskProperties())) {
		if (!(key in fm)) fm[key] = value;
	}
}

export function hasAllProperties(app: App, file: TFile): boolean {
	const fm = app.metadataCache.getFileCache(file)?.frontmatter;
	if (!fm) return false;
	return Object.keys(defaultTaskProperties()).every((key) => key in fm);
}

export async function ensureTaskProperties(app: App, file: TFile): Promise<boolean> {
	if (hasAllProperties(app, file)) return false;
	let changed = false;
	await app.fileManager.processFrontMatter(file, (fm: Frontmatter) => {
		const before = Object.keys(fm).length;
		fillMissingProperties(fm);
		changed = Object.keys(fm).length !== before;
	});
	return changed;
}

export function toNumber(value: unknown): number {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const n = Number.parseFloat(value);
		if (Number.isFinite(n)) return n;
	}
	return 0;
}

export function roundHours(hours: number): number {
	return Math.round(hours * 100) / 100;
}

export function isValidDate(value: string): boolean {
	return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Deadline accepts a date, or a date with a time. */
export function isValidDeadline(value: string): boolean {
	return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(value);
}

export function toWikilink(app: App, file: TFile, sourcePath: string): string {
	return `[[${app.metadataCache.fileToLinktext(file, sourcePath, true)}]]`;
}
