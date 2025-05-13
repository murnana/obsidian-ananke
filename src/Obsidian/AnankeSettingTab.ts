import { App, PluginSettingTab, Setting } from 'obsidian';
import { Ananke } from './Ananke';

/**
 * Obsidian Setting Provider
 */
export class AnankeSettingTab extends PluginSettingTab {
    plugin: Ananke;

    constructor(app: App, plugin: Ananke) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Folders')
            .setDesc('It\'s a secret')
            .addText(text => text
                .setPlaceholder('Task Folder')
                .setValue(this.plugin.settings.taskFolder)
                .onChange(async (value) => {
                    this.plugin.settings.taskFolder = value;
                    await this.plugin.saveSettings();
                }));
    }
}
