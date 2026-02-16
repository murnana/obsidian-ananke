import { App, normalizePath, moment } from 'obsidian';
import { IDailyPlan } from 'Models/IDailyPlan';
import { ITask } from 'Models/ITask';
import { DailyPlanParser } from 'Parsers/DailyPlanParser';

/**
 * Service for managing daily plan operations.
 * Handles CRUD operations for daily plan files and task management.
 */
export class DailyPlanService {
	constructor(
		private app: App,
		private taskFolder: string,
		private defaultStartTime: string
	) {}

	/**
	 * Get file path for a given date.
	 */
	private getFilePath(date: string): string {
		return normalizePath(`${this.taskFolder}/daily/${date}.md`);
	}

	/**
	 * Load daily plan for a given date.
	 * Returns null if file doesn't exist.
	 * @throws Error if file exists but is invalid
	 */
	async loadPlan(date: string): Promise<IDailyPlan | null> {
		const filePath = this.getFilePath(date);
		const exists = await this.app.vault.adapter.exists(filePath);

		if (!exists) {
			return null;
		}

		try {
			const content = await this.app.vault.adapter.read(filePath);
			return DailyPlanParser.parse(content, filePath);
		} catch (error) {
			console.error(`Failed to parse ${filePath}:`, error);
			throw error;
		}
	}

	/**
	 * Save daily plan to file.
	 */
	async savePlan(plan: IDailyPlan): Promise<void> {
		// Update the updated timestamp
		plan.updated = moment().toISOString();

		const content = DailyPlanParser.serialize(plan);
		await this.app.vault.adapter.write(plan.filePath, content);
	}

	/**
	 * Create a new empty daily plan for a given date.
	 */
	createEmptyPlan(date: string): IDailyPlan {
		const now = moment().toISOString();
		return {
			date,
			tasks: [],
			created: now,
			updated: now,
			filePath: this.getFilePath(date)
		};
	}

	/**
	 * Add a task to a plan.
	 * Creates a new plan if it doesn't exist.
	 * Recalculates start times for all tasks.
	 */
	async addTask(
		date: string,
		task: Omit<ITask, 'order' | 'plannedStart'>
	): Promise<void> {
		let plan = await this.loadPlan(date);
		if (!plan) {
			plan = this.createEmptyPlan(date);
		}

		const newTask: ITask = {
			...task,
			order: plan.tasks.length + 1,
			plannedStart: '00:00' // Will be recalculated
		};

		plan.tasks.push(newTask);
		plan = this.recalculateStartTimes(plan);

		await this.savePlan(plan);
	}

	/**
	 * Remove a task by order.
	 * Renumbers remaining tasks and recalculates start times.
	 */
	async removeTask(date: string, order: number): Promise<void> {
		const plan = await this.loadPlan(date);
		if (!plan) {
			return;
		}

		// Filter out the task
		plan.tasks = plan.tasks.filter(t => t.order !== order);

		// Renumber remaining tasks
		plan.tasks.sort((a, b) => a.order - b.order);
		plan.tasks.forEach((t, i) => t.order = i + 1);

		// Recalculate start times
		const updatedPlan = this.recalculateStartTimes(plan);

		await this.savePlan(updatedPlan);
	}

	/**
	 * Reorder tasks by new order array.
	 * @param newOrder Array of task orders in new sequence
	 */
	async reorderTasks(date: string, newOrder: number[]): Promise<void> {
		const plan = await this.loadPlan(date);
		if (!plan) {
			return;
		}

		// Create map of old order -> task
		const taskMap = new Map<number, ITask>();
		plan.tasks.forEach(t => taskMap.set(t.order, t));

		// Rebuild tasks array in new order
		plan.tasks = newOrder.map((oldOrder, i) => {
			const task = taskMap.get(oldOrder);
			if (!task) {
				throw new Error(`Task with order ${oldOrder} not found`);
			}
			task.order = i + 1;
			return task;
		});

		// Recalculate start times
		const updatedPlan = this.recalculateStartTimes(plan);

		await this.savePlan(updatedPlan);
	}

	/**
	 * Recalculate planned start times based on task order and estimated durations.
	 * Uses the default start time setting as the starting point.
	 */
	recalculateStartTimes(plan: IDailyPlan): IDailyPlan {
		if (plan.tasks.length === 0) {
			return plan;
		}

		let currentTime = moment(this.defaultStartTime, 'HH:mm');

		// Sort by order first
		const sortedTasks = [...plan.tasks].sort((a, b) => a.order - b.order);

		for (const task of sortedTasks) {
			task.plannedStart = currentTime.format('HH:mm');
			currentTime.add(task.estimatedDuration, 'minutes');
		}

		return { ...plan, tasks: sortedTasks };
	}
}
