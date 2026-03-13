import { describe, it, expect, vi } from 'vitest';
import { DailyPlanService } from 'Services/DailyPlanService';
import type { IDailyPlan } from 'Models/IDailyPlan';
import type { ITask } from 'Models/ITask';

function makeTask(overrides: Partial<ITask> & { order: number }): ITask {
	return {
		name: `タスク ${overrides.order}`,
		estimatedDuration: 30,
		section: null,
		category: null,
		routineId: null,
		plannedStart: '00:00',
		...overrides,
	};
}

function makePlan(tasks: ITask[]): IDailyPlan {
	return {
		date: '2026-03-13',
		created: '2026-03-13T07:00:00.000Z',
		updated: '2026-03-13T07:00:00.000Z',
		filePath: 'ananke-tasks/daily/2026-03-13.md',
		tasks,
	};
}

function makeService(defaultStartTime = '07:00'): DailyPlanService {
	// App はファイル I/O メソッドのみ使用するため、テスト対象メソッドでは不要
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return new DailyPlanService(null as any, 'ananke-tasks', defaultStartTime);
}

describe('DailyPlanService.recalculateStartTimes()', () => {
	it('タスクが空の場合は元のプランをそのまま返す', () => {
		const service = makeService('07:00');
		const plan = makePlan([]);
		const result = service.recalculateStartTimes(plan);
		expect(result.tasks).toHaveLength(0);
	});

	it('1タスクの場合は defaultStartTime から開始する', () => {
		const service = makeService('07:00');
		const plan = makePlan([
			makeTask({ order: 1, estimatedDuration: 30 }),
		]);
		const result = service.recalculateStartTimes(plan);
		expect(result.tasks[0].plannedStart).toBe('07:00');
	});

	it('複数タスクの開始時刻が累積で計算される', () => {
		const service = makeService('07:00');
		const plan = makePlan([
			makeTask({ order: 1, estimatedDuration: 30 }),
			makeTask({ order: 2, estimatedDuration: 45 }),
			makeTask({ order: 3, estimatedDuration: 15 }),
		]);
		const result = service.recalculateStartTimes(plan);

		expect(result.tasks[0].plannedStart).toBe('07:00');
		expect(result.tasks[1].plannedStart).toBe('07:30');
		expect(result.tasks[2].plannedStart).toBe('08:15');
	});

	it('異なる defaultStartTime が反映される', () => {
		const service = makeService('09:30');
		const plan = makePlan([
			makeTask({ order: 1, estimatedDuration: 60 }),
			makeTask({ order: 2, estimatedDuration: 30 }),
		]);
		const result = service.recalculateStartTimes(plan);

		expect(result.tasks[0].plannedStart).toBe('09:30');
		expect(result.tasks[1].plannedStart).toBe('10:30');
	});

	it('order 順にソートして開始時刻を計算する', () => {
		const service = makeService('07:00');
		// 逆順で渡す
		const plan = makePlan([
			makeTask({ order: 3, estimatedDuration: 20 }),
			makeTask({ order: 1, estimatedDuration: 30 }),
			makeTask({ order: 2, estimatedDuration: 15 }),
		]);
		const result = service.recalculateStartTimes(plan);

		// order 1 → 2 → 3 の順で並んでいるはず
		const sorted = [...result.tasks].sort((a, b) => a.order - b.order);
		expect(sorted[0].plannedStart).toBe('07:00');
		expect(sorted[1].plannedStart).toBe('07:30');
		expect(sorted[2].plannedStart).toBe('07:45');
	});

	it('日をまたぐ時刻も正しく計算される', () => {
		const service = makeService('23:30');
		const plan = makePlan([
			makeTask({ order: 1, estimatedDuration: 60 }),
		]);
		const result = service.recalculateStartTimes(plan);
		expect(result.tasks[0].plannedStart).toBe('23:30');
	});
});
