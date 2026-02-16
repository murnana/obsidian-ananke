import { IDailyPlan } from 'Models/IDailyPlan';
import { ITask } from 'Models/ITask';

/**
 * Parser for daily plan Markdown files.
 * Handles conversion between Markdown format and IDailyPlan objects.
 *
 * File format:
 * ---
 * ananke-type: daily-plan
 * date: "YYYY-MM-DD"
 * created: "ISO8601"
 * updated: "ISO8601"
 * ---
 *
 * # Plan for YYYY-MM-DD
 *
 * ## Task List
 *
 * - HH:mm TaskName [estimated::N] [section::S] [category::C] [routine-id::ID] [order::N]
 */
export class DailyPlanParser {
	private static readonly FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---/;
	private static readonly YAML_LINE_REGEX = /^(\w[\w-]*): "?([^"\n]*)"?$/;
	private static readonly INLINE_FIELD_REGEX = /\[(\w[\w-]*)::([^\]]*)\]/g;
	private static readonly TASK_ROW_REGEX = /^- (\d{2}:\d{2}) (.+)$/;

	/**
	 * Parse Markdown content into an IDailyPlan object.
	 * @throws Error if content is invalid or required fields are missing
	 */
	static parse(content: string, filePath: string): IDailyPlan {
		// Extract frontmatter
		const frontmatterMatch = content.match(this.FRONTMATTER_REGEX);
		if (!frontmatterMatch) {
			throw new Error('Missing frontmatter in daily plan file');
		}

		const frontmatter = this.parseFrontmatter(frontmatterMatch[1]);

		// Validate required frontmatter fields
		if (!frontmatter.date) {
			throw new Error('Missing required field: date');
		}
		if (!frontmatter.created) {
			throw new Error('Missing required field: created');
		}
		if (!frontmatter.updated) {
			throw new Error('Missing required field: updated');
		}
		if (frontmatter['ananke-type'] !== 'daily-plan') {
			throw new Error('Invalid ananke-type: expected "daily-plan"');
		}

		// Extract task rows
		const lines = content.split('\n');
		const tasks: ITask[] = [];
		let order = 1;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			if (line.startsWith('- ') && line.match(/^\- \d{2}:\d{2}/)) {
				try {
					const task = this.parseTaskRow(line, order);
					tasks.push(task);
					order++;
				} catch (error) {
					console.error(`Failed to parse task at line ${i + 1}: ${line}`, error);
					throw new Error(`Invalid task row at line ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
				}
			}
		}

		return {
			date: frontmatter.date,
			tasks,
			created: frontmatter.created,
			updated: frontmatter.updated,
			filePath
		};
	}

	/**
	 * Serialize an IDailyPlan object into Markdown content.
	 */
	static serialize(plan: IDailyPlan): string {
		const lines: string[] = [];

		// Build frontmatter
		lines.push('---');
		lines.push('ananke-type: daily-plan');
		lines.push(`date: "${plan.date}"`);
		lines.push(`created: "${plan.created}"`);
		lines.push(`updated: "${plan.updated}"`);
		lines.push('---');
		lines.push('');

		// Add heading
		lines.push(`# Plan for ${plan.date}`);
		lines.push('');

		// Add task list section
		lines.push('## Task List');
		lines.push('');

		// Serialize tasks
		const sortedTasks = [...plan.tasks].sort((a, b) => a.order - b.order);
		for (const task of sortedTasks) {
			lines.push(this.serializeTask(task));
		}

		return lines.join('\n');
	}

	/**
	 * Parse YAML-like frontmatter into a key-value map.
	 */
	private static parseFrontmatter(yaml: string): Record<string, string> {
		const result: Record<string, string> = {};
		const lines = yaml.split('\n');

		for (const line of lines) {
			const match = line.match(this.YAML_LINE_REGEX);
			if (match) {
				const [, key, value] = match;
				result[key] = value;
			}
		}

		return result;
	}

	/**
	 * Parse a single task row into an ITask object.
	 */
	private static parseTaskRow(line: string, defaultOrder: number): ITask {
		const match = line.match(this.TASK_ROW_REGEX);
		if (!match) {
			throw new Error(`Invalid task row format: ${line}`);
		}

		const [, plannedStart, rest] = match;

		// Extract inline fields
		const fields = new Map<string, string>();
		let taskName = rest;

		// Extract all inline fields
		const fieldMatches = Array.from(rest.matchAll(this.INLINE_FIELD_REGEX));
		for (const fieldMatch of fieldMatches) {
			const [fullMatch, key, value] = fieldMatch;
			fields.set(key, value.trim());
			// Remove the field from task name
			taskName = taskName.replace(fullMatch, '');
		}

		// Clean up task name
		taskName = taskName.trim();

		if (!taskName) {
			throw new Error('Task name is empty after field extraction');
		}

		// Parse fields with validation
		const estimatedDuration = parseInt(fields.get('estimated') || '0');
		if (estimatedDuration <= 0) {
			throw new Error('Invalid or missing estimated duration');
		}

		const order = parseInt(fields.get('order') || `${defaultOrder}`);

		return {
			name: taskName,
			estimatedDuration,
			section: fields.get('section') || null,
			category: fields.get('category') || null,
			routineId: fields.get('routine-id') || null,
			order,
			plannedStart
		};
	}

	/**
	 * Serialize an ITask object into a Markdown task row.
	 */
	private static serializeTask(task: ITask): string {
		let row = `- ${task.plannedStart} ${task.name}`;
		row += ` [estimated::${task.estimatedDuration}]`;
		if (task.section) row += ` [section::${task.section}]`;
		if (task.category) row += ` [category::${task.category}]`;
		if (task.routineId) row += ` [routine-id::${task.routineId}]`;
		row += ` [order::${task.order}]`;
		return row;
	}
}
