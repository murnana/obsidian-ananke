# インストール

Ananke プラグインを Obsidian にインストールする方法を説明します。

> **注意:** このプラグインはまだ Obsidian のコミュニティプラグインとして公開されていません。現時点では手動インストールのみ対応しています。

## 手動インストール

### 1. リリースファイルを取得

[GitHub リポジトリ](https://github.com/murnana/obsidian-ananke)の Releases ページから、以下の 3 つのファイルをダウンロードします:

- `main.js`
- `manifest.json`
- `styles.css`

### 2. プラグインフォルダーを作成

Obsidian の保管庫（Vault）内に、プラグイン用のフォルダーを作成します。

```
{あなたの保管庫}/.obsidian/plugins/murnana-ananke/
```

`.obsidian` フォルダーは隠しフォルダーです。ファイルマネージャーで隠しファイルの表示を有効にしてください。

### 3. ファイルを配置

ダウンロードした 3 つのファイルを、作成したフォルダーにコピーします:

```
{あなたの保管庫}/
└── .obsidian/
    └── plugins/
        └── murnana-ananke/
            ├── main.js
            ├── manifest.json
            └── styles.css
```

### 4. プラグインを有効化

1. Obsidian を再起動する（または保管庫を開き直す）
2. **設定** → **コミュニティプラグイン** を開く
3. 「制限モード」がオフになっていることを確認
4. インストール済みプラグインの一覧から「**Ananke**」を見つけ、トグルをオンにする

## ソースからビルドしてインストール

開発者向けの方法です。

```bash
# 1. リポジトリをクローン
git clone https://github.com/murnana/obsidian-ananke.git
cd obsidian-ananke

# 2. 依存パッケージをインストール
npm install

# 3. 本番ビルド
npm run build
```

ビルドが成功すると、プロジェクトルートに `main.js` が生成されます。この `main.js` と `manifest.json`、`styles.css` を保管庫のプラグインフォルダーにコピーしてください。

## アンインストール

1. **設定** → **コミュニティプラグイン** を開く
2. 「**Ananke**」の右側にあるゴミ箱アイコンをクリック
3. 確認ダイアログで「削除」を選択

または、保管庫内の `.obsidian/plugins/murnana-ananke/` フォルダーを直接削除しても構いません。
