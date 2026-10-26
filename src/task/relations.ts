import { App, TFile, parseLinktext } from 'obsidian';
import { PROP, toWikilink, type Frontmatter } from './properties';

function resolveLink(app: App, value: unknown, sourcePath: string): TFile | null {
	if (typeof value !== 'string') return null;
	const match = /^\[\[([^\]|]+)(\|[^\]]*)?\]\]$/.exec(value.trim());
	if (!match?.[1]) return null;
	return app.metadataCache.getFirstLinkpathDest(parseLinktext(match[1]).path, sourcePath);
}

export async function setParent(app: App, file: TFile, parent: TFile): Promise<void> {
	await app.fileManager.processFrontMatter(file, (fm: Frontmatter) => {
		fm[PROP.parent] = toWikilink(app, parent, file.path);
	});
}

/** Returns false when `blocker` is already listed. */
export async function addBlocker(app: App, file: TFile, blocker: TFile): Promise<boolean> {
	let added = false;
	await app.fileManager.processFrontMatter(file, (fm: Frontmatter) => {
		const current = fm[PROP.blockedBy];
		const list: unknown[] = Array.isArray(current) ? current : current ? [current] : [];
		if (list.some((v) => resolveLink(app, v, file.path) === blocker)) return;
		fm[PROP.blockedBy] = [...list, toWikilink(app, blocker, file.path)];
		added = true;
	});
	return added;
}
