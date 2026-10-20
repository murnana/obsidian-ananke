# Enforce base definitions

登録済みのすべての Base ファイルに、Ananke の管理内容を書き込み直します。

## 利用条件

常時使えます。

## 手順

**Enforce base definitions** を実行します。通知は表示されません（失敗した場合と、Base ファイルを解釈できなかった場合を除く）。

## 管理される内容

| 対象 | 内容 |
|---|---|
| 全体のフィルター | タスクフォルダ内のファイルのみを対象にする条件（`file.inFolder("<タスクフォルダ>")`） |
| プロパティの表示名 | `note.status` → Status、`note.due` → Due date、`note.deadline` → Deadline、`note.estimate` → Estimate、`note.logged` → Logging time、`note.parent` → Parent、`note.blocked-by` → Blocked by |
| **Active** ビュー | archive フォルダ内のタスクを除外するテーブルビュー |
| **Archive** ビュー | archive フォルダ内のタスクだけを表示するテーブルビュー |

- **Active** / **Archive** ビューがなければ作成されます。列は `file.name` と各プロパティの順です。
- 既存のビューがある場合は、フィルターの管理部分だけが更新され、列の並びなどは変わりません。
- 上記以外の内容（独自のフィルター、他のビュー、他のプロパティ設定）は保持されます。
- タスクフォルダ・archive フォルダ・Base ファイルが存在しなければ作成されます。

## 自動実行

このコマンドの内容は、次のタイミングでも自動的に実行されます。

- Obsidian の起動後（レイアウトの準備完了時）
- 登録済み Base ファイルが変更されたとき（0.5 秒の間を置いて実行）
- Base ファイルやタスクフォルダの名前変更・移動で、登録内容のパスが更新されたとき

そのため、管理対象の部分を手で書き換えても、保存のたびに元の内容に戻ります。変更したい場合は、管理対象外の部分で行ってください。

## 注意点

- Base ファイルが YAML として解釈できない場合は、`Could not parse <path>; base definition was not enforced.` と通知され、ファイルは書き換えられません。
- 書き込み時は、YAML が Obsidian の標準的な形式で再出力されます。コメントなどの書式は保持されない場合があります。

## 関連ページ

- [Register a base](register-base.md)
- [トラブルシューティング](../troubleshooting.md)
