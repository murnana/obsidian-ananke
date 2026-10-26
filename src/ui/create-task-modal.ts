import { App, Modal, Notice, Setting, TFile } from 'obsidian';
import type AnankePlugin from '../main';
import type { BaseRegistration } from '../settings';
import { createTask } from '../task/create';
import { isValidDate, isValidDeadline } from '../task/properties';

export class CreateTaskModal extends Modal {
	private reg: BaseRegistration;
	private title = '';
	private estimate = '';
	private due = '';
	private deadline = '';

	constructor(
		app: App,
		private readonly plugin: AnankePlugin,
		initial: BaseRegistration,
		private readonly parent?: TFile,
	) {
		super(app);
		this.reg = initial;
	}

	onOpen(): void {
		const { contentEl } = this;
		this.setTitle(this.parent ? `New subtask of ${this.parent.basename}` : 'New task');

		new Setting(contentEl).setName('Title').addText((text) => {
			text.onChange((value) => (this.title = value));
			window.setTimeout(() => text.inputEl.focus(), 0);
		});

		// A subtask always lives in its parent's base.
		if (!this.parent && this.plugin.settings.bases.length > 1) {
			new Setting(contentEl).setName('Base').addDropdown((dropdown) => {
				for (const reg of this.plugin.settings.bases) {
					dropdown.addOption(reg.basePath, reg.basePath);
				}
				dropdown.setValue(this.reg.basePath).onChange((value) => {
					this.reg = this.plugin.settings.bases.find((r) => r.basePath === value) ?? this.reg;
				});
			});
		}

		new Setting(contentEl)
			.setName('Estimate')
			.setDesc('Hours.')
			.addText((text) => {
				text.inputEl.type = 'number';
				text.inputEl.step = '0.25';
				text.inputEl.min = '0';
				text.onChange((value) => (this.estimate = value));
			});

		new Setting(contentEl).setName('Due date').addText((text) => {
			text.inputEl.type = 'date';
			text.onChange((value) => (this.due = value));
		});

		new Setting(contentEl)
			.setName('Deadline')
			.setDesc('A date, optionally with a time, e.g. 2026-01-31 18:00.')
			.addText((text) => {
				text.onChange((value) => (this.deadline = value));
			});

		new Setting(contentEl).addButton((button) =>
			button
				.setButtonText('Create')
				.setCta()
				.onClick(() => void this.submit()),
		);
		this.scope.register([], 'Enter', () => {
			void this.submit();
			return false;
		});
	}

	private async submit(): Promise<void> {
		const title = this.title.trim();
		if (!title) {
			new Notice('Enter a title.');
			return;
		}
		let estimate: number | undefined;
		if (this.estimate.trim()) {
			estimate = Number.parseFloat(this.estimate);
			if (!Number.isFinite(estimate) || estimate < 0) {
				new Notice('Estimate must be a positive number of hours.');
				return;
			}
		}
		const due = this.due.trim();
		if (due && !isValidDate(due)) {
			new Notice('Due date must be a date.');
			return;
		}
		const deadline = this.deadline.trim().replace(' ', 'T');
		if (deadline && !isValidDeadline(deadline)) {
			new Notice('Deadline must be a date, optionally with a time.');
			return;
		}

		try {
			const file = await createTask(this.app, this.reg, {
				title,
				estimate,
				due: due || undefined,
				deadline: deadline || undefined,
				parent: this.parent,
			});
			this.close();
			await this.app.workspace.getLeaf(false).openFile(file);
		} catch (error) {
			console.error('Ananke: failed to create task', error);
			new Notice('Failed to create the task.');
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
