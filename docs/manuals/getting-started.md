# はじめに

プラグインを有効にしてから、最初のタスクの作業を記録するまでの手順です。

## 1. プラグインを有効にする

**Settings → Community plugins** で **Ananke** を有効にします。

## 2. Base を登録する

1. コマンドパレットで **Register a base** を実行します（**Settings → Ananke** の **Register** ボタンからも開けます）。
2. **Base file** に `.base` ファイルのパスを入力します（例: `Projects/Foo/Foo.base`）。存在しなければ新規作成されます。
3. **Task folder** にタスクを置くフォルダを入力します。空欄なら Base と同じ階層の `tasks` フォルダになります。
4. **Register** を選択します。

登録すると、タスクフォルダと `archive` サブフォルダが作られ、Base ファイルに **Active** ビューと **Archive** ビューが追加されます。

詳細は [Register a base](commands/register-base.md) を参照してください。

## 3. タスクを作成する

1. コマンドパレットで **Create task** を実行します。
2. **Title** を入力します。必要に応じて **Estimate**（時間）、**Due date**、**Deadline** も入力します。
3. **Create**（または Enter キー）で作成します。作成したノートはそのまま開きます。

詳細は [Create task](commands/create-task.md) を参照してください。

## 4. 作業時間を記録する

タスクノートを開いた状態で、次のどちらかを使います。

- **タイマー**: **Start timer** で計測を開始し、**Stop timer**（またはステータスバーのタイマー表示を選択）で終了します。終了時にメモを入力して保存します。→ [タイマー](commands/timer.md)
- **手入力**: **Log work manually** で日付・開始時刻・作業時間・メモを入力します。→ [Log work manually](commands/log-work.md)

記録はノート本文の `## Work log` セクションに追加され、`logged` プロパティに作業時間が加算されます。

## 5. 一覧で確認する

登録した Base ファイルを開くと、**Active** ビューに進行中のタスク、**Archive** ビューにアーカイブ済みのタスクが表示されます。

## 次に読むページ

- [基本概念](concepts.md)
- [コマンド一覧](commands/README.md)
