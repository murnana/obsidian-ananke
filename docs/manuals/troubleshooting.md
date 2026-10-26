# トラブルシューティング

## コマンドパレットにコマンドが表示されない

次のコマンドは、**登録済みのタスクフォルダ内にある Markdown ノートを開いている間だけ**表示されます。

- Create subtask of current task
- Set parent task
- Add blocking task
- Archive task / Restore task from archive
- Start timer
- Log work manually

確認事項:

- 開いているノートが、登録したタスクフォルダの中にあるか（[設定](settings.md)で登録内容を確認）。
- **Archive task** は archive フォルダの外、**Restore task from archive** は archive フォルダの中でのみ表示されます。
- **Start timer** は、すでにタイマーが動いている間は表示されません。
- **Stop timer** は、タイマーが動いている間だけ表示されます。

## 通知メッセージの意味

| 通知 | 意味と対処 |
|---|---|
| `Register a base first.` | Base が 1 つも登録されていません。**Register a base** を実行してください。 |
| `<path> is already registered.` | 同じ Base ファイルがすでに登録されています。 |
| `<folder> overlaps the task folder of <base>.` | 他の登録のタスクフォルダと重なっています。別のフォルダを指定してください。 |
| `The base file must be outside the task folder.` | Base ファイルがタスクフォルダの中にあります。外に置いてください。 |
| `The vault root cannot be a task folder.` | Vault のルートはタスクフォルダにできません。 |
| `Could not parse <path>; base definition was not enforced.` | Base ファイルの YAML が壊れているため、Ananke は書き換えを行いませんでした。ファイルを修正してから [Enforce base definitions](commands/enforce-base-definitions.md) を実行してください。 |
| `<path> was deleted and has been unregistered.` | 登録していた Base ファイルが削除されたため、登録が解除されました。 |
| `A timer is already running for <task>. Stop it first.` | タイマーは同時に 1 つだけです。先に停止してください。 |
| `The timed task <path> no longer exists; the timer was discarded.` | 計測中のタスクノートが削除されたため、タイマーを破棄しました。 |
| `<name> is already a blocker.` | すでに blocker として登録されています。 |

## タスクのプロパティが足りない

タスクフォルダに作成・移動したノートには自動でプロパティが補われますが、Ananke を導入する前から存在するノートには補われません。**Fill missing task properties** を実行してください。→ [Fill missing task properties](commands/fill-missing-properties.md)

## Base ファイルの内容が元に戻される

Ananke は Base ファイルのうち、タスクフォルダの絞り込み、プロパティの表示名、**Active** / **Archive** ビューの絞り込みを管理しています。これらを手で変更しても、Base ファイルを保存するたびに元の状態に戻されます。それ以外の設定（列の並び、他のビュー、追加のフィルターなど）は保持されます。→ [Enforce base definitions](commands/enforce-base-definitions.md)

それでも解決しない場合は、開発者コンソールのエラー（`Ananke:` で始まるメッセージ）を確認してください。
