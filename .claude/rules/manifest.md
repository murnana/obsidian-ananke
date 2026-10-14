---
paths:
  - "manifest.json"
  - "versions.json"
---

# Manifest rules

Constraints from https://docs.obsidian.md/Reference/Manifest. A bad `id` or `name` gets the plugin rejected from the community directory, or delisted if it is already published.

## Fields

- Required: `id`, `name`, `version`, `minAppVersion`, `description`, `author`, `isDesktopOnly`. Optional: `authorUrl`, `fundingUrl`.
- `version` is plain SemVer `x.y.z`, with no `v` prefix and no pre-release suffix.
- Set `isDesktopOnly: true` only if the code uses Node or Electron APIs.
- `fundingUrl` is either a URL string or an object mapping label to URL.
- Set `minAppVersion` to the oldest Obsidian version that actually has every API in use, not a placeholder.

## `id`

- Use only lowercase letters and hyphens (no digits or underscores). Don't end it with `plugin` and don't include `obsidian`.
- During local development, keep it equal to the plugin's folder name under `<Vault>/.obsidian/plugins/`. Otherwise `onExternalSettingsChange` is never called.

## `name`

- Keep it short, in English, with Basic Latin characters only. The only punctuation allowed is hyphens, plus signs and parentheses. No emoji.
- Don't include "Obsidian" (or variants like "Obsi-") or "Plugin".
- Don't use a core plugin or feature name, and keep it unique in the community directory.

## Version files

- Don't hand-edit `version` or `versions.json`. `npm version` runs `version-bump.mjs`, which updates both.
- `versions.json` is a flat object at the repo root: plugin version → minimum Obsidian version. Keep it strict JSON (the docs example has a trailing comma, so don't copy it).
- Its purpose is fallback. When a user's Obsidian is older than `manifest.json`'s `minAppVersion`, Obsidian uses the newest plugin version whose entry is ≤ their app version.
- So the entry for the last release before a `minAppVersion` bump must stay. Never delete or rewrite old entries, or users on older Obsidian lose their fallback.
- Listing every release is allowed but not required. Only a `minAppVersion` change needs a new entry.
