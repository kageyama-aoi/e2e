# E2Eテスト

このリポジトリは、CodeceptJSを使用したE2E（エンドツーエンド）テストのコードを管理します。

## 1. セットアップ

テストを実行する前に、必要なパッケージをインストールします。

```bash
npm install
```

## 2. 環境変数

テストには環境変数が必要です。プロジェクトのルートに`.env`ファイルを作成し、共通の値を設定してください。

また、テスト対象の環境ごとに設定を切り替えるため、以下のファイルを使用します。

-   `.env.shimamura`: しまむら環境用の設定ファイル

## 3. テストの実行

テストは、テストスイート（`tframe`, `shimamura`）ごとに分けて実行できます。

### しまむら (`shimamura`) のテストを実行

`npm`スクリプト（推奨）:
```bash
npm run test_s
```

または、直接コマンドを実行:
```bash
npx codeceptjs run ./tests/shimamura/*_test.js --profile shimamura
```

### t-frame (`tframe`) のテストを実行

`npm`スクリプト（推奨）:
```bash
npm run test_t
```

または、直接コマンドを実行:
```bash
npx codeceptjs run ./tests/tframe/*_test.js
```