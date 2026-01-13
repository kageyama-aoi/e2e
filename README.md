# CodeceptJS E2E テストフレームワーク

本プロジェクトは、[CodeceptJS](https://codecept.io/) と [Playwright](https://playwright.dev/) を使用した E2E (End-to-End) テストフレームワークです。
`shimamura`（しまむら）、`tframe`（T-Frame）、`taskreport` などの複数のプロジェクト/プロファイルに対応しています。

## 前提条件

- Node.js (推奨: 最新のLTSバージョン)
- npm

## インストール

依存パッケージをインストールします：

```bash
npm install
```

## 環境設定 (Configuration)

本プロジェクトでは `dotenv` を使用して環境設定を管理しています。基本設定は `.env`（ルート）から、プロファイル固有の設定は `env/` ディレクトリ内の `.env.<profile>` から読み込まれます。

### 利用可能な環境設定ファイル (env/ 配下)
- `env/.env.shimamura.template` (テンプレート)
- `env/.env.shimamura.testgcp`
- `env/.env.shimamura.testgcp2`
- `env/.env.shimamura.traininggcp`
- `env/.env.taskreport`

## テストの実行方法

### 推奨: バッチファイルでの実行 (しまむら環境)

プロジェクトルートにある `run_syokai_shimamura.bat` を使用すると、対話形式でプロファイルを選択して初回登録テストを実行できます。

1. `run_syokai_shimamura.bat` をダブルクリック。
2. `Enter profile name:` と表示されたら、プロファイル名を入力します。
   - `shimamura.testgcp` 等
   - 何も入力せずに Enter を押すと `shimamura` が選択されます。

### コマンドラインでの実行

特定のプロファイルを指定して実行する場合は、`--profile` フラグを使用します。

```bash
# プロファイルを指定して実行
npx codeceptjs run --profile shimamura.testgcp

# しまむら初回登録テストを直接指定して実行
npx codeceptjs run ./tests/shimamura/syokai_touroku.js --profile shimamura.testgcp
```

### npm コマンドでの実行

**全テスト実行:**
```bash
npm test
```

**プロジェクトごとの実行:**

*   **しまむら (`shimamura`):**
    ```bash
    npm run test_s
    ```
*   **T-Frame (`tframe`):**
    ```bash
    npm run test_t
    ```
*   **Task Report (`taskreport`):**
    ```bash
    npm run test_taskreport
    ```

### ディレクトリ構成

- **tests/**: テストファイル (`shimamura`, `tframe`, `taskreport`, `smoke` フォルダ別)。
- **pages/**: ページオブジェクト。
- **env/**: 環境設定ファイル (`.env.*`)。
- **support/**: ヘルパーファイルや `steps_file.js`。
- **output/**: テスト結果（スクリーンショット等）。
- **codecept.conf.js**: CodeceptJS のメイン設定ファイル。


## レポート

テスト結果のレポートには **Allure** を使用しています。
*   結果データ: `allure-results` ディレクトリ
*   スクリーンショット付きステップレポート: `output` ディレクトリ
