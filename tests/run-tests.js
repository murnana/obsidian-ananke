'use strict';
/**
 * obsidian-ananke 単体テストランナー
 *
 * グローバルインストール済みの ts-node と Node.js 組み込みの node:test を使用します。
 * vitest などのテストフレームワークは npm install 不要です。
 *
 * 前提条件（package.json の test スクリプトで設定済み）:
 *   NODE_PATH=/opt/node22/lib/node_modules:src
 *     /opt/node22/lib/node_modules → ts-node をモジュールとして require できるようにする
 *     src                         → パスエイリアス（Models/*, Parsers/* など）を解決する
 *
 * このファイルで処理するモジュールのリダイレクト:
 *   'obsidian' → tests/mocks/obsidian.ts  （Obsidian API モック）
 *   'vitest'   → tests/mocks/vitest.ts    （node:test ベースの vitest 互換シム）
 */

const Module = require('module');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// ステップ 1: TypeScript コンパイル用に ts-node を登録（CommonJS モード）
// ---------------------------------------------------------------------------
require('ts-node').register({
	project: path.resolve(projectRoot, 'tsconfig.test.json'),
	transpileOnly: true, // 型チェックをスキップしてトランスパイルのみ実行
});

// ---------------------------------------------------------------------------
// ステップ 2: obsidian・vitest のモック差し替えのため Module._resolveFilename を上書き
//             パスエイリアス（Parsers/* など）は NODE_PATH=src で解決済みなので不要
// ---------------------------------------------------------------------------
const originalResolve = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
	// 'obsidian' → Obsidian API モックファイルにリダイレクト
	if (request === 'obsidian') {
		return path.resolve(projectRoot, 'tests', 'mocks', 'obsidian.ts');
	}
	// 'vitest' → node:test ベースの互換シムにリダイレクト
	if (request === 'vitest') {
		return path.resolve(projectRoot, 'tests', 'mocks', 'vitest.ts');
	}
	return originalResolve.call(this, request, parent, isMain, options);
};

// ---------------------------------------------------------------------------
// ステップ 3: テストファイルを検索して読み込む
//             require() 時に node:test へ describe/it が自動登録される
// ---------------------------------------------------------------------------
/**
 * 指定ディレクトリ以下の *.test.ts ファイルを再帰的に収集する。
 * mocks/ ディレクトリはスキップする。
 */
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
