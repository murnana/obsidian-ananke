# Archive task / Restore task from archive

タスクのノートを、タスクフォルダと archive フォルダの間で移動します。

## 利用条件

タスクノート上でのみ使えます。状況によって、表示されるコマンドが切り替わります。

| コマンド | 表示される条件 |
|---|---|
| **Archive task** | 開いているタスクが archive フォルダの外にある |
| **Restore task from archive** | 開いているタスクが archive フォルダの中にある |

## 手順

1. 対象のタスクのノートを開きます。
2. **Archive task** または **Restore task from archive** を実行します。

## 挙動

- **Archive task**: ノートをタスクフォルダ直下の `archive` フォルダへ移動します。
- **Restore task from archive**: ノートをタスクフォルダ直下へ戻します。
- 移動先に同名のノートがある場合は、`名前 1`、`名前 2` のように連番が付きます。
- ノートは Obsidian の機能で移動されるため、他のノートからのリンクは壊れません。
- 移動後は、Base の **Active** ビューと **Archive** ビューに反映されます。
- ステータスなどのプロパティは変更されません。`status` を `Done` にするかどうかは、手動で行ってください。

## 関連ページ

- [基本概念](../concepts.md)
- [Enforce base definitions](enforce-base-definitions.md)
