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

**しまむら**
- `env/.env.shimamura.template` (テンプレート)
- `env/.env.shimamura.testgcp`
- `env/.env.shimamura.testgcp2`
- `env/.env.shimamura.traininggcp`

**T-Frame**
- `env/.env.tframe.juku_test`
- `env/.env.tframe.juku_beta`
- `env/.env.tframe.culture_test`
- `env/.env.tframe.culture_beta`

**その他**
- `env/.env.taskreport`

## テストの実行方法

### 1. GUI ランチャーでの実行（推奨）

`run/run_gui.bat` をダブルクリックして起動します。

| 機能 | 説明 |
| :--- | :--- |
| Product → Test → Profile の3段階選択 | 組み合わせミスを防ぐフィルタリング |
| Grep フィルタ | テストファイルに含まれる `@タグ` を自動検出してドロップダウン表示 |
| デバッグモード | `--steps --debug` + `KEEP_BROWSER_OPEN=1` でブラウザを開いたまま詳細ログ出力 |
| Open Allure ボタン | 選択プロファイルの最新結果をブラウザで表示 |
| ログ自動保存 | 実行完了時に `logs/` へ自動保存・色付き表示 |

特殊な連続実行のみ個別バッチを使います：

| ファイル | 内容 |
| :--- | :--- |
| `run/tframe_run_nav_all.bat` | T-Frame 全ページテストを順番に連続実行・集計 |

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

**テスト実行**

| コマンド | 内容 |
| :--- | :--- |
| `npm run gui` | GUI ランチャー起動（推奨） |
| `npm test` | 全テスト実行 |
| `npm run test_s` | しまむら全テスト (`shimamura.testgcp`) |
| `npm run test_t` | T-Frame 全テスト |
| `npm run test_taskreport` | Task Report テスト |

**Allure レポート**

| コマンド | 内容 |
| :--- | :--- |
| GUI の `Open Allure` ボタン | 選択プロファイルの最新結果をブラウザ表示（推奨） |
| `npm run allure:latest <profile>` | プロファイル指定で最新結果をサーブ |
| `npm run allure:serve` | allure-results 全体をサーブ |
| `npm run allure:report` | 静的レポートを生成 (`allure-report/`) |
| `npm run allure:open` | 生成済みレポートを開く |
| `npm run allure:archive` | 古い結果をzipアーカイブ・削除（デフォルト30日以上） |
| `npm run allure:clean` | 全テスト結果ディレクトリを削除 |

**ドキュメント**

| コマンド | 内容 |
| :--- | :--- |
| `npm run docs:jsdoc` | JSDoc HTML生成（`docs/generated/` に出力） |
| `npm run docs:update-readme-map` | READMEのディレクトリツリーを更新 |

## 学習リソース (Learning Resources)

