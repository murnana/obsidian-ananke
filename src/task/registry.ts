import { App, TAbstractFile, TFile, normalizePath } from 'obsidian';
import { archiveFolderOf, type AnankeSettings, type BaseRegistration } from '../settings';

export function isInFolder(path: string, folder: string): boolean {
	return path.startsWith(`${folder}/`);
}

export function findBaseForPath(
	settings: AnankeSettings,
	path: string,
): BaseRegistration | undefined {
	return settings.bases.find((reg) => isInFolder(path, reg.taskFolder));
}

export function isTaskFile(settings: AnankeSettings, file: TAbstractFile | null): file is TFile {
	return (
		file instanceof TFile &&
		file.extension === 'md' &&
		findBaseForPath(settings, file.path) !== undefined
	);
}

export function isArchived(reg: BaseRegistration, path: string): boolean {
	return isInFolder(path, archiveFolderOf(reg));
}

export function listTasks(app: App, reg: BaseRegistration): TFile[] {
	return app.vault.getMarkdownFiles().filter((f) => isInFolder(f.path, reg.taskFolder));
}

export function parentPath(path: string): string {
	const i = path.lastIndexOf('/');
	return i < 0 ? '' : path.slice(0, i);
}

export async function ensureFolder(app: App, path: string): Promise<void> {
	let current = '';
	for (const part of normalizePath(path).split('/')) {
		if (part === '') continue;
		current = current ? `${current}/${part}` : part;
		if (!app.vault.getAbstractFileByPath(current)) {
			await app.vault.createFolder(current);
		}
	}
}

/** Returns `folder/name.ext`, appending a number when the path is taken. */
export function availablePath(app: App, folder: string, name: string, ext: string): string {
	let path = normalizePath(`${folder}/${name}.${ext}`);
	for (let i = 1; app.vault.getAbstractFileByPath(path); i++) {
		path = normalizePath(`${folder}/${name} ${i}.${ext}`);
	}
	return path;
}
