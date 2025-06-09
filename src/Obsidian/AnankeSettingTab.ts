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
    }
}
