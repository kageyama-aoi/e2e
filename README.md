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

### 1. 推奨: バッチファイルでの実行 (しまむら環境)

プロジェクトルートにある `Run_Shimamura_Syokai_Test.bat` を使用すると、対話形式でプロファイルを選択して初回登録テストを実行できます。

1. `Run_Shimamura_Syokai_Test.bat` をダブルクリック。
2. `Enter profile name:` と表示されたら、プロファイル名を入力します。
   - `shimamura.testgcp` 等
   - 何も入力せずに Enter を押すと `shimamura` が選択されます。

### 2. コマンドラインでの実行

特定のプロファイルを指定して実行する場合は、`--profile` フラグを使用します。

```bash
# プロファイルを指定して実行
npx codeceptjs run --profile shimamura.testgcp

# しまむら初回登録テストを直接指定して実行
npx codeceptjs run ./tests/shimamura/syokai_touroku_test.js --profile shimamura.testgcp

# フォルダ内の全テストを実行（複数テスト）
npx codeceptjs run "./tests/shimamura/*_test.js" --profile shimamura.testgcp
```

### 3. npm コマンドでの実行

| コマンド | 内容 |
| :--- | :--- |
| `npm test` | 全テスト実行 |
| `npm run test_s` | しまむら (`shimamura`) のテスト実行 |
| `npm run test_t` | T-Frame (`tframe`) のテスト実行 |
| `npm run test_taskreport` | Task Report (`taskreport`) のテスト実行 |

## 学習リソース (Learning Resources)

- [CodeceptJS 学習ガイド](./docs/codeceptjs_learning_guide.md): このプロジェクトで使われているCodeceptJSの主要な関数と、その具体的な使用例をまとめています。テストコードの読解や新規作成にご活用ください。
- [しまむらテスト コーディング規約](./docs/shimamura_coding_guidelines.md): しまむら系テストの構成・命名・共通化のルールをまとめたガイドです。
- [技術概要 (Technical Overview)](./docs/technical_overview.md): このテスト基盤が利用している技術スタック、ツール、共通モジュールについてまとめています。

## デバッグのメモ

- **`pause()` はグローバル関数**です（`I.pause()` は存在しないためエラーになります）。
- 手元で一時停止したい場合は `pause();` を使用してください。

## 補助ツール

### サブメニュー抽出
`extract_submenus.py` は、HTMLソースから `tr id="submenu__..."` のブロックを抽出し、
JSON/CSV で出力するための補助ツールです。スクレーピングや画面構造の把握に使えます。

**使い方 (対話式)**
```bash
python extract_submenus.py
```

**出力形式の選択**
- `1`: JSON
- `2`: CSV
- `3`: CSV(フラット)

