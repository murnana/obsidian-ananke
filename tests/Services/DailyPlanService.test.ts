/**
 * DailyPlanService の単体テスト
 *
 * DailyPlanService のメソッドの大部分は Obsidian の vault（ファイル I/O）に依存するが、
 * recalculateStartTimes() は引数のみで完結する純粋関数であるため、
 * App モックなしで直接テストできる。
 *
 * テスト対象:
 *   - recalculateStartTimes() : タスクの開始時刻を計算・更新する純粋関数
 */
import { describe, it, expect, vi } from 'vitest';
import { DailyPlanService } from 'Services/DailyPlanService';
import type { IDailyPlan } from 'Models/IDailyPlan';
import type { ITask } from 'Models/ITask';

// ---------------------------------------------------------------------------
// テスト用ユーティリティ
// ---------------------------------------------------------------------------

/**
 * ITask のテスト用ファクトリ。
 * order のみ必須で、残りのフィールドはデフォルト値を使用する。
 */
function makeTask(overrides: Partial<ITask> & { order: number }): ITask {
	return {
		name: `タスク ${overrides.order}`,
		estimatedDuration: 30,
		section: null,
		category: null,
		routineId: null,
		plannedStart: '00:00', // テスト後に recalculateStartTimes で上書きされる
		...overrides,
	};
}

/**
 * IDailyPlan のテスト用ファクトリ。
 * 指定したタスク配列を持つ 2026-03-13 の計画を生成する。
 */
function makePlan(tasks: ITask[]): IDailyPlan {
	return {
		date: '2026-03-13',
		created: '2026-03-13T07:00:00.000Z',
		updated: '2026-03-13T07:00:00.000Z',
		filePath: 'ananke-tasks/daily/2026-03-13.md',
		tasks,
	};
}

/**
 * DailyPlanService のテスト用ファクトリ。
 * recalculateStartTimes() は this.app を使用しないため、App は null で代替する。
 */
function makeService(defaultStartTime = '07:00'): DailyPlanService {
	// App はファイル I/O メソッドのみ使用するため、テスト対象メソッドでは不要
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return new DailyPlanService(null as any, 'ananke-tasks', defaultStartTime);
}

// ---------------------------------------------------------------------------
// recalculateStartTimes() のテスト
// ---------------------------------------------------------------------------

describe('DailyPlanService.recalculateStartTimes()', () => {
	it('タスクが空の場合は元のプランをそのまま返す', () => {
		const service = makeService('07:00');
		const plan = makePlan([]);
		const result = service.recalculateStartTimes(plan);
		// タスクが 0 件のプランは変更なしで返ること
		expect(result.tasks).toHaveLength(0);
	});

	it('1タスクの場合は defaultStartTime から開始する', () => {
		const service = makeService('07:00');
		const plan = makePlan([
			makeTask({ order: 1, estimatedDuration: 30 }),
		]);
		const result = service.recalculateStartTimes(plan);
		// 最初のタスクは defaultStartTime（07:00）から始まること
		expect(result.tasks[0].plannedStart).toBe('07:00');
	});

	it('複数タスクの開始時刻が累積で計算される', () => {
		const service = makeService('07:00');
		const plan = makePlan([
			makeTask({ order: 1, estimatedDuration: 30 }), // 07:00 ～ 07:30
			makeTask({ order: 2, estimatedDuration: 45 }), // 07:30 ～ 08:15
			makeTask({ order: 3, estimatedDuration: 15 }), // 08:15 ～ 08:30
		]);
		const result = service.recalculateStartTimes(plan);

		// 各タスクの開始時刻が前のタスクの終了時刻と一致すること
		expect(result.tasks[0].plannedStart).toBe('07:00');
		expect(result.tasks[1].plannedStart).toBe('07:30');
		expect(result.tasks[2].plannedStart).toBe('08:15');
	});

	it('異なる defaultStartTime が反映される', () => {
		// 09:30 スタートの設定で計算されること
		const service = makeService('09:30');
		const plan = makePlan([
			makeTask({ order: 1, estimatedDuration: 60 }), // 09:30 ～ 10:30
			makeTask({ order: 2, estimatedDuration: 30 }), // 10:30 ～ 11:00
		]);
		const result = service.recalculateStartTimes(plan);

		expect(result.tasks[0].plannedStart).toBe('09:30');
		expect(result.tasks[1].plannedStart).toBe('10:30');
	});

	it('order 順にソートして開始時刻を計算する', () => {
		const service = makeService('07:00');
		// tasks を逆順（order: 3, 1, 2）で渡しても、order 順に開始時刻が割り当てられること
		const plan = makePlan([
			makeTask({ order: 3, estimatedDuration: 20 }),
			makeTask({ order: 1, estimatedDuration: 30 }),
			makeTask({ order: 2, estimatedDuration: 15 }),
		]);
		const result = service.recalculateStartTimes(plan);

		// order 1 → 2 → 3 の順で開始時刻が計算されているか検証
		const sorted = [...result.tasks].sort((a, b) => a.order - b.order);
		expect(sorted[0].plannedStart).toBe('07:00'); // order 1: 07:00 ～ 07:30
		expect(sorted[1].plannedStart).toBe('07:30'); // order 2: 07:30 ～ 07:45
		expect(sorted[2].plannedStart).toBe('07:45'); // order 3: 07:45 ～ 08:05
	});

	it('日をまたぐ時刻も正しく計算される', () => {
		// 23:30 スタートのタスクは日付をまたいでも先頭は正しい時刻になること
		const service = makeService('23:30');
		const plan = makePlan([
			makeTask({ order: 1, estimatedDuration: 60 }),
		]);
		const result = service.recalculateStartTimes(plan);
		expect(result.tasks[0].plannedStart).toBe('23:30');
	});
});
