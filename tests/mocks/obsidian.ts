/**
 * Minimal mock for the 'obsidian' module.
 * Only exports used by the source files under test are implemented.
 * moment is re-implemented minimally using built-in Date to avoid external deps.
 */

// ---------------------------------------------------------------------------
// moment minimal implementation
// ---------------------------------------------------------------------------

interface MomentLike {
	format(fmt: string): string;
	add(amount: number, unit: string): MomentLike;
	toISOString(): string;
}

function createMoment(date: Date): MomentLike {
	const d = new Date(date.getTime());

	const obj: MomentLike = {
		format(fmt: string): string {
			if (fmt === 'HH:mm') {
				const hh = String(d.getHours()).padStart(2, '0');
				const mm = String(d.getMinutes()).padStart(2, '0');
				return `${hh}:${mm}`;
			}
			return d.toISOString();
		},
		add(amount: number, unit: string): MomentLike {
			if (unit === 'minutes') {
				d.setMinutes(d.getMinutes() + amount);
			} else if (unit === 'hours') {
				d.setHours(d.getHours() + amount);
			}
			return obj;
		},
		toISOString(): string {
			return d.toISOString();
		},
	};

	return obj;
}

/**
 * moment() factory — supports:
 *   moment()                     → current time
 *   moment(timeStr, 'HH:mm')    → parse HH:mm into a Date (uses 1970-01-01 as base)
 */
export function moment(timeStr?: string, format?: string): MomentLike {
	if (timeStr !== undefined && format === 'HH:mm') {
		const [hours, minutes] = timeStr.split(':').map(Number);
		const d = new Date(1970, 0, 1, hours, minutes, 0, 0);
		return createMoment(d);
	}
	return createMoment(new Date());
}

// ---------------------------------------------------------------------------
// normalizePath
// ---------------------------------------------------------------------------

export function normalizePath(path: string): string {
	return path.replace(/\\/g, '/').replace(/\/+/g, '/');
}

// ---------------------------------------------------------------------------
// Notice
// ---------------------------------------------------------------------------

export class Notice {
	constructor(_message: string, _timeout?: number) {
		// no-op in tests
	}
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export class App {}
