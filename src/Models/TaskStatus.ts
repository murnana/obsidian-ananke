/**
 * Task execution status used in CSV time log (Phase 2).
 * Defined in Phase 1 for completeness but not yet used.
 *
 * Status values:
 * - pending: Task has not been started yet
 * - in_progress: Task is currently running (timer active)
 * - completed: Task was successfully completed
 * - skipped: Task was interrupted or skipped
 */
export type TaskStatus = "pending" | "in_progress" | "completed" | "skipped";
