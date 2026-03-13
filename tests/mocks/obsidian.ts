/**
 * 'obsidian' モジュールの最小限モック。
 * テスト対象のソースファイルが実際に使用しているエクスポートのみを実装する。
 * moment は外部パッケージへの依存を避けるため、組み込みの Date を使って最小限に再実装している。
 */

// ---------------------------------------------------------------------------
// moment 最小実装
// ---------------------------------------------------------------------------

/** moment オブジェクトが持つメソッドの型定義 */
interface MomentLike {
	/** 指定フォーマットで日時を文字列に変換する */
	format(fmt: string): string;
	/** 指定した量・単位だけ時刻を加算する（破壊的変更） */
	add(amount: number, unit: string): MomentLike;
	/** ISO 8601 形式の文字列を返す */
	toISOString(): string;
}

/**
 * Date オブジェクトを受け取り、MomentLike オブジェクトを生成する内部ファクトリ。
 * 渡された Date のコピーを内部で保持するため、元の Date は変更されない。
 */
function createMoment(date: Date): MomentLike {
	// 元の Date を変更しないようコピーを取る
	const d = new Date(date.getTime());

	const obj: MomentLike = {
		format(fmt: string): string {
			if (fmt === 'HH:mm') {
				// 時・分をゼロ埋めして "HH:mm" 形式で返す
				const hh = String(d.getHours()).padStart(2, '0');
				const mm = String(d.getMinutes()).padStart(2, '0');
				return `${hh}:${mm}`;
			}
			// 未対応フォーマットは ISO 8601 文字列にフォールバック
			return d.toISOString();
		},
		add(amount: number, unit: string): MomentLike {
			if (unit === 'minutes') {
				d.setMinutes(d.getMinutes() + amount);
			} else if (unit === 'hours') {
				d.setHours(d.getHours() + amount);
			}
			return obj; // メソッドチェーンのために自身を返す
		},
		toISOString(): string {
			return d.toISOString();
		},
	};

	return obj;
}

/**
 * moment() ファクトリ関数。以下の呼び出し形式に対応:
 *   moment()                  → 現在時刻
 *   moment(timeStr, 'HH:mm') → "HH:mm" 文字列を 1970-01-01 基準の Date に変換
 */
export function moment(timeStr?: string, format?: string): MomentLike {
	if (timeStr !== undefined && format === 'HH:mm') {
		const [hours, minutes] = timeStr.split(':').map(Number);
		// テストでは日付は関係なく時刻のみを扱うため、基準日は 1970-01-01 とする
		const d = new Date(1970, 0, 1, hours, minutes, 0, 0);
		return createMoment(d);
	}
	return createMoment(new Date());
}

// ---------------------------------------------------------------------------
// normalizePath
// ---------------------------------------------------------------------------

/**
 * パス区切り文字を正規化する。
 * バックスラッシュをスラッシュに変換し、連続するスラッシュを単一にまとめる。
 */
export function normalizePath(path: string): string {
	return path.replace(/\\/g, '/').replace(/\/+/g, '/');
}

// ---------------------------------------------------------------------------
// Notice
// ---------------------------------------------------------------------------

/**
 * Obsidian の通知 UI クラスのモック。
 * テスト実行中は何も表示せず無視する。
 */
export class Notice {
	constructor(_message: string, _timeout?: number) {
		// テスト環境では通知を表示しないため何もしない
	}
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

/**
 * Obsidian の App クラスのモック。
 * ファイル I/O を伴うメソッドをテストする際は、
 * テストコード内で別途スタブを渡すこと。
 */
export class App {}
