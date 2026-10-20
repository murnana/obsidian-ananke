import { App, PluginSettingTab, Setting } from 'obsidian';
import type AnankePlugin from './main';
import { RegisterBaseModal } from './ui/register-base-modal';

export const ARCHIVE_FOLDER_NAME = 'archive';

export interface BaseRegistration {
	basePath: string;
	taskFolder: string;
}

export interface ActiveTimer {
	taskPath: string;
	startedAt: number;
}

export interface AnankeSettings {
	bases: BaseRegistration[];
	activeTimer: ActiveTimer | null;
}

export const DEFAULT_SETTINGS: AnankeSettings = {
	bases: [],
	activeTimer: null,
};

export function archiveFolderOf(reg: BaseRegistration): string {
	return `${reg.taskFolder}/${ARCHIVE_FOLDER_NAME}`;
}

export class AnankeSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: AnankePlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName('Bases').setHeading();

		for (const reg of this.plugin.settings.bases) {
			new Setting(containerEl)
				.setName(reg.basePath)
				.setDesc(`Tasks: ${reg.taskFolder}, archive: ${archiveFolderOf(reg)}`)
				.addExtraButton((button) =>
					button
						.setIcon('trash')
						.setTooltip('Unregister (files are kept)')
						.onClick(async () => {
							this.plugin.settings.bases = this.plugin.settings.bases.filter(
								(b) => b !== reg,
							);
							await this.plugin.saveSettings();
							this.display();
						}),
				);
		}

		new Setting(containerEl)
			.setName('Register a base')
			.setDesc('Attach a task folder to a base file.')
			.addButton((button) =>
				button
					.setButtonText('Register')
					.setCta()
					.onClick(() => {
						new RegisterBaseModal(this.app, this.plugin, () => this.display()).open();
					}),
			);
	}
}
