import { Notice, TFile } from 'obsidian';
import { enforceAllBases } from './base/base-file';
import type AnankePlugin from './main';
import type { BaseRegistration } from './settings';
import { archiveTask, restoreTask } from './task/archive';
import { fillAllTasks } from './task/auto-fill';
import { addBlocker, setParent } from './task/relations';
import { findBaseForPath, isArchived, isTaskFile, listTasks } from './task/registry';
import { CreateTaskModal } from './ui/create-task-modal';
import { LogWorkModal } from './ui/log-work-modal';
import { RegisterBaseModal } from './ui/register-base-modal';
import { TaskSuggestModal } from './ui/suggest';
import { appendWorkLog } from './worklog/worklog';

interface ActiveTask {
	file: TFile;
	reg: BaseRegistration;
}

function activeTask(plugin: AnankePlugin): ActiveTask | null {
	const file = plugin.app.workspace.getActiveFile();
	if (!isTaskFile(plugin.settings, file)) return null;
	const reg = findBaseForPath(plugin.settings, file.path);
	return reg ? { file, reg } : null;
}

function report(action: Promise<unknown>, failure: string): void {
	action.catch((error) => {
		console.error(`Ananke: ${failure}`, error);
		new Notice(failure);
	});
}

/** Registers a command that is only available while a task note is active. */
function addTaskCommand(
	plugin: AnankePlugin,
	id: string,
	name: string,
	run: (task: ActiveTask) => void,
	when: (task: ActiveTask) => boolean = () => true,
): void {
	plugin.addCommand({
		id,
		name,
		checkCallback: (checking) => {
			const task = activeTask(plugin);
			if (!task || !when(task)) return false;
			if (!checking) run(task);
			return true;
		},
	});
}

function otherTasks({ file, reg }: ActiveTask, plugin: AnankePlugin): TFile[] {
	return listTasks(plugin.app, reg).filter((f) => f !== file);
}

export function registerCommands(plugin: AnankePlugin): void {
	const { app } = plugin;

	plugin.addCommand({
		id: 'register-base',
		name: 'Register a base',
		callback: () => new RegisterBaseModal(app, plugin).open(),
	});

	plugin.addCommand({
		id: 'create-task',
		name: 'Create task',
		callback: () => {
			const [first] = plugin.settings.bases;
			if (!first) {
				new Notice('Register a base first.');
				return;
			}
			const reg = activeTask(plugin)?.reg ?? first;
			new CreateTaskModal(app, plugin, reg).open();
		},
	});

	addTaskCommand(plugin, 'create-subtask', 'Create subtask of current task', ({ file, reg }) =>
		new CreateTaskModal(app, plugin, reg, file).open(),
	);

	plugin.addCommand({
		id: 'fill-missing-properties',
		name: 'Fill missing task properties',
		callback: () =>
			report(
				fillAllTasks(plugin).then((count) => new Notice(`Updated ${count} task(s).`)),
				'Failed to fill task properties.',
			),
	});

	plugin.addCommand({
		id: 'enforce-base-definitions',
		name: 'Enforce base definitions',
		callback: () => void enforceAllBases(plugin),
	});

	addTaskCommand(plugin, 'set-parent', 'Set parent task', (task) =>
		new TaskSuggestModal(app, otherTasks(task, plugin), 'Choose the parent task', (parent) =>
			report(setParent(app, task.file, parent), 'Failed to set the parent task.'),
		).open(),
	);

	addTaskCommand(plugin, 'add-blocker', 'Add blocking task', (task) =>
		new TaskSuggestModal(
			app,
			otherTasks(task, plugin),
			'Choose a task that must finish first',
			(blocker) =>
				report(
					addBlocker(app, task.file, blocker).then((added) => {
						if (!added) new Notice(`${blocker.basename} is already a blocker.`);
					}),
					'Failed to add the blocking task.',
				),
		).open(),
	);

	addTaskCommand(
		plugin,
		'archive-task',
		'Archive task',
		({ file, reg }) => report(archiveTask(app, reg, file), 'Failed to archive the task.'),
		({ file, reg }) => !isArchived(reg, file.path),
	);

	addTaskCommand(
		plugin,
		'restore-task',
		'Restore task from archive',
		({ file, reg }) => report(restoreTask(app, reg, file), 'Failed to restore the task.'),
		({ file, reg }) => isArchived(reg, file.path),
	);

	addTaskCommand(
		plugin,
		'start-timer',
		'Start timer',
		({ file }) => report(plugin.timer.start(file), 'Failed to start the timer.'),
		() => !plugin.timer.isRunning,
	);

	plugin.addCommand({
		id: 'stop-timer',
		name: 'Stop timer',
		checkCallback: (checking) => {
			if (!plugin.timer.isRunning) return false;
			if (!checking) plugin.timer.stop();
			return true;
		},
	});

	addTaskCommand(plugin, 'log-work', 'Log work manually', ({ file }) =>
		new LogWorkModal(app, {
			taskName: file.basename,
			onSubmit: (entry) => appendWorkLog(app, file, entry),
		}).open(),
	);
}
