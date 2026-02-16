import { ItemView, WorkspaceLeaf, moment, Menu } from 'obsidian';
import { DailyPlanService } from 'Services/DailyPlanService';
import { FolderService } from 'Services/FolderService';
import { IDailyPlan } from 'Models/IDailyPlan';
import { ITask } from 'Models/ITask';
import { Localize } from 'i18n/Localize';

export const VIEW_TYPE_DAILY_PLAN = 'ananke-daily-plan';

/**
 * Daily Plan View - Main view for managing daily task plans.
 *
 * Features:
 * - Date navigation (previous/next/today)
 * - Task list grouped by section
 * - Add/delete/reorder tasks
 * - Summary information (projected end time, task count, total time)
 */
export class DailyPlanView extends ItemView {
	private currentDate: moment.Moment;
	private currentPlan: IDailyPlan | null = null;
	private dailyPlanService: DailyPlanService;
	private folderService: FolderService;
	private i18n: Localize;

	constructor(
		leaf: WorkspaceLeaf,
		dailyPlanService: DailyPlanService,
		folderService: FolderService,
		i18n: Localize
	) {
		super(leaf);
		this.currentDate = moment();
		this.dailyPlanService = dailyPlanService;
		this.folderService = folderService;
		this.i18n = i18n;
	}

	getViewType(): string {
		return VIEW_TYPE_DAILY_PLAN;
	}

	getDisplayText(): string {
		return (this.i18n as any).Translation('views.dailyPlan.title') || 'Daily Plan';
	}

	getIcon(): string {
		return 'calendar-check';
	}

	async onOpen(): Promise<void> {
		// Initialize folders if needed
		try {
			await this.folderService.initializeStructure();
		} catch (error) {
			console.error('Failed to initialize folders:', error);
		}

		// Initial render
		await this.render();
	}

	async onClose(): Promise<void> {
		// Cleanup if needed
	}

	/**
	 * Main render method - rebuilds entire view.
	 */
	private async render(): Promise<void> {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass('ananke-daily-plan-view');

		// Load plan for current date
		try {
			this.currentPlan = await this.dailyPlanService.loadPlan(
				this.currentDate.format('YYYY-MM-DD')
			);

			if (!this.currentPlan) {
				this.currentPlan = this.dailyPlanService.createEmptyPlan(
					this.currentDate.format('YYYY-MM-DD')
				);
			}
		} catch (error) {
			console.error('Failed to load plan:', error);
			// Show error but allow empty plan
			this.currentPlan = this.dailyPlanService.createEmptyPlan(
				this.currentDate.format('YYYY-MM-DD')
			);
		}

		// Build UI
		this.renderHeader(container);
		this.renderSummary(container);
		this.renderTaskList(container);
		this.renderAddTaskForm(container);
	}

	/**
	 * Render date navigation header.
	 */
	private renderHeader(container: HTMLElement): void {
		const header = container.createDiv({ cls: 'ananke-header' });

		// Previous button
		const prevBtn = header.createEl('button', { text: '←' });
		prevBtn.addEventListener('click', () => this.navigatePrevious());

		// Date display
		header.createEl('span', {
			cls: 'ananke-date',
			text: this.currentDate.format('ddd, MMM DD, YYYY')
		});

		// Next button
		const nextBtn = header.createEl('button', { text: '→' });
		nextBtn.addEventListener('click', () => this.navigateNext());

		// Today button
		const todayBtn = header.createEl('button', {
			text: (this.i18n as any).Translation('views.dailyPlan.today') || 'Today'
		});
		todayBtn.addEventListener('click', () => this.navigateToday());
	}

