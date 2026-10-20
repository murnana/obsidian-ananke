import { App, Modal, Notice, Setting, TextComponent, normalizePath } from 'obsidian';
import { enforceBase } from '../base/base-file';
import type AnankePlugin from '../main';
import { isInFolder, parentPath } from '../task/registry';
import { BaseFileInputSuggest, FolderInputSuggest } from './suggest';

export class RegisterBaseModal extends Modal {
	private baseInput!: TextComponent;
	private folderInput!: TextComponent;

	constructor(
		app: App,
		private readonly plugin: AnankePlugin,
		private readonly onRegistered?: () => void,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		this.setTitle('Register a base');

		new Setting(contentEl)
			.setName('Base file')
			.setDesc('An existing .base file, or a path where a new one is created.')
			.addText((text) => {
				this.baseInput = text.setPlaceholder('Projects/Foo/Foo.base');
				new BaseFileInputSuggest(this.app, text.inputEl);
			});

		new Setting(contentEl)
			.setName('Task folder')
			.setDesc(
				'Archived tasks go to its archive subfolder. Defaults to a tasks folder next to the base.',
			)
			.addText((text) => {
				this.folderInput = text;
				new FolderInputSuggest(this.app, text.inputEl);
			});

		new Setting(contentEl).addButton((button) =>
			button
				.setButtonText('Register')
				.setCta()
				.onClick(() => void this.submit()),
		);
	}

	private validate(): { basePath: string; taskFolder: string } | null {
		let basePath = normalizePath(this.baseInput.getValue().trim());
		if (!basePath || basePath === '/') {
			new Notice('Enter a base file.');
			return null;
		}
		if (!basePath.endsWith('.base')) basePath += '.base';

		let taskFolder = this.folderInput.getValue().trim();
		if (!taskFolder) {
			const dir = parentPath(basePath);
			taskFolder = dir ? `${dir}/tasks` : 'tasks';
		}
		taskFolder = normalizePath(taskFolder);
		if (taskFolder === '/' || taskFolder === '') {
			new Notice('The vault root cannot be a task folder.');
			return null;
		}

		for (const reg of this.plugin.settings.bases) {
			if (reg.basePath === basePath) {
				new Notice(`${basePath} is already registered.`);
				return null;
			}
			if (
				reg.taskFolder === taskFolder ||
				isInFolder(taskFolder, reg.taskFolder) ||
				isInFolder(reg.taskFolder, taskFolder)
			) {
				new Notice(`${taskFolder} overlaps the task folder of ${reg.basePath}.`);
				return null;
			}
		}
		if (isInFolder(basePath, taskFolder)) {
			new Notice('The base file must be outside the task folder.');
			return null;
		}
		return { basePath, taskFolder };
	}

	private async submit(): Promise<void> {
		const reg = this.validate();
		if (!reg) return;
		try {
			await enforceBase(this.app, reg);
		} catch (error) {
			console.error('Ananke: failed to register base', error);
			new Notice(`Failed to set up ${reg.basePath}.`);
			return;
		}
		this.plugin.settings.bases.push(reg);
		await this.plugin.saveSettings();
		new Notice(`Registered ${reg.basePath}.`);
		this.onRegistered?.();
		this.close();
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
