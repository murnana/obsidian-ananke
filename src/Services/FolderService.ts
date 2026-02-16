import { App, normalizePath, Notice } from 'obsidian';

/**
 * Service for managing Ananke folder structure.
 * Handles creation and initialization of task-related folders.
 */
export class FolderService {
	constructor(
		private app: App,
		private taskFolder: string
	) {}

	/**
	 * Ensure a folder exists, creating it if necessary.
	 * Uses Obsidian's vault adapter for file system operations.
	 */
	async ensureFolder(path: string): Promise<void> {
		const normalizedPath = normalizePath(path);
		const exists = await this.app.vault.adapter.exists(normalizedPath);

		if (!exists) {
			await this.app.vault.adapter.mkdir(normalizedPath);
		}
	}

	/**
	 * Initialize the complete Ananke folder structure.
	 * Creates: {taskFolder}/{daily, routines, logs}
	 *
	 * Safe to call multiple times - only creates folders that don't exist.
	 */
	async initializeStructure(): Promise<void> {
		await this.ensureFolder(this.taskFolder);
		await this.ensureFolder(`${this.taskFolder}/daily`);
		await this.ensureFolder(`${this.taskFolder}/routines`);
		await this.ensureFolder(`${this.taskFolder}/logs`);

		new Notice('Ananke: Task folders initialized');
	}
}
