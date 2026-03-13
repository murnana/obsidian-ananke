/**
 * DailyPlanParser の単体テスト
 *
 * DailyPlanParser は Obsidian API に依存しない純粋な静的メソッドのみで構成されており、
 * モックを必要とせず直接テストできる。
 *
 * テスト対象:
 *   - parse()     : Markdown 文字列 → IDailyPlan
 *   - serialize() : IDailyPlan → Markdown 文字列
 *   - ラウンドトリップ: serialize → parse でデータが完全に復元されること
 */
import { describe, it, expect } from 'vitest';
import { DailyPlanParser } from 'Parsers/DailyPlanParser';
import type { IDailyPlan } from 'Models/IDailyPlan';

// ---------------------------------------------------------------------------
// テスト用フィクスチャ
// ---------------------------------------------------------------------------

/**
 * 各テストケースで共通して使用する正常な Markdown コンテンツ。
 * section・category あり/なしのタスクが混在している。
 */
const VALID_CONTENT = `---
ananke-type: daily-plan
date: "2026-03-13"
created: "2026-03-13T07:00:00.000Z"
updated: "2026-03-13T07:00:00.000Z"
---

# Plan for 2026-03-13

## Task List

- 07:00 朝のルーティン [estimated::30] [section::Morning] [category::Personal] [order::1]
- 07:30 メール確認 [estimated::15] [category::Work] [order::2]
- 07:45 コーディング [estimated::60] [order::3]
`;

/** テスト用ファイルパス（パス解決の検証にも使用） */
const FILE_PATH = 'ananke-tasks/daily/2026-03-13.md';

// ---------------------------------------------------------------------------
// parse() のテスト
// ---------------------------------------------------------------------------

