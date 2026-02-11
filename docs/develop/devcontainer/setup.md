# セットアップ手順

Dev Container を使って Ananke の開発環境を構築する方法を説明します。

## 前提条件

以下のソフトウェアを事前にインストールしてください。

### 1. Docker Desktop

コンテナを動かすために必要です。

- **Windows**: [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/) をインストール
  - WSL 2 バックエンドの有効化が必要です（インストーラーが案内してくれます）
- **macOS**: [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/) をインストール
- **Linux**: [Docker Engine](https://docs.docker.com/engine/install/) をインストール

インストール後、Docker Desktop を起動しておいてください。

### 2. Visual Studio Code

- [VS Code](https://code.visualstudio.com/) をインストール

### 3. Dev Containers 拡張機能

VS Code に Dev Containers 拡張機能をインストールします。

1. VS Code を開く
2. 左側の拡張機能アイコン（四角が4つのアイコン）をクリック
3. 検索欄に `Dev Containers` と入力
4. **Dev Containers**（Microsoft 製）をインストール

または、VS Code 内でショートカット `Ctrl+P`（macOS: `Cmd+P`）を押して以下を入力:

```
ext install ms-vscode-remote.remote-containers
```

### 4. Git

リポジトリをクローンするために必要です。

- **Windows**: [Git for Windows](https://gitforwindows.org/) をインストール
- **macOS**: ターミナルで `xcode-select --install` を実行
- **Linux**: パッケージマネージャーでインストール（例: `sudo apt install git`）

## 開発環境の起動

### 方法 A: ローカルにクローンしてから開く

```bash
# 1. リポジトリをクローン
git clone https://github.com/murnana/obsidian-ananke.git

# 2. VS Code でフォルダーを開く
code obsidian-ananke
```

VS Code がフォルダーを開くと、右下に以下の通知が表示されます:

> **Folder contains a Dev Container configuration file. Reopen folder to develop in a container.**

「**Reopen in Container**」をクリックしてください。

通知が表示されない場合は、以下の手順で手動で開けます:

1. `F1` キー（または `Ctrl+Shift+P` / `Cmd+Shift+P`）を押してコマンドパレットを開く
2. `Dev Containers: Reopen in Container` と入力して選択

### 方法 B: GitHub Codespaces で開く（ブラウザだけで開発）

GitHub Codespaces を使えば、Docker のインストールも不要です。

1. GitHub のリポジトリページを開く
2. 緑色の「**Code**」ボタンをクリック
3. 「**Codespaces**」タブを選択
4. 「**Create codespace on develop**」をクリック

ブラウザ上で VS Code が開き、すぐに開発を始められます。

## 初回起動時の動作

コンテナが初めて作成されるとき、以下の処理が自動で行われます:

1. **Docker イメージのダウンロード** — Node.js 22 が入った開発用イメージを取得します（初回のみ、数分かかります）
2. **追加ツールのインストール** — Claude Code と GitHub CLI がインストールされます
3. **VS Code 拡張機能のインストール** — ESLint、GitLens などが自動でインストールされます
4. **npm install の実行** — プロジェクトの依存パッケージがインストールされます

すべて完了すると、ターミナルが使える状態になります。

## 開発の開始

コンテナが起動したら、ターミナルで以下のコマンドを実行してビルドできます:

```bash
# 開発モード（ファイル変更を監視して自動ビルド）
npm run dev

# 本番ビルド（型チェック + ミニファイ）
npm run build
```

## コンテナの停止・再開

### 停止

VS Code を閉じると、コンテナは自動的に停止します。
または、コマンドパレット（`F1`）から `Dev Containers: Close Remote Connection` を選択します。

### 再開

もう一度 VS Code でフォルダーを開き、「Reopen in Container」を選択するだけです。
2 回目以降はイメージのダウンロードが不要なため、起動が速くなります。

### コンテナの再作成

環境をクリーンな状態に戻したい場合は、コマンドパレットから:

```
Dev Containers: Rebuild Container
```

npm のキャッシュはボリュームに永続化されているため、再作成しても `npm install` は高速に完了します。
