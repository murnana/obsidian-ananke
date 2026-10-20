import { App, TFile } from 'obsidian';
import { PROP, roundHours, toNumber, type Frontmatter } from '../task/properties';

export const WORK_LOG_HEADING = '## Work log';

export interface WorkLogEntry {
	/** Start of the work. When `hasTime` is false only the date is meaningful. */
	start: Date;
	hasTime: boolean;
	hours: number;
	memo: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function formatDate(date: Date): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatTime(date: Date): string {
	return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatEntryHeading(entry: WorkLogEntry): string {
	const { start } = entry;
	const hours = `(${roundHours(entry.hours)}h)`;
	if (!entry.hasTime) return `### ${formatDate(start)} ${hours}`;
	const end = new Date(start.getTime() + entry.hours * 3_600_000);
	return `### ${formatDate(start)} ${formatTime(start)}–${formatTime(end)} ${hours}`;
}

/** Inserts `block` at the end of the work log section, creating the section if needed. */
export function insertWorkLog(text: string, block: string): string {
	const lines = text.replace(/\s+$/, '').split('\n');
	const start = lines.findIndex((line) => line.trim() === WORK_LOG_HEADING);
	if (start < 0) {
		const prefix = lines.join('\n');
		return `${prefix}${prefix ? '\n\n' : ''}${WORK_LOG_HEADING}\n\n${block}\n`;
	}

	// The section ends at the next heading of level 1 or 2.
	let end = lines.findIndex((line, i) => i > start && /^#{1,2} /.test(line));
	if (end < 0) end = lines.length;
	const rest = lines.slice(end);
	while (end > start + 1 && lines[end - 1]?.trim() === '') end--;

	const result = [...lines.slice(0, end), '', ...block.split('\n')];
	if (rest.length > 0) result.push('', ...rest);
	return `${result.join('\n')}\n`;
}

/** Appends the entry to the note body and adds its hours to `logged`. */
export async function appendWorkLog(app: App, file: TFile, entry: WorkLogEntry): Promise<void> {
	const memo = entry.memo.trim();
	const block = memo ? `${formatEntryHeading(entry)}\n${memo}` : formatEntryHeading(entry);
	await app.vault.process(file, (text) => insertWorkLog(text, block));
	await app.fileManager.processFrontMatter(file, (fm: Frontmatter) => {
		fm[PROP.logged] = roundHours(toNumber(fm[PROP.logged]) + entry.hours);
	});
}