describe('DailyPlanParser.parse()', () => {
	it('正常なMarkdownを正しくパースする', () => {
		const plan = DailyPlanParser.parse(VALID_CONTENT, FILE_PATH);

		// フロントマターの各フィールドが正しく読み込まれているか
		expect(plan.date).toBe('2026-03-13');
		expect(plan.created).toBe('2026-03-13T07:00:00.000Z');
		expect(plan.updated).toBe('2026-03-13T07:00:00.000Z');
		expect(plan.filePath).toBe(FILE_PATH);
		// タスクが 3 件パースされているか
		expect(plan.tasks).toHaveLength(3);
	});

	it('タスクのフィールドを正しくパースする（section・category あり）', () => {
		const plan = DailyPlanParser.parse(VALID_CONTENT, FILE_PATH);
		const task = plan.tasks[0]; // 朝のルーティン

		expect(task.name).toBe('朝のルーティン');
		expect(task.estimatedDuration).toBe(30);
		expect(task.section).toBe('Morning');
		expect(task.category).toBe('Personal');
		expect(task.routineId).toBeNull(); // routine-id なし → null
		expect(task.order).toBe(1);
		expect(task.plannedStart).toBe('07:00');
	});

	it('section なしのタスクは section が null になる', () => {
		const plan = DailyPlanParser.parse(VALID_CONTENT, FILE_PATH);
		const task = plan.tasks[1]; // メール確認（section 未指定）

		expect(task.name).toBe('メール確認');
		expect(task.section).toBeNull();
		expect(task.category).toBe('Work');
	});

	it('section・category・routineId なしのタスクはすべて null になる', () => {
		const plan = DailyPlanParser.parse(VALID_CONTENT, FILE_PATH);
		const task = plan.tasks[2]; // コーディング（すべてのオプションフィールド未指定）

		expect(task.name).toBe('コーディング');
		expect(task.section).toBeNull();
		expect(task.category).toBeNull();
		expect(task.routineId).toBeNull();
	});

	it('routine-id フィールドを正しくパースする', () => {
		// routine-id を持つタスクを含む Markdown
		const content = `---
ananke-type: daily-plan
date: "2026-03-13"
created: "2026-03-13T07:00:00.000Z"
updated: "2026-03-13T07:00:00.000Z"
---

## Task List

- 07:00 朝体操 [estimated::10] [routine-id::routine-001] [order::1]
`;
		const plan = DailyPlanParser.parse(content, FILE_PATH);
		expect(plan.tasks[0].routineId).toBe('routine-001');
	});

	it('フロントマターがない場合はエラーをスローする', () => {
		// "---" 区切りのフロントマターが存在しない Markdown
		const content = `# Plan for 2026-03-13\n\n## Task List\n`;
		expect(() => DailyPlanParser.parse(content, FILE_PATH))
			.toThrow('Missing frontmatter in daily plan file');
	});

	it('date フィールドがない場合はエラーをスローする', () => {
		const content = `---
ananke-type: daily-plan
created: "2026-03-13T07:00:00.000Z"
updated: "2026-03-13T07:00:00.000Z"
---
`;
		expect(() => DailyPlanParser.parse(content, FILE_PATH))
			.toThrow('Missing required field: date');
	});

	it('created フィールドがない場合はエラーをスローする', () => {
		const content = `---
ananke-type: daily-plan
date: "2026-03-13"
updated: "2026-03-13T07:00:00.000Z"
---
`;
		expect(() => DailyPlanParser.parse(content, FILE_PATH))
			.toThrow('Missing required field: created');
	});

	it('updated フィールドがない場合はエラーをスローする', () => {
		const content = `---
ananke-type: daily-plan
date: "2026-03-13"
created: "2026-03-13T07:00:00.000Z"
---
`;
		expect(() => DailyPlanParser.parse(content, FILE_PATH))
			.toThrow('Missing required field: updated');
	});

	it('ananke-type が daily-plan でない場合はエラーをスローする', () => {
		// ananke-type が "routine" など別の値の場合
		const content = `---
ananke-type: routine
date: "2026-03-13"
created: "2026-03-13T07:00:00.000Z"
updated: "2026-03-13T07:00:00.000Z"
---
`;
		expect(() => DailyPlanParser.parse(content, FILE_PATH))
			.toThrow('Invalid ananke-type: expected "daily-plan"');
	});

	it('推定時間が 0 のタスクはエラーをスローする', () => {
		// [estimated::0] → 0 分は無効
		const content = `---
ananke-type: daily-plan
date: "2026-03-13"
created: "2026-03-13T07:00:00.000Z"
updated: "2026-03-13T07:00:00.000Z"
---

## Task List

- 07:00 タスク名 [estimated::0] [order::1]
`;
		expect(() => DailyPlanParser.parse(content, FILE_PATH))
			.toThrow('Invalid or missing estimated duration');
	});

	it('estimated フィールドがないタスクはエラーをスローする', () => {
		// [estimated::N] が存在しないタスク行
		const content = `---
ananke-type: daily-plan
date: "2026-03-13"
created: "2026-03-13T07:00:00.000Z"
updated: "2026-03-13T07:00:00.000Z"
---

## Task List

- 07:00 タスク名 [order::1]
`;
		expect(() => DailyPlanParser.parse(content, FILE_PATH))
			.toThrow('Invalid or missing estimated duration');
	});

	it('タスクのない計画は空の tasks 配列を返す', () => {
		// タスク行が一切ない Markdown（空の計画）
		const content = `---
ananke-type: daily-plan
date: "2026-03-13"
created: "2026-03-13T07:00:00.000Z"
updated: "2026-03-13T07:00:00.000Z"
---

# Plan for 2026-03-13
`;
		const plan = DailyPlanParser.parse(content, FILE_PATH);
		expect(plan.tasks).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// serialize() のテスト
// ---------------------------------------------------------------------------

describe('DailyPlanParser.serialize()', () => {
	it('IDailyPlan を正しい Markdown に変換する', () => {
		// section・category あり/なしのタスクが混在する計画をシリアライズ
		const plan: IDailyPlan = {
			date: '2026-03-13',
			created: '2026-03-13T07:00:00.000Z',
			updated: '2026-03-13T08:00:00.000Z',
			filePath: FILE_PATH,
			tasks: [
				{
					name: 'タスク A',
					estimatedDuration: 30,
					section: 'Morning',
					category: 'Work',
					routineId: null,
					order: 1,
					plannedStart: '07:00',
				},
				{
					name: 'タスク B',
					estimatedDuration: 60,
					section: null,   // section なし → 出力に含まれない
					category: null,  // category なし → 出力に含まれない
					routineId: null,
					order: 2,
					plannedStart: '07:30',
				},
			],
		};

		const output = DailyPlanParser.serialize(plan);

		// フロントマターの各フィールドが出力されているか
		expect(output).toContain('ananke-type: daily-plan');
		expect(output).toContain('date: "2026-03-13"');
		expect(output).toContain('created: "2026-03-13T07:00:00.000Z"');
		expect(output).toContain('updated: "2026-03-13T08:00:00.000Z"');
		// 見出し行が出力されているか
		expect(output).toContain('# Plan for 2026-03-13');
		expect(output).toContain('## Task List');
		// タスク行のフォーマットが正しいか（オプションフィールドの有無）
		expect(output).toContain('- 07:00 タスク A [estimated::30] [section::Morning] [category::Work] [order::1]');
		expect(output).toContain('- 07:30 タスク B [estimated::60] [order::2]');
	});

	it('タスクは order 順でシリアライズされる', () => {
		// tasks 配列に order が逆順のタスクを渡しても、出力では order 順になること
		const plan: IDailyPlan = {
			date: '2026-03-13',
			created: '2026-03-13T07:00:00.000Z',
			updated: '2026-03-13T07:00:00.000Z',
			filePath: FILE_PATH,
			tasks: [
				{
					name: 'タスク 2',
					estimatedDuration: 30,
					section: null,
					category: null,
					routineId: null,
					order: 2,
					plannedStart: '07:30',
				},
				{
					name: 'タスク 1',
					estimatedDuration: 30,
					section: null,
					category: null,
					routineId: null,
					order: 1,
					plannedStart: '07:00',
				},
			],
		};

		const output = DailyPlanParser.serialize(plan);
		// order: 1 のタスクが order: 2 のタスクより前に出力されること
		const task1Pos = output.indexOf('タスク 1');
		const task2Pos = output.indexOf('タスク 2');
		expect(task1Pos).toBeLessThan(task2Pos);
	});
});

// ---------------------------------------------------------------------------
// ラウンドトリップテスト（serialize → parse）
// ---------------------------------------------------------------------------

describe('DailyPlanParser ラウンドトリップ', () => {
	it('serialize → parse で元のデータが完全に復元される', () => {
		// serialize した後 parse しても、すべてのフィールドが同一になること
		const original: IDailyPlan = {
			date: '2026-03-13',
			created: '2026-03-13T07:00:00.000Z',
			updated: '2026-03-13T08:00:00.000Z',
			filePath: FILE_PATH,
			tasks: [
				{
					name: '朝のルーティン',
					estimatedDuration: 30,
					section: 'Morning',
					category: 'Personal',
					routineId: 'routine-001', // routine-id あり
					order: 1,
					plannedStart: '07:00',
				},
				{
					name: 'コーディング',
					estimatedDuration: 90,
					section: null,
					category: 'Work',
					routineId: null,
					order: 2,
					plannedStart: '07:30',
				},
			],
		};

		const serialized = DailyPlanParser.serialize(original);
		const parsed = DailyPlanParser.parse(serialized, FILE_PATH);

		// メタデータの検証
		expect(parsed.date).toBe(original.date);
		expect(parsed.created).toBe(original.created);
		expect(parsed.updated).toBe(original.updated);
		expect(parsed.tasks).toHaveLength(original.tasks.length);

		// 各タスクのすべてのフィールドが復元されているか検証
		for (let i = 0; i < original.tasks.length; i++) {
			expect(parsed.tasks[i].name).toBe(original.tasks[i].name);
			expect(parsed.tasks[i].estimatedDuration).toBe(original.tasks[i].estimatedDuration);
			expect(parsed.tasks[i].section).toBe(original.tasks[i].section);
			expect(parsed.tasks[i].category).toBe(original.tasks[i].category);
			expect(parsed.tasks[i].routineId).toBe(original.tasks[i].routineId);
			expect(parsed.tasks[i].order).toBe(original.tasks[i].order);
			expect(parsed.tasks[i].plannedStart).toBe(original.tasks[i].plannedStart);
		}
	});
});
