# Create subtask of current task

開いているタスクを親として、サブタスクを作成します。

## 利用条件

タスクノート上でのみ使えます。

## 手順

1. 親にしたいタスクのノートを開きます。
2. **Create subtask of current task** を実行します。
3. [Create task](create-task.md) と同じ項目（**Title**、**Estimate**、**Due date**、**Deadline**）を入力し、**Create** を選択します。

ダイアログのタイトルは `New subtask of <親タスク名>` になります。

## 挙動

- サブタスクは必ず親タスクと同じ Base に作成されます（**Base** の選択項目は表示されません）。
- サブタスクの `parent` プロパティに、親タスクへのリンク（`[[親タスク名]]`）が入ります。
- 入力の検証やファイル名の扱いは [Create task](create-task.md) と同じです。

## 関連ページ

- [Set parent task](set-parent.md): 既存のタスクの親を後から設定する
