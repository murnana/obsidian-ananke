import { Notice, TFile } from 'obsidian';
import type AnankePlugin from '../main';
import { PROP, roundHours, type Frontmatter } from '../task/properties';
import { LogWorkModal } from '../ui/log-work-modal';
import { appendWorkLog } from './worklog';

function formatElapsed(ms: number): string {
	const total = Math.floor(ms / 1000);
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** A single task timer that survives restarts through the plugin settings. */
export class TaskTimer {
	private readonly statusBarEl: HTMLElement;

	constructor(private readonly plugin: AnankePlugin) {
		this.statusBarEl = plugin.addStatusBarItem();
		this.statusBarEl.addClass('mod-clickable');
		this.statusBarEl.setAttribute('aria-label', 'Stop timer');
		plugin.registerDomEvent(this.statusBarEl, 'click', () => this.stop());
		plugin.registerInterval(window.setInterval(() => this.render(), 1000));

		plugin.registerEvent(
			plugin.app.vault.on('rename', (file, oldPath) => {
				const timer = this.plugin.settings.activeTimer;
				if (timer?.taskPath !== oldPath) return;
				timer.taskPath = file.path;
				void this.plugin.saveSettings();
			}),
		);
		this.render();
	}

	get isRunning(): boolean {
		return this.plugin.settings.activeTimer !== null;
	}

	private get taskFile(): TFile | null {
		const timer = this.plugin.settings.activeTimer;
		return timer ? this.plugin.app.vault.getFileByPath(timer.taskPath) : null;
	}

	private render(): void {
		const timer = this.plugin.settings.activeTimer;
		if (!timer) {
			this.statusBarEl.hide();
			return;
		}
		const name = this.taskFile?.basename ?? timer.taskPath;
		this.statusBarEl.setText(`⏱ ${name} ${formatElapsed(Date.now() - timer.startedAt)}`);
		this.statusBarEl.show();
	}

	async start(file: TFile): Promise<void> {
		const current = this.taskFile;
		if (current) {
			new Notice(`A timer is already running for ${current.basename}. Stop it first.`);
			return;
		}
		this.plugin.settings.activeTimer = { taskPath: file.path, startedAt: Date.now() };
		await this.plugin.saveSettings();
		await this.plugin.app.fileManager.processFrontMatter(file, (fm: Frontmatter) => {
			if (fm[PROP.status] === undefined || fm[PROP.status] === 'Not started') {
				fm[PROP.status] = 'Doing';
			}
		});
		this.render();
	}

	stop(): void {
		const timer = this.plugin.settings.activeTimer;
		if (!timer) return;
		const file = this.taskFile;
		if (!file) {
			new Notice(`The timed task ${timer.taskPath} no longer exists; the timer was discarded.`);
			void this.clear();
			return;
		}

		const start = new Date(timer.startedAt);
		const hours = roundHours((Date.now() - timer.startedAt) / 3_600_000);
		new LogWorkModal(this.plugin.app, {
			taskName: file.basename,
			measured: { start, hours },
			onSubmit: async (entry) => {
				await appendWorkLog(this.plugin.app, file, entry);
				await this.clear();
			},
			onDiscard: () => this.clear(),
		}).open();
	}

	private async clear(): Promise<void> {
		this.plugin.settings.activeTimer = null;
		await this.plugin.saveSettings();
		this.render();
	}
}
