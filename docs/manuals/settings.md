# 設定

**Settings → Ananke** で開きます。設定項目は Base の管理のみです。

## Bases

登録済みの Base が一覧表示されます。各行には次が表示されます。

- 見出し: Base ファイルのパス
- 説明: `Tasks: <タスクフォルダ>, archive: <archive フォルダ>`

### 登録を解除する

行右端のゴミ箱アイコン（ツールチップ: **Unregister (files are kept)**）を選択します。

- 登録のみが解除されます。Base ファイル、タスクフォルダ、タスクノートは削除されません。
- 解除後、そのフォルダのノートはタスクとして扱われなくなり、タスク用のコマンドも使えなくなります。

## Register a base

**Register** ボタンで登録ダイアログを開きます。コマンドパレットの **Register a base** と同じです。→ [Register a base](commands/register-base.md)

## 保存されるデータ

設定はプラグインフォルダの `data.json` に保存されます。

| キー | 内容 |
|---|---|
| `bases` | 登録済み Base のリスト（`basePath` と `taskFolder`） |
| `activeTimer` | 実行中のタイマー（`taskPath` と `startedAt`）。なければ `null` |

## 自動で追従する変更

Base 登録は、Vault 上の変更に次のように追従します。

- Base ファイルまたはタスクフォルダ（を含むフォルダ）の名前を変更・移動すると、登録内容のパスも更新されます。
- Base ファイルを削除すると、通知が表示され、その登録は解除されます。
