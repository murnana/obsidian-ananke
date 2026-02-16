/**
 * Task plan definition from daily plan file.
 * Does not include execution state (status, actual times).
 * Execution state is stored separately in time log CSV (Phase 2).
 */
export interface ITask {
	/**
	 * Display name of the task
	 */
	name: string;

	/**
	 * Estimated duration in minutes
	 */
	estimatedDuration: number;

	/**
	 * Section of the day (e.g., Morning, AM, PM, Evening)
	 * null if not assigned to a section
	 */
	section: string | null;

	/**
	 * Category label (e.g., Work, Personal, Break)
	 * null if not categorized
	 */
	category: string | null;

	/**
	 * Reference to source routine ID if task was derived from a routine (Phase 3)
	 * null if task was created manually
	 */
	routineId: string | null;

	/**
	 * Execution order (1-based)
	 * Used for task sequencing and reordering
	 */
	order: number;

	/**
	 * Planned start time in HH:mm format (24-hour)
	 * Auto-calculated from previous tasks' estimated durations
	 */
	plannedStart: string;
}
