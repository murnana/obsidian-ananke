import { ITask } from './ITask';

/**
 * Daily plan containing ordered tasks for a single day.
 * Stored as Markdown file at {taskFolder}/daily/{YYYY-MM-DD}.md
 *
 * Note: Task execution state (status, actual durations) is NOT stored here.
 * Execution records are stored in time log CSV (Phase 2).
 */
export interface IDailyPlan {
	/**
	 * Date in YYYY-MM-DD format
	 */
	date: string;

	/**
	 * Ordered list of tasks for this day
	 */
	tasks: ITask[];

	/**
	 * Creation timestamp in ISO 8601 format
	 */
	created: string;

	/**
	 * Last update timestamp in ISO 8601 format
	 */
	updated: string;

	/**
	 * Relative file path within the vault
	 */
	filePath: string;
}
