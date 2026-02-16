import { App, PluginSettingTab, Setting } from 'obsidian';
import { Ananke } from './Ananke';
import { Localize } from '../i18n/Localize';
import { DEFAULT_SETTINGS } from './DefaultSettings';

/**
 * Obsidian Setting Provider
 */
export class AnankeSettingTab extends PluginSettingTab {
    plugin: Ananke;
    i18n: Localize

    constructor(app: App, plugin: Ananke, i18n: Localize) {
        super(app, plugin);
        this.plugin = plugin;
        this.i18n = i18n
    }

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// Task folder setting
		new Setting(containerEl)
			.setName(this.i18n.Translation('settings.folders.tasks.name'))
			.setDesc(this.i18n.Translation('settings.folders.tasks.description'))
			.addText(text => text
				.setPlaceholder(DEFAULT_SETTINGS.taskFolder)
				.setValue(this.plugin.settings.taskFolder)
				.onChange(async (value) => {
					this.plugin.settings.taskFolder = value;
					await this.plugin.saveSettings();
				}));

		// Default start time setting
		new Setting(containerEl)
			.setName((this.i18n as any).Translation('settings.defaultStartTime.name') || 'Default Start Time')
			.setDesc((this.i18n as any).Translation('settings.defaultStartTime.description') || 'Default start time for daily plans (HH:mm format)')
			.addText(text => text
				.setPlaceholder('07:00')
				.setValue(this.plugin.settings.defaultStartTime)
				.onChange(async (value) => {
					this.plugin.settings.defaultStartTime = value;
					await this.plugin.saveSettings();
				}));

		// Show status bar setting
		new Setting(containerEl)
			.setName((this.i18n as any).Translation('settings.showStatusBar.name') || 'Show Status Bar')
			.setDesc((this.i18n as any).Translation('settings.showStatusBar.description') || 'Display task information in the status bar')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showStatusBar)
				.onChange(async (value) => {
					this.plugin.settings.showStatusBar = value;
					await this.plugin.saveSettings();
				}));
	}
}
