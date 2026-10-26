import { AbstractInputSuggest, App, FuzzySuggestModal, TFile, TFolder } from 'obsidian';

abstract class PathInputSuggest extends AbstractInputSuggest<string> {
	protected abstract paths(): string[];

	protected getSuggestions(query: string): string[] {
		const q = query.toLowerCase();
		return this.paths()
			.filter((path) => path.toLowerCase().includes(q))
			.sort();
	}

	renderSuggestion(path: string, el: HTMLElement): void {
		el.setText(path);
	}

	selectSuggestion(path: string): void {
		this.setValue(path);
		this.close();
	}
}

export class FolderInputSuggest extends PathInputSuggest {
	protected paths(): string[] {
		return this.app.vault
			.getAllLoadedFiles()
			.filter((f): f is TFolder => f instanceof TFolder && !f.isRoot())
			.map((f) => f.path);
	}
}

export class BaseFileInputSuggest extends PathInputSuggest {
	protected paths(): string[] {
		return this.app.vault
			.getFiles()
			.filter((f) => f.extension === 'base')
			.map((f) => f.path);
	}
}

export class TaskSuggestModal extends FuzzySuggestModal<TFile> {
	constructor(
		app: App,
		private readonly tasks: TFile[],
		placeholder: string,
		private readonly onChoose: (file: TFile) => void,
	) {
		super(app);
		this.setPlaceholder(placeholder);
	}

	getItems(): TFile[] {
		return this.tasks;
	}

	getItemText(file: TFile): string {
		return file.path;
	}

	onChooseItem(file: TFile): void {
		this.onChoose(file);
	}
}
