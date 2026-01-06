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

本プロジェクトでは `dotenv` を使用して環境設定を管理しています。基本設定は `.env` から、プロファイル固有の設定は `.env.<profile>` から読み込まれます。

### 利用可能な環境設定ファイル例
- `.env.shimamura.template` (テンプレート)
- `.env.shimamura.testgcp`
- `.env.shimamura.testgcp2`
- `.env.shimamura.traininggcp`
- `.env.taskreport`

## テストの実行方法

### 推奨: バッチファイルでの実行 (しまむら環境)

プロジェクトルートにある `run_syokai_shimamura.bat` を使用すると、簡単に初回登録テストを実行できます。

1. `run_syokai_shimamura.bat` をダブルクリック（またはコマンドラインから実行）。
2. プロンプトが表示されたら、プロファイル名を入力（例: `shimamura.testgcp`）。

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

### プロファイルの指定

`--profile` フラグを使用することで、特定の環境設定 (`.env.<profile>`) を読み込んでテストを実行できます。

```bash
npx codeceptjs run --profile shimamura.testgcp
```

特定のスクリプト経由:
```bash
npm run test:shimamura:syokai -- --profile shimamura.testgcp
```

### デバッグモード

ステップごとの実行内容を表示しながらデバッグ実行する場合:
```bash
npm run test_now
```

## テストデータ (データ駆動テスト)

`shimamura` プロジェクトでは、CSVファイルを使用したデータ駆動テストが可能です。
`tests/shimamura/` 配下の CSV ファイルがプロファイル名に基づいて自動的に読み込まれます。

*   **命名規則:** `syokai_touroku_data_[profile].csv`
*   **例:** `syokai_touroku_data_shimamura.testgcp.csv`

該当するプロファイル用のCSVが存在しない場合は、デフォルトの `syokai_touroku_data.csv` が使用されます。

**CSVフォーマット例:**
```csv
lastName,className,keiyakuDate,kaishiDate,taikaiYear,taikaiMonth
退会_TestGCP,ドラム-水-19:00-テスト太郎,2026-02-01,2026-02-02,2026,03
```

## ディレクトリ構成

- **tests/**: テストファイル (`shimamura`, `tframe`, `taskreport`, `smoke` フォルダ別)。
- **pages/**: ページオブジェクト (Page Objects)。セレクタや操作ロジックを管理。
- **support/**: ヘルパーファイルや `steps_file.js`。
- **output/**: テスト結果のアーティファクト (スクリーンショット、レポートなど)。
- **doc/**: 詳細なドキュメントや設計図。
- **codecept.conf.js**: CodeceptJS のメイン設定ファイル。

## レポート

テスト結果のレポートには **Allure** を使用しています。
*   結果データ: `allure-results` ディレクトリ
*   スクリーンショット付きステップレポート: `output` ディレクトリ
