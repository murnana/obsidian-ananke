import { TAbstractFile } from 'obsidian';
import type AnankePlugin from '../main';
import { ensureTaskProperties } from './properties';
import { isTaskFile, listTasks } from './registry';

/** Adds missing properties to notes created in, or moved into, a task folder. */
export function registerAutoFill(plugin: AnankePlugin): void {
	const fill = (file: TAbstractFile) => {
		if (!isTaskFile(plugin.settings, file)) return;
		ensureTaskProperties(plugin.app, file).catch((error) => {
			console.error(`Ananke: failed to fill properties of ${file.path}`, error);
		});
	};
	plugin.registerEvent(plugin.app.vault.on('create', fill));
	plugin.registerEvent(plugin.app.vault.on('rename', fill));
}

/** Returns the number of task notes that were updated. */
export async function fillAllTasks(plugin: AnankePlugin): Promise<number> {
	let count = 0;
	for (const reg of plugin.settings.bases) {
		for (const file of listTasks(plugin.app, reg)) {
			if (await ensureTaskProperties(plugin.app, file)) count++;
		}
	}
	return count;
}
