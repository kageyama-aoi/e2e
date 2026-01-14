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
- **data/**: テストデータ（CSV, JS）。
    - **shimamura/**: しまむら環境用CSVデータ。
- **env/**: 環境設定ファイル (`.env.*`)。
- **support/**: ヘルパーファイルや `steps_file.js`。
- **output/**: テスト結果（スクリーンショット等）。
- **codecept.conf.js**: CodeceptJS のメイン設定ファイル。

## 設定ファイルの詳細

プロジェクトの動作を制御する主要な設定ファイルについて説明します。

### codecept.conf.js
**CodeceptJS のメイン設定ファイル**
テストフレームワーク全体の設定を記述しています。
- **プロファイル設定**: `shimamura` や `tframe` などの環境ごとの設定（Base URL や対象テストファイル）を定義。
- **プラグイン・ヘルパー**: Playwright ドライバーの設定や、`dotenv` による環境変数読み込みの有効化。
- **共通設定**: スクリーンショットの保存先（`output/`）や、タイムアウト設定など。

### package.json
**プロジェクト定義ファイル**
- **Scripts**: テスト実行を簡略化するコマンド（`npm run test_s` 等）を定義。
- **Dependencies**: プロジェクトで使用するライブラリ（`codeceptjs`, `playwright`, `dotenv` 等）のバージョンを管理。

### jsconfig.json
**エディタ設定ファイル**
VS Code 等のエディタで、JavaScript のコード補完やインテリセンスを有効にするための設定です。

### run_syokai_shimamura.bat
**実行用バッチファイル（Windows用）**
ダブルクリックだけで「しまむら」環境のテストを実行できるようにしたスクリプトです。実行時にプロファイル（`testgcp`, `traininggcp` 等）を選択できます。

## レポート

テスト結果のレポートには **Allure** を使用しています。
*   結果データ: `allure-results` ディレクトリ
*   スクリーンショット付きステップレポート: `output` ディレクトリ
  1. 複数テストの実行（Allure 用の結果を蓄積）
   1 npx codeceptjs run "./tests/shimamura/*.js" --profile shimamura.testgcp

  2. Allure レポートの表示
   1 npx allure serve allure-results