**入出力**
- 入力（固定）: `C:\Users\kageyama\Tools\testcode\source.txt`
- 出力（固定）: `C:\Users\kageyama\Tools\testcode\e2e\output\submenu_extract\`
  - JSON: `submenu_extract.json`
  - CSV: `submenu_extract.csv`
  - CSV(フラット): `submenu_extract_flat.csv`

**補足**
- 文字コードは `utf-8` を優先して自動判定し、失敗した場合は `cp932` を試します。
- 入力が UTF-8 でない場合は標準エラーに注意メッセージを出します。

### 画面フォーム要素抽出
`extract_body_only_fields.py` は、HTMLソースの `<td id="body_only_td">` 内から
フォーム要素（`input` / `select` / `textarea` / `button`）を抽出し、JSON/CSV で出力します。

**使い方 (対話式)**
```bash
python extract_body_only_fields.py
```

**出力形式の選択**
- `1`: JSON
- `2`: CSV
- `3`: CSV(フラット)

**入出力**
- 入力（固定）: `C:\Users\kageyama\Tools\testcode\source.txt`
- 出力（固定）: `C:\Users\kageyama\Tools\testcode\e2e\output\body_only_extract\`
  - JSON: `body_only_fields.json`
  - CSV: `body_only_fields.csv`
  - CSV(フラット): `body_only_fields_flat.csv`

**補足**
- 文字コードは `utf-8` を優先して自動判定し、失敗した場合は `cp932` を試します。
- 入力が UTF-8 でない場合は標準エラーに注意メッセージを出します。

## ディレクトリ構成

💡 **プロジェクトの設計思想や責務分離の詳細については、[プロジェクト設計・アーキテクチャガイド](docs/project_architecture_guide.md) を参照してください。**

<!-- TREE_START -->
Last updated: 2026-01-19 10:37:40

```text
e2e/
├── .github/ 
│   └── workflows/ 
│       └── documentation_update.yaml
├── data/ 
│   ├── shimamura/ 
│   │   ├── syokai_touroku_data.csv
│   │   ├── syokai_touroku_data_shimamura.testgcp.csv
│   │   ├── syokai_touroku_data_shimamura.testgcp2.csv
│   │   ├── syokai_touroku_data_shimamura.traininggcp.csv
│   │   └── taikai_testdata.csv
│   └── tframe/ 
│       └── teacherPaymentReportParams.js
├── env/ 
│   └── .env.shimamura.template
├── pages/ 
│   ├── shimamura/ 
│   │   ├── ClassMemberPage.js
│   │   └── LoginPage.js
│   ├── Taskreport/ 
│   │   └── TaskReportLoginPage.js
│   └── tframe/ 
│       ├── ApiCommonLoginPage.js
│       ├── ApiTeacherInfoGetPage.js
│       ├── JsonInputPage.js
│       ├── LoginKannrisyaPage.js
│       └── LoginMyPage.js
├── scripts/ 
│   └── tree_generator.py
├── support/ 
│   ├── envLoader.js
│   └── steps_file.js
├── tests/ 
│   ├── shimamura/ 
│   │   ├── shimamura_class_member_registration_test.js
│   │   ├── shimamura_login_test.js
│   │   ├── syokai_touroku_test.js
│   │   └── taikai_test.js
│   ├── smoke/ 
│   │   └── smoke_test.js
│   ├── Taskreport/ 
│   │   └── taskreport_sample_test.js
│   └── tframe/ 
│       ├── 96-60_teacher_payment_report_test.js
│       ├── get_personal_info_api_test.js
│       ├── login_test.js
│       ├── mypage_login_test.js
│       ├── navigation_after_login_student_test.js
│       ├── navigation_after_login_test.js
│       └── token_usage_test.js
├── .gitignore
├── codecept.conf.js
├── jsconfig.json
├── jsdoc.json
├── package-lock.json
├── package.json
├── read_alluroe.html
├── README.md
├── Run_Shimamura_Syokai_Test.bat
└── steps.d.ts
```
<!-- TREE_END -->

## 設定ファイルの詳細

### codecept.conf.js
**CodeceptJS のメイン設定ファイル**
- **プロファイル設定**: `shimamura` や `tframe` などの環境ごとの設定（Base URL や対象テストファイル）を定義。
- **プラグイン・ヘルパー**: Playwright ドライバーの設定や、Allure レポートの設定、`dotenv` による環境変数読み込み。
- **共通設定**: スクリーンショットの保存先（`output/`）や、タイムアウト設定など。
- **Bootstrap**: 実行時に `allure-results/environment.properties` を自動生成し、レポートに環境情報を表示します。

### package.json
**プロジェクト定義ファイル**
- **Scripts**: テスト実行を簡略化するコマンドを定義。
- **Dependencies**: 使用ライブラリ（`codeceptjs`, `playwright`, `dotenv` 等）の管理。

### jsconfig.json
**エディタ設定ファイル**
VS Code 等のエディタで、JavaScript のコード補完やインテリセンスを有効にします。

## レポート (Allure)

テスト結果の可視化には **Allure Report** を使用しています。

### 1. レポートの表示
テスト実行後、以下のコマンドでレポートをブラウザで表示します。
```bash
npx allure serve allure-results
```

### 2. レポートの静的生成
```bash
npx allure generate allure-results --clean -o allure-report
```

### 関連リンク
- [Allure Report 公式ドキュメント](https://allurereport.org/docs/)

## ドキュメント生成 (JSDoc)

コード内の JSDoc コメントから HTML ドキュメントを生成できます。

```bash
# ドキュメントの生成（設定は jsdoc.json を参照）
npm run docs:shimamura
```
