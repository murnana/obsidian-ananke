# Ananke 新実装計画

[要件定義書](requirements.md) に基づく実装計画。フェーズは「毎日使える最小形」を最短で動かすことを最優先に分割する。

## フェーズ概要

| フェーズ | 名称 | 主な成果物 | 前提 |
|---|---|---|---|
| Phase A | MVP: キャプチャと振り分け | タスクノートモデル、クイックキャプチャ、Inbox / プロジェクトビュー | なし |
| Phase B | 取り込みと磨き込み | チェックボックス昇格、振り分け UX 改善、期日 | Phase A + 日常利用の開始 |
| Phase C | 見直しと整理 | 完了アーカイブ、週次見直し一覧 | Phase B |

**Phase A 完了 = 日常利用開始** がこの計画の最重要マイルストーン。Phase B 以降は実際に使ってみて困った順に着手し、計画を随時見直す。

---

## Phase A: MVP — キャプチャと振り分け

### A-1. タスクノートモデル

`src/Models/`(旧モデルを置き換え):

- `ITaskNote.ts` — `file: TFile`、`title`、`status`(`inbox | todo | doing | done`)、`project: string | null`、`created`
- frontmatter との対応は要件定義書 5 章のとおり

### A-2. タスクノートサービス

`src/Services/TaskNoteService.ts`:

- `createTask(title: string): Promise<TFile>` — `taskFolder` 配下にタスクノートを作成(`status: inbox`)。ファイル名衝突時は連番付与
- `getAllTasks(): TaskNote[]` — `metadataCache` から `ananke-type: task` のノートを列挙
- `getInboxTasks()` / `getTasksByProject()` — フィルタリング
- `updateStatus(task, status)` / `assignProject(task, project)` — `FileManager.processFrontMatter` で frontmatter を更新
- `deleteTask(task)` — ゴミ箱へ移動(`app.fileManager.trashFile`)

frontmatter の読み書きに自前パーサは作らない。旧 `DailyPlanParser` のような正規表現ベースの実装は持たない。

### A-3. クイックキャプチャモーダル

`src/Views/QuickCaptureModal.ts`(`Modal` を継承):

- タイトル入力欄 1 つ + 作成ボタン。Enter で確定
- 作成後に「ノートを開く」導線(任意)

### A-4. タスクビュー

`src/Views/TaskView.ts`(`ItemView` を継承、旧 `DailyPlanView` を置き換え):

- **Inbox セクション**: `project` 未設定タスクの一覧。各行にプロジェクト割当(入力 or 既存プロジェクトから選択)と削除
- **プロジェクトセクション**: `project` 毎にグルーピングした一覧。各行に状態変更(todo / doing / done)
- 各行のタイトルクリックでタスクノートを開く
- `metadataCache` のイベント(`changed` / `deleted`)を購読して再描画

MVP では 1 つのビューに Inbox とプロジェクト一覧を縦に並べる構成で始め、使用感を見てビュー分割を検討する。

### A-5. プラグイン統合(`src/Obsidian/Ananke.ts`)

- コマンド: `capture-task`(クイックキャプチャ)、`open-task-view`(ビューを開く)
- リボンアイコン: キャプチャ用(`plus-circle` 等)とビュー用
- 設定: `taskFolder` は維持。`defaultStartTime` / `showStatusBar` は旧設計由来のため削除
- ステータスバーは MVP では使用しない

### A-6. 旧実装の削除

新実装への置き換えと同時に削除する:

- `src/Views/DailyPlanView.ts`、`src/Services/DailyPlanService.ts`、`src/Parsers/DailyPlanParser.ts`
- `src/Models/` の旧モデル(`IDailyPlan` / `IRoutine` / `IRecurrence` / `ITimeLogEntry` / `TaskStatus` は新定義に置き換え)
- `src/Obsidian/SampleModal.ts`
- `tests/Parsers/DailyPlanParser.test.ts`、`tests/Services/DailyPlanService.test.ts`(新サービスのテストに置き換え)
- `src/styles/daily-plan-view.css`(新ビューのスタイルに置き換え)

### A-7. 周辺整理

- `README.md` をサンプルプラグインの文面から Ananke の説明に書き換え
- `docs/manuals/` の記述を新機能に合わせて更新
- `assets/i18n/ja.json` / `ILocalizeKey.ts` のキーを新 UI に合わせて整理

### Phase A の完了条件

- Obsidian 上で「思いつく → キャプチャ → 振り分け → 状態変更 → ノートに追記」が一通り回る
- `npm run build` が通り、`TaskNoteService` の単体テストがある
- **自分の Vault に導入して日常利用を開始する**

---

## Phase B: 取り込みと磨き込み

日常利用で得た不満を最優先で潰すフェーズ。以下は着手候補であり、順序は利用実感で決める。

- **B-1. チェックボックス昇格**: エディタ上のチェックボックス行(またはテキスト選択)からタスクノートを生成するコマンド。元の行にはタスクノートへのリンクを残す
- **B-2. 振り分け UX 改善**: プロジェクト選択のサジェスト、複数タスクの一括振り分け
- **B-3. 期日**: frontmatter `due` の追加、一覧での期日表示・並び替え・期限切れ強調

## Phase C: 見直しと整理

- **C-1. 完了アーカイブ**: `done` タスクの一覧からの非表示、アーカイブフォルダへの移動コマンド
- **C-2. 週次見直し一覧**: 長期間 `doing` のまま / 古い `inbox` のタスクを検出して一覧化

---

## 既存資産の扱い(まとめ)

| 資産 | 扱い |
|---|---|
| `src/i18n/`(Localize, ILocalizeKey) | 流用 |
| `src/Obsidian/AnankeSettingTab.ts`、設定基盤 | 流用(項目は整理) |
| `src/Services/FolderService.ts` | 流用(サブフォルダ構成は簡素化) |
| esbuild + Lightning CSS ビルド、GitHub Actions、テストランナー | 現状のまま流用 |
| デイリープラン関連の実装・テスト・旧モデル | Phase A で削除 |
| `SampleModal.ts`、サンプル README | Phase A で削除・書き換え |
| 旧設計ドキュメント(overview / data-model / features / phases) | 削除済み(git 履歴から参照可能) |

## 検証方針

- パース処理を持たないため、テストの中心は `TaskNoteService` のロジック(列挙・フィルタ・frontmatter 更新)。既存の自作テストランナー + Obsidian モックを拡張して対応する
- 各フェーズの完了時に実 Vault での手動確認(キャプチャ〜振り分け〜完了の一連の流れ)を行う
