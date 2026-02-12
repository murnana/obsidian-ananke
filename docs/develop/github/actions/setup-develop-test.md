# Test Dev Container ワークフロー

Dev Container の構成が正しく動作するかを自動で検証するワークフローです。

- **ファイル:** `.github/workflows/setup-develop-test.yml`

## 目的

Dev Container の設定（`.devcontainer/devcontainer.json`）を変更したとき、その変更によってビルドが壊れていないかを自動的にチェックします。具体的には、コンテナ内で `npm install` と `npm run build` を実行し、エラーなく完了するかを確認します。

## トリガー条件

このワークフローは以下のタイミングで実行されます:

| トリガー | 条件 | 説明 |
| --- | --- | --- |
| `push` | `main`, `develop` ブランチ | これらのブランチに直接プッシュされたとき |
| `pull_request` | `main`, `develop` ブランチ | これらのブランチへのプルリクエストが作成・更新されたとき |
| `workflow_dispatch` | — | GitHub の Actions タブから手動で実行したとき |

### 手動実行の方法

1. GitHub リポジトリの「**Actions**」タブを開く
2. 左側のワークフロー一覧から「**Test Dev Container**」を選択
3. 「**Run workflow**」ボタンをクリック
4. ブランチを選択して「**Run workflow**」をクリック

## 同時実行制御

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

同じブランチに対して短時間に複数のプッシュがあった場合、古い実行を自動的にキャンセルします。これにより、最新のコードだけがテストされ、GitHub Actions の実行時間を節約できます。

**例:** `develop` ブランチに連続で 3 回プッシュした場合、1 回目と 2 回目の実行はキャンセルされ、3 回目だけが最後まで実行されます。

## ジョブの詳細

### `test-dev-container`

| 項目 | 値 | 説明 |
| --- | --- | --- |
| 実行環境 | `ubuntu-latest` | GitHub が提供する最新の Ubuntu 仮想マシン |
| 権限 | `contents: read` | リポジトリの内容を読み取る権限のみ（最小権限） |

### ステップ

#### 1. Checkout repository

```yaml
uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6
```

リポジトリのソースコードを仮想マシンにクローンします。これにより、`.devcontainer/devcontainer.json` やプロジェクトのファイルが利用可能になります。

#### 2. Run inside Dev Container

```yaml
uses: devcontainers/ci@8bf61b26e9c3a98f69cb6ce2f88d24ff59b785c6 # v0.3
with:
  runCmd: |
    npm install
    npm run build
```

[devcontainers/ci](https://github.com/devcontainers/ci) アクションが以下の処理を行います:

1. `.devcontainer/devcontainer.json` を読み取る
2. 設定に基づいて Docker コンテナをビルド・起動する
3. コンテナ内で `runCmd` に指定されたコマンドを実行する

実行されるコマンドの内容:

| コマンド | 説明 |
| --- | --- |
| `npm install` | `package.json` に記載された依存パッケージをインストール |
| `npm run build` | TypeScript の型チェック（`tsc -noEmit`）と esbuild による本番ビルドを実行 |

## 実行結果の確認方法

### GitHub 上で確認

1. リポジトリの「**Actions**」タブを開く
2. 実行一覧からワークフローの実行を選択
3. ジョブ名をクリックしてログを確認

### プルリクエスト上で確認

プルリクエストの画面下部に、チェックの結果が表示されます:

- **緑のチェックマーク**: ビルド成功
- **赤のバツマーク**: ビルド失敗（ログを確認して原因を調査してください）

## よくあるエラーと対処法

| エラー | 原因 | 対処法 |
| --- | --- | --- |
| TypeScript のコンパイルエラー | 型の不整合や構文エラー | エラーメッセージを確認し、該当ファイルを修正 |
| `npm install` の失敗 | `package.json` の記述ミスやレジストリの問題 | `package.json` を確認し、ローカルでも `npm install` を試す |
| Dev Container のビルド失敗 | `devcontainer.json` の設定ミス | ローカルで Dev Container を再ビルドして確認 |
