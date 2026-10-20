import { App, TFile } from 'obsidian';
import { archiveFolderOf, type BaseRegistration } from '../settings';
import { availablePath, ensureFolder } from './registry';

async function moveTo(app: App, file: TFile, folder: string): Promise<void> {
	await ensureFolder(app, folder);
	// renameFile keeps links pointing at the task intact.
	await app.fileManager.renameFile(file, availablePath(app, folder, file.basename, file.extension));
}

export async function archiveTask(app: App, reg: BaseRegistration, file: TFile): Promise<void> {
	await moveTo(app, file, archiveFolderOf(reg));
}

export async function restoreTask(app: App, reg: BaseRegistration, file: TFile): Promise<void> {
	await moveTo(app, file, reg.taskFolder);
}