### 共通
- [CodeceptJS APIリファレンス](./docs/guides/codeceptjs_api_reference.md): このプロジェクトで使われているCodeceptJSの主要な関数と、その具体的な使用例をまとめています。テストコードの読解や新規作成にご活用ください。
- [CodeceptJS 設計パターン・用語集](./docs/design/codeceptjs_design_patterns.md): 設計思想（データ駆動・エラー注入・単一フロー設計）と技術用語を解説しています。
- [プロジェクト設計・アーキテクチャガイド](./docs/guides/project_architecture_guide.md): ディレクトリ構成・責務分離・設計ルールの詳細を説明しています。
- [モジュール依存関係図](./docs/design/mermaid_code_relationships.md): テスト・Page Object・データファイルの依存関係を Mermaid 図で可視化しています。
- [技術概要 (Technical Overview)](./docs/guides/project_architecture_guide.md#6-技術スタック--利用ツール一覧): このテスト基盤が利用している技術スタック、ツール、共通モジュールについてまとめています。

### プロダクト別
- [しまむらテスト コーディング規約](./docs/guides/shimamura_coding_guidelines.md): しまむら系テストの構成・命名・共通化のルールをまとめたガイドです。
- [T-Frame 構成とファイルのつながり](./docs/tframe/architecture.md): tframe テストのファイル構成・起動フロー・Page Object の役割を解説しています。
- [T-Frame 用語集](./docs/tframe/glossary.md): テストコードに慣れていない方向けの用語解説です。

## デバッグのメモ

- **`pause()` はグローバル関数**です（`I.pause()` は存在しないためエラーになります）。
- 手元で一時停止したい場合は `pause();` を使用してください。

## 補助ツール

### Allure 結果アーカイブ
`scripts/archive_allure_results.py` は、`allure-results/<profile>/<実行ディレクトリ>/` 単位で
古いテスト結果をzip圧縮してアーカイブし、N日以上古いものを削除します。

```bash
# 30日以上古いものをアーカイブ（既定）
npm run allure:archive

# 7日以上古いものを対象にする
python scripts/archive_allure_results.py --days 7

# 削除せずに対象一覧だけ確認（dry-run）
python scripts/archive_allure_results.py --dry-run
```

- **IN**: `allure-results/<profile>/<timestamp_rundir>/`
- **OUT**: `allure-results/archive/<profile>/<timestamp_rundir>.zip`

### サブメニュー抽出
`scripts/extract_submenus.py` は、HTMLソースから `tr id="submenu__..."` のブロックを抽出し、
JSON/CSV で出力するための補助ツールです。スクレーピングや画面構造の把握に使えます。

**使い方 (対話式)**
```bash
python scripts/extract_submenus.py
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

### サイドメニューグループ抽出
`scripts/extract_side_menu_groups.py` は、サイドメニューHTMLから
「グループ名」と「配下のメニュー項目」を構造化して JSON/CSV で出力します。
成果物はスクリプトの近くの `scripts/output/side_menu_extract/` 配下にまとめて出力します。
既定ファイル名は、抽出結果の先頭に出た日本語とタイムスタンプから自動生成します。

**使い方**
```bash
python scripts/extract_side_menu_groups.py "./scripts/input/side_menu_extract/source.html"
```

**既定入力ファイル**
- `[scripts/input/side_menu_extract/source.html](./scripts/input/side_menu_extract/source.html)`
- このファイルにサイドメニューHTMLを貼り付けたうえで、引数なしで実行できます

```bash
python scripts/extract_side_menu_groups.py
```

**JSON出力例**
- `group_count`: グループ数
- `groups[]`: グループ一覧
- `groups[].name`: グループ名（例: `Eメール`, `名簿リスト`）
- `groups[].items[]`: 子メニュー一覧

**日本語だけのJSON**
```bash
python scripts/extract_side_menu_groups.py "./scripts/input/side_menu_extract/source.html" --jp-only
```

- `groups[].name`: グループ名のみ
- `groups[].items[]`: 子メニュー名のみ
- ID や href を省いた軽量形式です

**既定出力**
- 出力先ディレクトリ: `scripts/output/side_menu_extract/<先頭の日本語>/`
- JSON: `<先頭の日本語>_<timestamp>_side_menu_groups.json`
- JSON(日本語のみ): `<先頭の日本語>_<timestamp>_side_menu_groups_ja.json`
- CSV: `<先頭の日本語>_<timestamp>_side_menu_groups.csv`

### 画面フォーム要素抽出
`scripts/extract_body_only_fields.py` は、HTMLソースの `<td id="body_only_td">` 内から
フォーム要素（`input` / `select` / `textarea` / `button`）を抽出し、JSON/CSV で出力します。

**使い方 (対話式)**
```bash
python scripts/extract_body_only_fields.py
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

💡 **プロジェクトの設計思想や責務分離の詳細については、[プロジェクト設計・アーキテクチャガイド](docs/guides/project_architecture_guide.md) を参照してください。**

<!-- TREE_START -->
Last updated: 2026-04-27 11:59:40

```text
e2e/
├── .agent/ 
│   ├── handoff/ 
│   │   ├── 2026-04-07-0937.md
│   │   ├── 2026-04-07-1313.md
│   │   ├── 2026-04-07-1438.md
│   │   ├── 2026-04-22-1738.md
│   │   ├── 2026-04-23-1319.md
│   │   └── HANDOFF.md
│   ├── memory/ 
│   │   ├── docs_reorganization_plan.md
│   │   ├── MEMORY.md
│   │   └── tframe_refactor_resume_2026-04-03.md
│   ├── skills/ 
│   │   └── make_project/ 
│   │       └── SKILL.md
│   └── workflows/ 
│       ├── handoff.md
│       └── newplan.md
├── .claude/ 
│   ├── agents/ 
│   │   ├── explorer.md
│   │   ├── planner.md
│   │   └── worker.md
│   ├── commands/ 
│   │   ├── handoff.md
│   │   ├── newplan.md
│   │   └── placement-gate.md
│   └── settings.local.json
├── .github/ 
│   └── workflows/ 
│       └── documentation_update.yaml
├── .spec/ 
│   ├── KNOWLEDGE.md
│   ├── PLAN.md
│   ├── SPEC.md
│   └── TODO.md
├── data/ 
│   ├── shimamura/ 
│   │   ├── keiri_hennkin_syori_data.csv
│   │   ├── keiri_hennkin_syori_validation_errors.csv
│   │   ├── syokai_touroku_data.csv
│   │   ├── syokai_touroku_data_shimamura.testgcp.csv
│   │   ├── syokai_touroku_data_shimamura.testgcp2.csv
│   │   ├── syokai_touroku_data_shimamura.traininggcp.csv
│   │   ├── syokai_touroku_validation_errors.csv
│   │   └── taikai_testdata.csv
│   └── tframe/ 
│       ├── account_touroku_data.csv
│       ├── account_touroku_data_minimum.csv
│       ├── koshi_touroku_data.csv
│       ├── koshi_touroku_data_minimum.csv
│       ├── README.md
│       ├── staff_touroku_data.csv
│       ├── staff_touroku_data_minimum.csv
│       └── teacherPaymentReportParams.js
├── env/ 
│   ├── .env.shimamura.MySQL84_dev
│   ├── .env.shimamura.smbcpos_training
│   ├── .env.shimamura.template
│   ├── .env.shimamura.testgcp
│   ├── .env.shimamura.testgcp2
│   ├── .env.shimamura.traininggcp
│   ├── .env.taskreport
│   ├── .env.tframe.culture_beta
│   ├── .env.tframe.culture_test
│   ├── .env.tframe.juku_beta
│   ├── .env.tframe.juku_test
│   └── .env.tframe.template
├── pages/ 
│   ├── shimamura/ 
│   │   ├── ClassMemberPage.js
│   │   ├── LoginPage.js
│   │   └── SyokaiFlowPage.js
│   ├── taskreport/ 
│   │   └── TaskReportLoginPage.js
│   └── tframe/ 
│       ├── _urlPath.js
│       ├── accountingSideMenu.js
│       ├── AccountPage.js
│       ├── ApiCommonLoginPage.js
│       ├── ApiTeacherInfoGetPage.js
│       ├── CalendarPage.js
│       ├── calendarSideMenu.js
│       ├── CoursePage.js
│       ├── courseSideMenu.js
│       ├── EmailPage.js
│       ├── emailSideMenu.js
│       ├── HelpPage.js
│       ├── helpSideMenu.js
│       ├── HomePage.js
│       ├── JsonInputPage.js
│       ├── JukuseiPage.js
│       ├── KeiryoMasterPage.js
│       ├── KoshiPage.js
│       ├── LoginKannrisyaPage.js
│       ├── LoginMyPageStudentPage.js
│       ├── LoginMyPageTeacherPage.js
│       ├── MasterMenuPage.js
│       ├── masterSideMenu.js
│       ├── MenuNavigationMixin.js
│       ├── ReportPage.js
│       ├── reportSideMenu.js
│       ├── StaffPage.js
│       ├── studentSideMenu.js
│       └── teacherSideMenu.js
├── run/ 
│   ├── ps/ 
│   │   └── tframe_run_nav_all.ps1
│   ├── run_gui.bat
│   ├── run_gui.py
│   ├── test_descriptions.json
│   └── tframe_run_nav_all.bat
├── scripts/ 
│   ├── allure/ 
│   │   ├── archive_allure_results.py
│   │   └── serve_latest.js
│   ├── cleanup/ 
│   │   └── cleanup_output_logs.py
│   ├── html/ 
│   │   ├── input/ 
│   │   │   ├── input.html
│   │   │   └── sample_teacher_registration.html
│   │   ├── extract_body_only_fields.py
│   │   ├── extract_side_menu_groups.py
│   │   ├── extract_submenus.py
│   │   └── tframe_extract_form_fields.js
│   └── input/ 
│       └── side_menu_extract/ 
│           └── source.html
├── support/ 
│   ├── shimamura/ 
│   │   ├── constants.js
│   │   ├── syokai_helpers.js
│   │   └── utils.js
│   ├── envLoader.js
│   ├── repoRoot.js
│   ├── steps_file.js
│   └── utils.js
├── tests/ 
│   ├── shimamura/ 
│   │   ├── keiri_hennkin_syori_test.js
│   │   ├── shimamura_class_existence_check_test.js
│   │   ├── shimamura_class_member_registration_test.js
│   │   ├── shimamura_login_test.js
│   │   ├── syokai_touroku_test.js
│   │   └── taikai_test.js
│   ├── smoke/ 
│   │   └── smoke_test.js
│   ├── taskreport/ 
│   │   └── taskreport_sample_test.js
│   └── tframe/ 
│       ├── api/ 
│       │   └── get_personal_info_api_test.js
│       ├── auth/ 
│       │   ├── login_test.js
│       │   └── mypage_login_test.js
│       ├── check/ 
│       │   ├── dropdown_check_test.js
│       │   ├── lang_check_test.js
│       │   └── token_usage_test.js
│       ├── flow/ 
│       │   ├── 96-60_teacher_payment_report_test.js
│       │   ├── navigation_after_login_student_test.js
│       │   └── navigation_after_login_test.js
│       └── page/ 
│           ├── account_touroku_test.js
│           ├── calendar_test.js
│           ├── course_test.js
│           ├── email_test.js
│           ├── help_test.js
│           ├── home_test.js
│           ├── jukusei_test.js
│           ├── keiryo_master_test.js
│           ├── koshi_test.js
│           ├── koshi_touroku_test.js
│           ├── master_menu_test.js
│           ├── report_test.js
│           └── staff_touroku_test.js
├── .env
├── .gitignore
├── AGENTS.md
├── CHANGELOG.md
├── CLAUDE.md
├── codecept.conf.js
├── GEMINI.md
├── jsconfig.json
├── jsdoc.json
├── package-lock.json
├── package.json
├── README.md
├── steps.d.ts
└── ショートかっと暗記.png
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

### 結果ディレクトリの構造

テスト実行ごとに以下の形式で自動保存されます：

```
allure-results/
├── tframe.juku_test/
│   ├── 20260417_103045_login_test/   ← 実行1回分
│   └── 20260417_140000_course_test/
└── shimamura.testgcp/
    └── 20260417_120000_syokai_test/
```

### コマンド

```bash
# ブラウザでレポートを表示
npm run allure:serve

# 静的レポートを生成
npm run allure:report

# 古い結果をアーカイブ・削除（30日以上）
npm run allure:archive
```

### 関連リンク
- [Allure Report 公式ドキュメント](https://allurereport.org/docs/)

## ドキュメント生成 (JSDoc)

コード内の JSDoc コメントから HTML ドキュメントを生成できます。

```bash
# ドキュメントの生成（設定は jsdoc.json を参照）
npm run docs:jsdoc
```
