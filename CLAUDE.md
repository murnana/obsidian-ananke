# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

General Obsidian plugin conventions (manifest rules, release basics, security/UX policy, lifecycle and cleanup patterns) live in AGENTS.md:

@AGENTS.md

## Current state

This repo (Ananke, `murnana/obsidian-ananke`) was reset to the unmodified `obsidian-sample-plugin` template. Every identifier is still a placeholder: `manifest.json` (`id: sample-plugin`, author Obsidian), the `package.json` name, README, LICENSE (0-BSD, Dynalist), and the classes `MyPlugin` / `MyPluginSettings` / `SampleSettingTab` / `SampleModal`. Both files in `src/` are template demo code (dice ribbon icon, status bar text, sample commands, global click `Notice`, 5-minute `console.log` interval, `mySetting`), not product behavior.

The pre-reset implementation and its Japanese design docs are in history at `d89d78c` (e.g. `git show d89d78c:docs/plan/requirements.md`). Its manifest id was `murnana-ananke`; no version was ever tagged or released, so the id is still free to choose.

## Commands and verification

- There is no test runner. `npm run build` (`tsc -noEmit -skipLibCheck`, then a minified bundle) and `npm run lint` are the only checks, and exactly what CI runs (`.github/workflows/lint.yml`: `npm ci`, build, lint on Node 20/22/24 for every push and PR).
- Type-check only: `npx tsc -noEmit -skipLibCheck`. Lint one file: `npx eslint src/settings.ts`.
- `npm run dev` is esbuild watch mode and never exits; run it in the background, or use `npm run build` for a one-off bundle.
- API reference: the TSDoc comments in `node_modules/obsidian/obsidian.d.ts` (installed as `obsidian@latest`).

## Build and lint details

- esbuild bundles `src/main.ts` into a root-level `main.js` (CJS, ES2021). `obsidian`, `electron`, `@codemirror/*`, `@lezer/*`, and Node builtins stay external because Obsidian provides them at runtime; any other dependency is bundled into `main.js`. Root `styles.css` ships as-is; there is no CSS build step.
- `tsconfig.json` is `strict` plus `noUncheckedIndexedAccess` (indexed reads are `T | undefined`), `noImplicitReturns`, and `isolatedModules`, and only includes `src/**/*.ts`.
- ESLint is a flat config (`eslint.config.mts`) on `eslint-plugin-obsidianmd`'s recommended rules, type-aware via `projectService`, with browser globals; it also lints `manifest.json`. Type-aware parsing only resolves files in the tsconfig `include` plus `allowDefaultProject`, so new TS files outside `src/` (e.g. a `tests/` dir) must be added to one of those. Root `.mjs` scripts are excluded via `globalIgnores`.
- No formatter is configured; match `.editorconfig` (tabs, single quotes, LF) and the trailing commas in existing code.

## Releasing

1. Hand-edit `minAppVersion` in `manifest.json` if needed.
2. `npm version patch|minor|major`: `version-bump.mjs` copies the new version into `manifest.json` and adds a `versions.json` entry; `.npmrc` makes the tag unprefixed (`1.0.1`, not `v1.0.1`).
3. Push the commit and tag. Any tag push runs `.github/workflows/release.yml`, which builds, attests provenance, and creates a **draft** release with `main.js`, `manifest.json`, `styles.css`; publish it manually on GitHub. Nothing checks that the tag matches `manifest.json`, so always tag via `npm version`.

`develop` is the default branch and PR target; `main` is outdated.
