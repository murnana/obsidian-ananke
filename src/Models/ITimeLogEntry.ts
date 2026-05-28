import { TaskStatus } from "./TaskStatus";

/**
 * Time log entry representing task execution record.
 * Stored in CSV files at {taskFolder}/logs/{YYYY-MM}.csv
 * Records actual start/end times, duration, and execution status.
 */
export interface ITimeLogEntry {
	/**
	 * Task execution date in YYYY-MM-DD format
	 */
	date: string;

	/**
	 * Task display name
	 */
	taskName: string;

	/**
	 * Source routine ID if this task was derived from a routine
	 * null if task was created manually
	 */
	routineId: string | null;

	/**
	 * Section of the day (e.g., Morning, AM, PM, Evening)
	 * null if not assigned
	 */
	section: string | null;

	/**
	 * Category label (e.g., Work, Personal, Break)
	 * null if not categorized
	 */
	category: string | null;

	/**
	 * Estimated duration in minutes
	 */
	estimatedMin: number;

	/**
	 * Planned start time in HH:mm format (24-hour)
	 */
	plannedStart: string;

	/**
	 * Actual start time in HH:mm format (24-hour)
	 * null if not yet started
	 */
	actualStart: string | null;

	/**
	 * Actual end time in HH:mm format (24-hour)
	 * null if not yet completed; may be a next-day time (e.g., 00:30)
	 */
	actualEnd: string | null;

	/**
	 * Actual duration in minutes
	 * Auto-calculated from actualEnd - actualStart; null if task has not completed
	 */
	actualMin: number | null;

	/**
	 * Execution status
	 */
	status: TaskStatus;

	/**
	 * Optional notes; empty string if none
	 */
	note: string;
}
