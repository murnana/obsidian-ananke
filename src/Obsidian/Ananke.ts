import { getLanguage, Plugin } from 'obsidian';
import { ISettings } from "./ISetings"
import { DEFAULT_SETTINGS } from './DefaultSettings';
import { AnankeSettingTab } from './AnankeSettingTab';
import { Localize } from '../i18n/Localize';
import { DailyPlanView, VIEW_TYPE_DAILY_PLAN } from 'Views/DailyPlanView';
import { DailyPlanService } from 'Services/DailyPlanService';
import { FolderService } from 'Services/FolderService';

/**
 * Ananke Plugin - Task estimation, recording, and reviewing for Obsidian.
 * Phase 1: Core Data Model + Basic Plan View
 */
export class Ananke extends Plugin {
	settings: ISettings;
	i18n?: Localize;
	private dailyPlanService?: DailyPlanService;
	private folderService?: FolderService;
	private statusBarItem?: HTMLElement;

	async onload() {
		await this.loadSettings();
		const pluginFolderPath = this.manifest.dir || `/.obsidian/plugins/${this.manifest.id}`;
		const relativeLocalizeJsonRootPath = `${pluginFolderPath}/assets/i18n`;

		// Setup i18n
		this.i18n = await Localize.Initialize(
			getLanguage(),
			relativeLocalizeJsonRootPath,
			true,
			async (relativePath) => await this.app.vault.adapter.read(relativePath)
		);

		// Initialize services
		this.folderService = new FolderService(this.app, this.settings.taskFolder);
		this.dailyPlanService = new DailyPlanService(
			this.app,
			this.settings.taskFolder,
			this.settings.defaultStartTime
		);

		// Register views
		this.registerView(
			VIEW_TYPE_DAILY_PLAN,
			(leaf) => new DailyPlanView(
				leaf,
				this.dailyPlanService!,
				this.folderService!,
				this.i18n!
			)
		);

		// Register ribbon icon
		this.addRibbonIcon('clock', this.i18n.Translation('ribbonIcon.tooltip'), () => {
			this.activateDailyPlanView();
		});

		// Status bar
		if (this.settings.showStatusBar) {
			this.statusBarItem = this.addStatusBarItem();
			this.statusBarItem.setText('Ananke');
		}

		// Register commands
		this.addCommand({
			id: 'open-daily-plan',
			name: this.i18n.Translation('commands.openDailyPlan.name'),
			callback: () => {
				this.activateDailyPlanView();
			}
		});

		this.addCommand({
			id: 'add-task',
			name: this.i18n.Translation('commands.addTask.name'),
			callback: () => {
				// Focus daily plan view (task form is already there)
				this.activateDailyPlanView();
			}
		});

		// Settings tab
		this.addSettingTab(new AnankeSettingTab(this.app, this, this.i18n));
	}

	onunload() {
		// Cleanup
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Open or focus the daily plan view.
	 */
	private async activateDailyPlanView() {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType(VIEW_TYPE_DAILY_PLAN)[0];

		if (!leaf) {
			// Create new leaf in right sidebar
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				leaf = rightLeaf;
				await leaf.setViewState({
					type: VIEW_TYPE_DAILY_PLAN,
					active: true,
				});
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}
}
