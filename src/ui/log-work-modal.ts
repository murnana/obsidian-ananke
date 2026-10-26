import { App, Modal, Notice, Setting } from 'obsidian';
import { isValidDate, roundHours } from '../task/properties';
import { formatDate, formatEntryHeading, type WorkLogEntry } from '../worklog/worklog';

export interface LogWorkOptions {
	taskName: string;
	/** Set when the time comes from a timer; only the memo is asked for. */
	measured?: { start: Date; hours: number };
	onSubmit: (entry: WorkLogEntry) => Promise<void>;
	onDiscard?: () => Promise<void>;
}

export class LogWorkModal extends Modal {
	private date = formatDate(new Date());
	private time = '';
	private hours = '';
	private memoEl!: HTMLTextAreaElement;

	constructor(
		app: App,
		private readonly options: LogWorkOptions,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl, options } = this;
		this.setTitle(`Log work: ${options.taskName}`);

		if (options.measured) {
			const { start, hours } = options.measured;
			contentEl.createEl('p', {
				text: formatEntryHeading({ start, hasTime: true, hours, memo: '' }).replace(/^### /, ''),
			});
		} else {
			new Setting(contentEl).setName('Date').addText((text) => {
				text.inputEl.type = 'date';
				text.setValue(this.date).onChange((value) => (this.date = value));
			});
			new Setting(contentEl)
				.setName('Start time')
				.setDesc('Optional.')
				.addText((text) => {
					text.inputEl.type = 'time';
					text.onChange((value) => (this.time = value));
				});
			new Setting(contentEl)
				.setName('Hours')
				.setDesc('Decimal hours, e.g. 1.5.')
				.addText((text) => {
					text.inputEl.type = 'number';
					text.inputEl.step = '0.25';
					text.inputEl.min = '0';
					text.onChange((value) => (this.hours = value));
				});
		}

		new Setting(contentEl).setName('Memo').setDesc('Saved as Markdown in the note.').setHeading();
		this.memoEl = contentEl.createEl('textarea', { cls: 'ananke-memo' });
		this.memoEl.focus();

		const buttons = new Setting(contentEl);
		if (options.onDiscard) {
			const onDiscard = options.onDiscard;
			buttons.addButton((button) =>
				button
					.setButtonText('Discard')
					.onClick(async () => {
						await onDiscard();
						this.close();
					}),
			);
		}
		buttons.addButton((button) =>
			button
				.setButtonText('Save')
				.setCta()
				.onClick(() => void this.submit()),
		);
		this.scope.register(['Mod'], 'Enter', () => {
			void this.submit();
			return false;
		});
	}

	private buildEntry(): WorkLogEntry | null {
		const memo = this.memoEl.value;
		const { measured } = this.options;
		if (measured) return { start: measured.start, hasTime: true, hours: measured.hours, memo };

		const hours = roundHours(Number.parseFloat(this.hours));
		if (!Number.isFinite(hours) || hours <= 0) {
			new Notice('Enter the hours worked.');
			return null;
		}
		if (!isValidDate(this.date)) {
			new Notice('Enter a valid date.');
			return null;
		}
		const [y = 0, mo = 1, d = 1] = this.date.split('-').map(Number);
		const time = /^(\d{2}):(\d{2})$/.exec(this.time);
		const start = new Date(y, mo - 1, d, Number(time?.[1] ?? 0), Number(time?.[2] ?? 0));
		return { start, hasTime: time !== null, hours, memo };
	}

	private async submit(): Promise<void> {
		const entry = this.buildEntry();
		if (!entry) return;
		try {
			await this.options.onSubmit(entry);
			this.close();
		} catch (error) {
			console.error('Ananke: failed to log work', error);
			new Notice('Failed to log work.');
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
