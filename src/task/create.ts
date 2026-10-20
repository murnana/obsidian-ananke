import { App, TFile, stringifyYaml } from 'obsidian';
import type { BaseRegistration } from '../settings';
import { PROP, defaultTaskProperties, toWikilink } from './properties';
import { availablePath, ensureFolder } from './registry';

export interface NewTask {
	title: string;
	estimate?: number;
	due?: string;
	deadline?: string;
	parent?: TFile;
}

function toFileName(title: string): string {
	return title.replace(/[\\/:*?"<>|#^[\]]/g, '').trim();
}

export async function createTask(app: App, reg: BaseRegistration, task: NewTask): Promise<TFile> {
	const name = toFileName(task.title);
	if (!name) throw new Error('Task title is empty.');

	await ensureFolder(app, reg.taskFolder);
	const path = availablePath(app, reg.taskFolder, name, 'md');

	const fm = defaultTaskProperties();
	if (task.estimate !== undefined) fm[PROP.estimate] = task.estimate;
	if (task.due) fm[PROP.due] = task.due;
	if (task.deadline) fm[PROP.deadline] = task.deadline;
	if (task.parent) fm[PROP.parent] = toWikilink(app, task.parent, path);

	return app.vault.create(path, `---\n${stringifyYaml(fm)}---\n`);
}
