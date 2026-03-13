'use strict';
/**
 * Test runner for obsidian-ananke unit tests.
 *
 * Uses the globally installed ts-node and Node.js built-in node:test runner.
 * No npm install required for vitest or other test frameworks.
 *
 * Requires: NODE_PATH=/opt/node22/lib/node_modules:src (set in package.json script)
 *   /opt/node22/lib/node_modules → makes 'ts-node' findable
 *   src                         → resolves path aliases (Models/*, Parsers/*, etc.)
 *
 * Module redirects handled here:
 *   'obsidian' → tests/mocks/obsidian.ts  (Obsidian API mock)
 *   'vitest'   → tests/mocks/vitest.ts    (vitest API shim using node:test)
 */

const Module = require('module');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Step 1: Register ts-node for TypeScript compilation (CommonJS mode)
// ---------------------------------------------------------------------------
require('ts-node').register({
	project: path.resolve(projectRoot, 'tsconfig.test.json'),
	transpileOnly: true,
});

// ---------------------------------------------------------------------------
// Step 2: Patch Module._resolveFilename for obsidian and vitest mocks only
//         (path aliases like Parsers/* are resolved via NODE_PATH=src)
// ---------------------------------------------------------------------------
const originalResolve = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
	if (request === 'obsidian') {
		return path.resolve(projectRoot, 'tests', 'mocks', 'obsidian.ts');
	}
	if (request === 'vitest') {
		return path.resolve(projectRoot, 'tests', 'mocks', 'vitest.ts');
	}
	return originalResolve.call(this, request, parent, isMain, options);
};

// ---------------------------------------------------------------------------
// Step 3: Discover and load test files (node:test registers them on load)
// ---------------------------------------------------------------------------
function findTestFiles(dir) {
	const files = [];
	let entries;
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return files;
	}
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory() && entry.name !== 'mocks') {
			files.push(...findTestFiles(fullPath));
		} else if (entry.isFile() && entry.name.endsWith('.test.ts')) {
			files.push(fullPath);
		}
	}
	return files;
}

const testFiles = findTestFiles(path.join(projectRoot, 'tests'));
for (const file of testFiles) {
	require(file);
}
