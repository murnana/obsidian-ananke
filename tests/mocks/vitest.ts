/**
 * vitest が未インストールの環境向け互換シム。
 * Node.js 組み込みの node:test・node:assert を使って vitest 互換の API を提供する。
 *
 * テストファイルが `import { describe, it, expect } from 'vitest'` と書いても、
 * tests/run-tests.js のモジュールリダイレクトによってこのファイルが読み込まれる。
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';

// node:test の describe/it/beforeEach/afterEach をそのまま再エクスポート
export { describe, it, beforeEach, afterEach };

/** expect() が返すマッチャーオブジェクトの型定義 */
interface ExpectResult {
	/** 厳密等価（===）で比較する */
	toBe(expected: unknown): void;
	/** ディープイコールで比較する */
	toEqual(expected: unknown): void;
	/** 配列・文字列などの length プロパティを検証する */
	toHaveLength(length: number): void;
	/** null であることを検証する */
	toBeNull(): void;
	/** 文字列が指定の部分文字列を含むことを検証する */
	toContain(str: string): void;
	/** 数値が指定値より小さいことを検証する */
	toBeLessThan(n: number): void;
	/** 関数が例外をスローすることを検証する。メッセージの部分一致も指定可能 */
	toThrow(message?: string | RegExp): void;
}

/**
 * vitest の expect() 互換関数。
 * 値を受け取り、各種マッチャーを持つオブジェクトを返す。
 */
export function expect(value: unknown): ExpectResult {
	return {
		toBe(expected: unknown) {
			// 厳密等価（===）で検証
			assert.strictEqual(value, expected);
		},
		toEqual(expected: unknown) {
			// 再帰的な値の等価性を検証
			assert.deepStrictEqual(value, expected);
		},
		toHaveLength(length: number) {
			// 配列・文字列の長さを検証
			assert.strictEqual((value as { length: number }).length, length);
		},
		toBeNull() {
			// null であることを厳密等価で検証
			assert.strictEqual(value, null);
		},
		toContain(str: string) {
			// 文字列に部分文字列が含まれることを検証
			assert.ok(
				typeof value === 'string' && value.includes(str),
				`Expected "${String(value)}" to contain "${str}"`
			);
		},
		toBeLessThan(n: number) {
			// 数値の大小比較を検証
			assert.ok(
				(value as number) < n,
				`Expected ${String(value)} to be less than ${n}`
			);
		},
		toThrow(expected?: string | RegExp) {
			// 関数が例外をスローするかどうかを検証する
			// value が関数であることを前提とする（例: expect(() => fn()).toThrow(...)）
			let threw = false;
			let thrownError: unknown;
			try {
				if (typeof value === 'function') value();
			} catch (e) {
				threw = true;
				thrownError = e;
			}
			// 例外がスローされなかった場合は失敗
			assert.ok(threw, 'Expected function to throw but it did not');
			// 期待するメッセージが指定されている場合は内容も検証する
			if (expected !== undefined) {
				const msg = thrownError instanceof Error
					? thrownError.message
					: String(thrownError);
				if (typeof expected === 'string') {
					// 文字列の場合は部分一致で検証
					assert.ok(
						msg.includes(expected),
						`Expected error message "${msg}" to contain "${expected}"`
					);
				} else {
					// 正規表現の場合はパターンマッチで検証
					assert.ok(
						expected.test(msg),
						`Expected error message "${msg}" to match ${String(expected)}`
					);
				}
			}
		},
	};
}

/**
 * vitest の vi オブジェクトの最小スタブ。
 * 現時点でテストコードが使用していない機能はすべて no-op として定義する。
 */
export const vi = {
	/** モック関数を生成する（現時点では何もしない no-op 関数を返す） */
	fn: () => () => undefined,
};
