/**
 * Vitest API shim for test environments where vitest is not installed.
 * Uses Node.js built-in node:test and node:assert modules.
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';

export { describe, it, beforeEach, afterEach };

interface ExpectResult {
	toBe(expected: unknown): void;
	toEqual(expected: unknown): void;
	toHaveLength(length: number): void;
	toBeNull(): void;
	toContain(str: string): void;
	toBeLessThan(n: number): void;
	toThrow(message?: string | RegExp): void;
}

export function expect(value: unknown): ExpectResult {
	return {
		toBe(expected: unknown) {
			assert.strictEqual(value, expected);
		},
		toEqual(expected: unknown) {
			assert.deepStrictEqual(value, expected);
		},
		toHaveLength(length: number) {
			assert.strictEqual((value as { length: number }).length, length);
		},
		toBeNull() {
			assert.strictEqual(value, null);
		},
		toContain(str: string) {
			assert.ok(
				typeof value === 'string' && value.includes(str),
				`Expected "${String(value)}" to contain "${str}"`
			);
		},
		toBeLessThan(n: number) {
			assert.ok(
				(value as number) < n,
				`Expected ${String(value)} to be less than ${n}`
			);
		},
		toThrow(expected?: string | RegExp) {
			let threw = false;
			let thrownError: unknown;
			try {
				if (typeof value === 'function') value();
			} catch (e) {
				threw = true;
				thrownError = e;
			}
			assert.ok(threw, 'Expected function to throw but it did not');
			if (expected !== undefined) {
				const msg = thrownError instanceof Error
					? thrownError.message
					: String(thrownError);
				if (typeof expected === 'string') {
					assert.ok(
						msg.includes(expected),
						`Expected error message "${msg}" to contain "${expected}"`
					);
				} else {
					assert.ok(
						expected.test(msg),
						`Expected error message "${msg}" to match ${String(expected)}`
					);
				}
			}
		},
	};
}

export const vi = {
	fn: () => () => undefined,
};