	/**
	 * Render summary information (projected end, task count, total time).
	 */
	private renderSummary(container: HTMLElement): void {
		if (!this.currentPlan) return;

		const summary = container.createDiv({ cls: 'ananke-summary' });

		const taskCount = this.currentPlan.tasks.length;
		const totalMinutes = this.currentPlan.tasks.reduce(
			(sum, t) => sum + t.estimatedDuration, 0
		);

		// Calculate projected end time (Phase 1: simple calculation, no execution state)
		const firstTask = this.currentPlan.tasks[0];
		const startTime = firstTask ? firstTask.plannedStart : '07:00';
		const projectedEnd = moment(startTime, 'HH:mm').add(totalMinutes, 'minutes');

		const projectedEndLabel = (this.i18n as any).Translation('views.dailyPlan.projectedEnd') || 'Projected End';
		const totalTasksLabel = (this.i18n as any).Translation('views.dailyPlan.totalTasks') || 'Tasks';
		const totalTimeLabel = (this.i18n as any).Translation('views.dailyPlan.totalTime') || 'Total';

		summary.createEl('span', {
			text: `${projectedEndLabel}: ${projectedEnd.format('HH:mm')}`
		});
		summary.createEl('span', {
			text: ` | ${totalTasksLabel}: ${taskCount}`
		});
		summary.createEl('span', {
			text: ` | ${totalTimeLabel}: ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
		});
	}

	/**
	 * Render task list grouped by section.
	 */
	private renderTaskList(container: HTMLElement): void {
		if (!this.currentPlan) return;

		const taskListContainer = container.createDiv({ cls: 'ananke-task-list' });

		// Group tasks by section
		const grouped = this.groupTasksBySection(this.currentPlan.tasks);

		for (const [section, tasks] of grouped) {
			this.renderSection(taskListContainer, section, tasks);
		}
	}

	/**
	 * Render a section with its tasks.
	 */
	private renderSection(container: HTMLElement, sectionName: string, tasks: ITask[]): void {
		const sectionContainer = container.createDiv({ cls: 'ananke-section' });

		// Section header
		sectionContainer.createEl('h3', {
			cls: 'ananke-section-header',
			text: `── ${sectionName} ────────────`
		});

		// Task rows
		for (const task of tasks) {
			this.renderTaskRow(sectionContainer, task);
		}
	}

	/**
	 * Render a single task row.
	 */
	private renderTaskRow(container: HTMLElement, task: ITask): void {
		const row = container.createDiv({ cls: 'ananke-task-row' });

		// Status icon (Phase 1: always pending)
		row.createEl('span', { cls: 'ananke-task-status', text: '☐' });

		// Planned start time
		row.createEl('span', { cls: 'ananke-task-time', text: task.plannedStart });

		// Task name
		row.createEl('span', { cls: 'ananke-task-name', text: task.name });

		// Estimated duration
		row.createEl('span', {
			cls: 'ananke-task-duration',
			text: `${task.estimatedDuration}m`
		});

		// Action buttons
		const actions = row.createDiv({ cls: 'ananke-task-actions' });

		// Up button
		const upBtn = actions.createEl('button', { text: '↑' });
		upBtn.addEventListener('click', () => this.moveTaskUp(task.order));

		// Down button
		const downBtn = actions.createEl('button', { text: '↓' });
		downBtn.addEventListener('click', () => this.moveTaskDown(task.order));

		// Context menu for delete
		row.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			this.showTaskContextMenu(e, task);
		});
	}

	/**
	 * Render add task form.
	 */
	private renderAddTaskForm(container: HTMLElement): void {
		const formContainer = container.createDiv({ cls: 'ananke-add-task' });

		// Simple inline form
		const form = formContainer.createEl('div');

		const nameInput = form.createEl('input', {
			type: 'text',
			placeholder: (this.i18n as any).Translation('views.dailyPlan.taskNamePlaceholder') || 'Task name'
		});

		const durationInput = form.createEl('input', {
			type: 'number',
			placeholder: (this.i18n as any).Translation('views.dailyPlan.durationPlaceholder') || 'Duration (min)'
		});
		durationInput.setAttribute('min', '1');

		const sectionInput = form.createEl('input', {
			type: 'text',
			placeholder: (this.i18n as any).Translation('views.dailyPlan.sectionPlaceholder') || 'Section (optional)'
		});

		const categoryInput = form.createEl('input', {
			type: 'text',
			placeholder: (this.i18n as any).Translation('views.dailyPlan.categoryPlaceholder') || 'Category (optional)'
		});

		const addBtn = form.createEl('button', {
			text: (this.i18n as any).Translation('views.dailyPlan.addTask') || 'Add'
		});

		addBtn.addEventListener('click', async () => {
			const name = nameInput.value.trim();
			const duration = parseInt(durationInput.value);

			if (!name || !duration || duration < 1) {
				// Show validation error
				return;
			}

			await this.dailyPlanService.addTask(this.currentDate.format('YYYY-MM-DD'), {
				name,
				estimatedDuration: duration,
				section: sectionInput.value.trim() || null,
				category: categoryInput.value.trim() || null,
				routineId: null
			});

			// Clear form and re-render
			nameInput.value = '';
			durationInput.value = '';
			sectionInput.value = '';
			categoryInput.value = '';

			await this.render();
		});
	}

	/**
	 * Move task up in order.
	 */
	private async moveTaskUp(order: number): Promise<void> {
		if (!this.currentPlan || order <= 1) return;

		const newOrder = this.currentPlan.tasks
			.sort((a, b) => a.order - b.order)
			.map(t => t.order);

		// Swap order-1 and order
		const idx = newOrder.indexOf(order);
		[newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];

		await this.dailyPlanService.reorderTasks(
			this.currentDate.format('YYYY-MM-DD'),
			newOrder
		);

		await this.render();
	}

	/**
	 * Move task down in order.
	 */
	private async moveTaskDown(order: number): Promise<void> {
		if (!this.currentPlan || order >= this.currentPlan.tasks.length) return;

		const newOrder = this.currentPlan.tasks
			.sort((a, b) => a.order - b.order)
			.map(t => t.order);

		// Swap order and order+1
		const idx = newOrder.indexOf(order);
		[newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];

		await this.dailyPlanService.reorderTasks(
			this.currentDate.format('YYYY-MM-DD'),
			newOrder
		);

		await this.render();
	}

	/**
	 * Show context menu for task actions.
	 */
	private showTaskContextMenu(event: MouseEvent, task: ITask): void {
		const menu = new Menu();

		const deleteLabel = (this.i18n as any).Translation('views.dailyPlan.deleteTask') || 'Delete';

		menu.addItem((item) => {
			item.setTitle(deleteLabel)
				.setIcon('trash')
				.onClick(async () => {
					await this.dailyPlanService.removeTask(
						this.currentDate.format('YYYY-MM-DD'),
						task.order
					);
					await this.render();
				});
		});

		menu.showAtMouseEvent(event);
	}

	/**
	 * Group tasks by section.
	 */
	private groupTasksBySection(tasks: ITask[]): Map<string, ITask[]> {
		const sectionOrder = ['Morning', 'AM', 'PM', 'Evening', 'Other'];
		const grouped = new Map<string, ITask[]>();

		for (const task of tasks) {
			const section = task.section || 'Other';
			if (!grouped.has(section)) {
				grouped.set(section, []);
			}
			grouped.get(section)!.push(task);
		}

		// Sort groups by section order
		const sorted = new Map<string, ITask[]>();
		for (const section of sectionOrder) {
			if (grouped.has(section)) {
				sorted.set(section, grouped.get(section)!);
			}
		}

		return sorted;
	}

	/**
	 * Navigate to a specific date.
	 */
	private navigateToDate(date: moment.Moment): void {
		this.currentDate = date;
		this.render();
	}

	/**
	 * Navigate to previous day.
	 */
	private navigatePrevious(): void {
		this.navigateToDate(this.currentDate.clone().subtract(1, 'day'));
	}

	/**
	 * Navigate to next day.
	 */
	private navigateNext(): void {
		this.navigateToDate(this.currentDate.clone().add(1, 'day'));
	}

	/**
	 * Navigate to today.
	 */
	private navigateToday(): void {
		this.navigateToDate(moment());
	}
}
