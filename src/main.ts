import { Plugin } from 'obsidian';
import { enforceAllBases, registerBaseEnforcer } from './base/base-file';
import { registerCommands } from './commands';
import { AnankeSettingTab, DEFAULT_SETTINGS, type AnankeSettings } from './settings';
import { registerAutoFill } from './task/auto-fill';
import { TaskTimer } from './worklog/timer';

export default class AnankePlugin extends Plugin {
	settings!: AnankeSettings;
	timer!: TaskTimer;

	async onload() {
		await this.loadSettings();
		this.timer = new TaskTimer(this);
		this.addSettingTab(new AnankeSettingTab(this.app, this));
		registerCommands(this);

		// Vault events fire for every file during startup, so listen only once the layout is ready.
		this.app.workspace.onLayoutReady(() => {
			registerAutoFill(this);
			registerBaseEnforcer(this);
			void enforceAllBases(this);
		});
	}

	async loadSettings() {
		const data = (await this.loadData()) as Partial<AnankeSettings> | null;
		this.settings = {
			...DEFAULT_SETTINGS,
			...data,
			bases: [...(data?.bases ?? [])],
		};
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
