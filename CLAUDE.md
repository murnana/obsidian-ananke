# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ananke is a personal task management plugin for Obsidian, built around quick capture into an inbox and per-project task organization. Each task is a single Markdown note (one task = one note) living alongside the user's other notes. Built with TypeScript and bundled with esbuild. The primary target audience is Japanese-speaking users (Japanese is the fallback locale).

## Build Commands

- `npm run dev` — Start esbuild in watch mode with inline source maps
- `npm run build` — TypeScript type-check (`tsc -noEmit -skipLibCheck`) then production bundle (minified, no source maps)
- `npm version patch|minor|major` — Bump version in package.json, manifest.json, and versions.json

There is no test runner configured. Linting uses ESLint with TypeScript rules but there is no dedicated `lint` script; run `npx eslint src/` directly.

## Architecture

**Entry point:** `src/main.ts` re-exports the main plugin class.

**`src/Obsidian/`** — Core plugin code:
- `Ananke.ts` — Main plugin class extending Obsidian's `Plugin`. Handles lifecycle (`onload`/`onunload`), initializes i18n, registers commands, ribbon icons, settings tab, and event listeners.
- `ISetings.ts` / `DefaultSettings.ts` — Settings interface and defaults. Current setting: `taskFolder` (default: `'ananke-tasks'`).
- `AnankeSettingTab.ts` — Settings UI tab using Obsidian's `PluginSettingTab`.
- `SampleModal.ts` — Placeholder modal dialog.

**`src/i18n/`** — Internationalization:
- `Localize.ts` — Wrapper around `i18next`. Static `Initialize()` factory loads translations from `assets/i18n/` JSON files. Fallback language is Japanese (`ja`).
- `ILocalizeKey.ts` — Type-safe localization keys using a `DotKeys` utility type that converts nested object paths to dot-notation strings (e.g., `settings.folders.tasks.name`).

**`assets/i18n/`** — Translation JSON files (currently `ja.json`).

## Build System

esbuild bundles `src/main.ts` → `main.js` (CommonJS, ES2018 target). External modules: `obsidian`, `electron`, `@codemirror/*`, `@lezer/*`, and Node builtins. Distribution requires three files: `main.js`, `manifest.json`, `styles.css`.

## Conventions

- **Indentation:** Tabs, 4-character width (see `.editorconfig`)
- **Line endings:** LF
- Interfaces are prefixed with `I` (e.g., `ISettings`)
- Source is organized by domain: `/Obsidian` for plugin code, `/i18n` for localization
- `tsconfig.json` uses `baseUrl: ./src` for imports
- Strict TypeScript: `noImplicitAny` and `strictNullChecks` enabled
- The runtime dependency is `i18next`; everything else is dev-only

## Development Plan

Requirements and the implementation plan are in `docs/plan/` (written in Japanese):

- `requirements.md` — Why the project was restarted, concept (inbox capture + per-project management), data model (one task = one note with frontmatter), MVP scope, and explicit non-goals (timers, time logs, estimation analytics, routines)
- `implementation-plan.md` — Phases A (MVP: capture modal, task note service, inbox/project view) → B (checkbox promotion, due dates) → C (archive, review), plus which existing code is kept vs. deleted

The earlier TaskChute-based design (daily plans, time tracking, routines) was abandoned in 2026-07; its documents were deleted and the Phase 1 implementation (`DailyPlanView` and related services/parsers) is slated for removal when the new implementation replaces it.
