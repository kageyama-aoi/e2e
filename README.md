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
- `env/.env.shimamura.MySQL84_dev`
- `env/.env.shimamura.smbcpos_training`

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
- [CodeceptJS APIリファレンス](./docs/common/codeceptjs_api_reference.md): このプロジェクトで使われているCodeceptJSの主要な関数と、その具体的な使用例をまとめています。テストコードの読解や新規作成にご活用ください。
- [CodeceptJS 設計パターン・用語集](./docs/common/codeceptjs_design_patterns.md): 設計思想（データ駆動・エラー注入・単一フロー設計）と技術用語を解説しています。
- [プロジェクト設計・アーキテクチャガイド](./docs/project/project_architecture_guide.md): ディレクトリ構成・責務分離・設計ルールの詳細を説明しています。
- [モジュール依存関係図](./docs/common/mermaid_code_relationships.md): テスト・Page Object・データファイルの依存関係を Mermaid 図で可視化しています。
- [技術概要 (Technical Overview)](./docs/project/project_architecture_guide.md#6-技術スタック--利用ツール一覧): このテスト基盤が利用している技術スタック、ツール、共通モジュールについてまとめています。

### プロダクト別
- [しまむらテスト コーディング規約](./docs/shimamura/coding_guidelines.md): しまむら系テストの構成・命名・共通化のルールをまとめたガイドです。
- [T-Frame 構成とファイルのつながり](./docs/tframe/architecture.md): tframe テストのファイル構成・起動フロー・Page Object の役割を解説しています。
- [T-Frame 用語集](./docs/tframe/glossary.md): テストコードに慣れていない方向けの用語解説です。

## デバッグのメモ

- **`pause()` はグローバル関数**です（`I.pause()` は存在しないためエラーになります）。
- 手元で一時停止したい場合は `pause();` を使用してください。

## 補助ツール

### Allure 結果アーカイブ
`scripts/allure/archive_allure_results.py` は、`allure-results/<profile>/<実行ディレクトリ>/` 単位で
古いテスト結果をzip圧縮してアーカイブし、N日以上古いものを削除します。

```bash
# 30日以上古いものをアーカイブ（既定）
npm run allure:archive

# 7日以上古いものを対象にする
python scripts/allure/archive_allure_results.py --days 7

# 削除せずに対象一覧だけ確認（dry-run）
python scripts/allure/archive_allure_results.py --dry-run
```

- **IN**: `allure-results/<profile>/<timestamp_rundir>/`
- **OUT**: `allure-results/archive/<profile>/<timestamp_rundir>.zip`

### サブメニュー抽出
`scripts/html/extract_submenus.py` は、HTMLソースから `tr id="submenu__..."` のブロックを抽出し、
JSON/CSV で出力するための補助ツールです。スクレーピングや画面構造の把握に使えます。

**使い方 (対話式)**
```bash
python scripts/html/extract_submenus.py
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
`scripts/html/extract_side_menu_groups.py` は、サイドメニューHTMLから
「グループ名」と「配下のメニュー項目」を構造化して JSON/CSV で出力します。
成果物はスクリプトの近くの `scripts/output/side_menu_extract/` 配下にまとめて出力します。
既定ファイル名は、抽出結果の先頭に出た日本語とタイムスタンプから自動生成します。

**使い方**
```bash
python scripts/html/extract_side_menu_groups.py "./scripts/input/side_menu_extract/source.html"
```

**既定入力ファイル**
- `[scripts/input/side_menu_extract/source.html](./scripts/input/side_menu_extract/source.html)`
- このファイルにサイドメニューHTMLを貼り付けたうえで、引数なしで実行できます

```bash
python scripts/html/extract_side_menu_groups.py
```

**JSON出力例**
- `group_count`: グループ数
- `groups[]`: グループ一覧
- `groups[].name`: グループ名（例: `Eメール`, `名簿リスト`）
- `groups[].items[]`: 子メニュー一覧

**日本語だけのJSON**
```bash
python scripts/html/extract_side_menu_groups.py "./scripts/input/side_menu_extract/source.html" --jp-only
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
`scripts/html/extract_body_only_fields.py` は、HTMLソースの `<td id="body_only_td">` 内から
フォーム要素（`input` / `select` / `textarea` / `button`）を抽出し、JSON/CSV で出力します。

**使い方 (対話式)**
```bash
python scripts/html/extract_body_only_fields.py
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

💡 **プロジェクトの設計思想や責務分離の詳細については、[プロジェクト設計・アーキテクチャガイド](docs/project/project_architecture_guide.md) を参照してください。**

<!-- TREE_START -->
Last updated: 2026-07-06 15:22:15

```text
e2e/
├── .agent/ 
│   ├── handoff/ 
│   │   ├── 2026-04-07-0937.md
│   │   ├── 2026-04-07-1313.md
│   │   ├── 2026-04-07-1438.md
│   │   ├── 2026-04-22-1738.md
│   │   ├── 2026-04-23-1319.md
│   │   ├── 2026-04-23-1729.md
│   │   ├── 2026-04-28-1516.md
│   │   ├── 2026-04-28-1730.md
│   │   ├── 2026-05-07-1544.md
│   │   ├── 2026-05-07-1701.md
│   │   ├── 2026-05-08-1204.md
│   │   ├── 2026-05-08-1332.md
│   │   ├── 2026-05-11-1653.md
│   │   ├── 2026-05-12-1100.md
│   │   ├── 2026-05-12-1429.md
│   │   ├── 2026-05-12-1646.md
│   │   ├── 2026-05-28-1651.md
│   │   ├── 2026-06-05-1324.md
│   │   ├── 2026-06-05-1326.md
│   │   ├── 2026-06-05-1748.md
│   │   ├── 2026-06-09-1708.md
│   │   ├── 2026-06-15-1205.md
│   │   ├── 2026-06-15-1534.md
│   │   ├── 2026-06-15-1620.md
│   │   ├── 2026-06-26-1433.md
│   │   ├── 2026-06-29-1833.md
│   │   ├── 2026-06-30-1441.md
│   │   ├── 2026-06-30-1713.md
│   │   ├── 2026-07-02-1802.md
│   │   ├── 2026-07-03-1435.md
│   │   ├── 2026-07-06-1038.md
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
│   ├── skills/ 
│   │   ├── doc-sync/ 
│   │   │   └── SKILL.md
│   │   ├── launcher-review/ 
│   │   │   └── SKILL.md
│   │   ├── local-safe-move/ 
│   │   │   └── SKILL.md
│   │   ├── shimamura-download-verify/ 
│   │   │   └── SKILL.md
│   │   ├── shimamura-html-fetch/ 
│   │   │   └── SKILL.md
│   │   ├── shimamura-ichiran-dev/ 
│   │   │   └── SKILL.md
│   │   ├── shimamura-registration-dev/ 
│   │   │   ├── references/ 
│   │   │   │   ├── patterns.md
│   │   │   │   └── troubleshooting.md
│   │   │   └── SKILL.md
│   │   ├── shimamura-screen-diagram/ 
│   │   │   └── SKILL.md
│   │   ├── tframe-html-fetch/ 
│   │   │   └── SKILL.md
│   │   ├── tframe-ichiran-dev/ 
│   │   │   └── SKILL.md
│   │   └── tframe-registration-dev/ 
│   │       └── SKILL.md
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
│   │   ├── koushi_sharei_errors/ 
│   │   │   ├── error_01_column_count.csv
│   │   │   ├── error_02_no_koushi_id.csv
│   │   │   ├── error_05_no_keijou_date.csv
│   │   │   ├── error_06_invalid_keijou_date.csv
│   │   │   ├── error_07_no_taisho_tsuki.csv
│   │   │   ├── error_08_invalid_taisho_tsuki.csv
│   │   │   ├── error_15_no_id_bangou.csv
│   │   │   ├── error_16_no_koushi_mei.csv
│   │   │   ├── error_17_no_shiharai_houhou.csv
│   │   │   ├── error_18_no_mise_id.csv
│   │   │   ├── error_19_no_sharei_komoku.csv
│   │   │   ├── error_20_no_houshu_gaku.csv
│   │   │   ├── error_25_date_mismatch.csv
│   │   │   ├── error_26_keijou_past.csv
│   │   │   └── test_18col_no_koushi_id.csv
│   │   ├── smbc_import/ 
│   │   │   ├── smbc_err_data_short.txt
│   │   │   ├── smbc_err_end_short.txt
│   │   │   ├── smbc_err_header_short.txt
│   │   │   ├── smbc_err_invalid_kind.txt
│   │   │   ├── smbc_err_invalid_type.txt
│   │   │   ├── smbc_err_no_end.txt
│   │   │   ├── smbc_err_no_header.txt
│   │   │   ├── smbc_err_no_trailer.txt
│   │   │   ├── smbc_err_old_date.txt
│   │   │   ├── smbc_err_trailer_short.txt
│   │   │   └── smbc_state_import_sample.txt
│   │   ├── attendance_today_ichiran_search_data.csv
│   │   ├── bank_payment_type_check_data.csv
│   │   ├── class_list_ichiran_search_data.csv
│   │   ├── contact_list_ichiran_search_data.csv
│   │   ├── contact_module_list_ichiran_search_data.csv
│   │   ├── contact_register_data.csv
│   │   ├── contact_register_validation_errors.csv
│   │   ├── course_by_student_ichiran_search_data.csv
│   │   ├── course_ichiran_search_data.csv
│   │   ├── gessya_ikkatu_setup_data.csv
│   │   ├── keiri_hennkin_syori_data.csv
│   │   ├── keiri_hennkin_syori_validation_errors.csv
│   │   ├── keiri_invoices_ichiran_search_data.csv
│   │   ├── koushi_sharei_import_sample.csv
│   │   ├── koushi_sharei_manual_data.csv
│   │   ├── koushi_sharei_manual_validation_errors.csv
│   │   ├── koushi_sharei_tsuika_data.csv
│   │   ├── koushi_sharei_tsuika_errors.csv
│   │   ├── mishukin_list_ichiran_search_data.csv
│   │   ├── smbc_state_import_data.csv
│   │   ├── smbc_state_import_validation_errors.csv
│   │   ├── student_saikenkai_data.csv
│   │   ├── student_search_ichiran_search_data.csv
│   │   ├── syokai_touroku_data.csv
│   │   ├── syokai_touroku_data_shimamura.testgcp.csv
│   │   ├── syokai_touroku_data_shimamura.testgcp2.csv
│   │   ├── syokai_touroku_data_shimamura.traininggcp.csv
│   │   ├── syokai_touroku_validation_errors.csv
│   │   ├── taikai_testdata.csv
│   │   ├── teacher_list_ichiran_search_data.csv
│   │   ├── teacher_variants.csv
│   │   ├── testgcp一括取込ファイル_20230402.txt
│   │   ├── transaction_ichiran_search_data.csv
│   │   └── validity_data_output_data.csv
│   └── tframe/ 
│       ├── account_ichiran_search_data.csv
│       ├── account_touroku_data.csv
│       ├── account_touroku_data_minimum.csv
│       ├── branch_ichiran_search_data.csv
│       ├── branch_touroku_data.csv
│       ├── chosekin_ichiran_search_data.csv
│       ├── chosekin_touroku_data.csv
│       ├── course_ichiran_search_data.csv
│       ├── course_touroku_data.csv
│       ├── courseBySt_ichiran_search_data.csv
│       ├── infoHistory_ichiran_search_data.csv
│       ├── infoHistoryTemplate_ichiran_search_data.csv
│       ├── infoHistoryTemplate_touroku_data.csv
│       ├── jukusei_ichiran_search_data.csv
│       ├── jukusei_touroku_data.csv
│       ├── koshi_ichiran_search_data.csv
│       ├── koshi_touroku_data.csv
│       ├── koshi_touroku_data_minimum.csv
│       ├── kyoshitsu_ichiran_search_data.csv
│       ├── kyoshitsu_touroku_data.csv
│       ├── proByCourse_ichiran_search_data.csv
│       ├── README.md
│       ├── ryokin_master_ichiran_search_data.csv
│       ├── ryokin_master_touroku_data.csv
│       ├── ryokin_package_ichiran_search_data.csv
│       ├── ryokin_package_touroku_data.csv
│       ├── shohin_ichiran_search_data.csv
│       ├── shohin_touroku_data.csv
│       ├── staff_ichiran_search_data.csv
│       ├── staff_touroku_data.csv
│       ├── staff_touroku_data_minimum.csv
│       ├── stByCourse_ichiran_search_data.csv
│       ├── teacherPaymentReportParams.js
│       └── teByStudent_ichiran_search_data.csv
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
│   │   ├── _common/ 
│   │   │   ├── ClassMemberPage.js
│   │   │   └── sideMenus.js
│   │   ├── auth/ 
│   │   │   └── LoginPage.js
│   │   ├── flow/ 
│   │   │   ├── CourseClassSetupFlowPage.js
│   │   │   ├── GessyaIkkatuFlowPage.js
│   │   │   ├── KoushiShareiFlowPage.js
│   │   │   ├── StudentSaikenkaiFlowPage.js
│   │   │   ├── SyokaiFlowPage.js
│   │   │   └── TeacherKeiriFlowPage.js
│   │   └── screens/ 
│   │       ├── ContactRegisterPage.js
│   │       └── IchiranPage.js
│   ├── taskreport/ 
│   │   └── TaskReportLoginPage.js
│   └── tframe/ 
│       ├── _common/ 
│       │   ├── _urlPath.js
│       │   ├── IchiranMixin.js
│       │   ├── MenuNavigationMixin.js
│       │   └── sideMenus.js
│       ├── api/ 
│       │   ├── ApiCommonLoginPage.js
│       │   ├── ApiTeacherInfoGetPage.js
│       │   └── JsonInputPage.js
│       ├── auth/ 
│       │   ├── LoginKannrisyaPage.js
│       │   ├── LoginMyPageStudentPage.js
│       │   └── LoginMyPageTeacherPage.js
│       └── screens/ 
│           ├── AccountPage.js
│           ├── BranchPage.js
│           ├── CalendarPage.js
│           ├── ChosekinPage.js
│           ├── ClassroomPage.js
│           ├── CoursePage.js
│           ├── EmailPage.js
│           ├── HelpPage.js
│           ├── HomePage.js
│           ├── InfoHistoryPage.js
│           ├── JukuseiPage.js
│           ├── KeiryoMasterPage.js
│           ├── KoshiPage.js
│           ├── MasterMenuPage.js
│           ├── ReportPage.js
│           ├── RyokinMasterPage.js
│           ├── RyokinPackagePage.js
│           ├── ShohinPage.js
│           └── StaffPage.js
├── run/ 
│   ├── ps/ 
│   │   ├── _run_batch_core.ps1
│   │   └── tframe_run_nav_all.ps1
│   ├── README.md
│   ├── run_gui.bat
│   ├── run_gui.py
│   ├── test_descriptions.json
│   └── tframe_run_nav_all.bat
├── scripts/ 
│   ├── allure/ 
│   │   ├── archive_allure_results.py
│   │   └── serve_latest.js
│   ├── cleanup/ 
│   │   ├── cleanup_gessya_fees.js
│   │   └── cleanup_output_logs.py
│   ├── hooks/ 
│   │   ├── archive_allure.py
│   │   ├── check_placement.py
│   │   └── log_bash.py
│   ├── html/ 
│   │   ├── input/ 
│   │   │   ├── account_list.html
│   │   │   ├── after_login.png
│   │   │   ├── all_links.json
│   │   │   ├── bank_code_0001_ajax.png
│   │   │   ├── bank_code_0005_ajax.png
│   │   │   ├── bank_code_9900_ajax.png
│   │   │   ├── bank_payment_1_error.png
│   │   │   ├── bank_payment_1_selected.png
│   │   │   ├── bank_payment_2_error.png
│   │   │   ├── bank_payment_2_selected.png
│   │   │   ├── bank_payment_4_error.png
│   │   │   ├── bank_payment_4_selected.png
│   │   │   ├── bank_payment_validation.json
│   │   │   ├── branch_list.html
│   │   │   ├── branch_touroku.html
│   │   │   ├── chosekin_list.html
│   │   │   ├── chosekin_person_popup.html
│   │   │   ├── chosekin_popup.png
│   │   │   ├── chosekin_touroku.html
│   │   │   ├── course_list.html
│   │   │   ├── course_touroku.html
│   │   │   ├── courseBySt_list.html
│   │   │   ├── error_screenshot.png
│   │   │   ├── infoHistory_student_list.html
│   │   │   ├── infoHistoryTemplate_student_list.html
│   │   │   ├── infoHistoryTemplate_touroku.html
│   │   │   ├── input.html
│   │   │   ├── jukusei_touroku.html
│   │   │   ├── keiri_page.png
│   │   │   ├── kyoshitsu_list.html
│   │   │   ├── kyoshitsu_touroku.html
│   │   │   ├── proByCourse_list.html
│   │   │   ├── ryokin_master_list.html
│   │   │   ├── ryokin_master_touroku.html
│   │   │   ├── ryokin_package_list.html
│   │   │   ├── ryokin_package_touroku.html
│   │   │   ├── sample_teacher_registration.html
│   │   │   ├── shohin_list.html
│   │   │   ├── shohin_touroku.html
│   │   │   ├── staff_list.html
│   │   │   ├── stByCourse_list.html
│   │   │   ├── student_list.html
│   │   │   ├── teacher_list.html
│   │   │   └── teByStudent_list.html
│   │   ├── shimamura/ 
│   │   │   ├── admin_top.html
│   │   │   ├── admin_top_links.json
│   │   │   ├── after_login.png
│   │   │   ├── attendance_today.html
│   │   │   ├── attendance_today_links.json
│   │   │   ├── class1000_detail.html
│   │   │   ├── class1000_final.html
│   │   │   ├── class1000_final.png
│   │   │   ├── class_after_course_link.html
│   │   │   ├── class_after_course_link.png
│   │   │   ├── class_course_tab_direct.html
│   │   │   ├── class_course_tab_direct.png
│   │   │   ├── class_detail_view.html
│   │   │   ├── class_detail_view_0.html
│   │   │   ├── class_detail_view_1.html
│   │   │   ├── class_detail_view_2.html
│   │   │   ├── class_list.html
│   │   │   ├── class_list_links.json
│   │   │   ├── class_own_detail.html
│   │   │   ├── class_search_result.html
│   │   │   ├── class_with_course_tab.html
│   │   │   ├── class_with_course_tab.png
│   │   │   ├── contact_list.html
│   │   │   ├── contact_list_links.json
│   │   │   ├── contact_module_list.html
│   │   │   ├── contact_module_list_links.json
│   │   │   ├── contact_register.html
│   │   │   ├── contact_register_links.json
│   │   │   ├── course_by_student.html
│   │   │   ├── course_by_student_links.json
│   │   │   ├── course_created_detail.html
│   │   │   ├── course_ichiran.html
│   │   │   ├── course_ichiran_links.json
│   │   │   ├── course_register.html
│   │   │   ├── course_register_links.json
│   │   │   ├── credit_purchase_edit.html
│   │   │   ├── credit_purchase_edit_links.json
│   │   │   ├── credit_purchase_list.html
│   │   │   ├── credit_purchase_list_links.json
│   │   │   ├── error_course_tab2.png
│   │   │   ├── error_create_full.png
│   │   │   ├── error_tmp2.png
│   │   │   ├── event_shimacourse_contacts_edit.html
│   │   │   ├── existing_class_schedule_tab.html
│   │   │   ├── existing_class_schedule_tab.png
│   │   │   ├── fee_detail.html
│   │   │   ├── fee_detail.png
│   │   │   ├── fetch_student_edit_flow.js
│   │   │   ├── karte_before_delete.html
│   │   │   ├── karte_for_verify_check.html
│   │   │   ├── keiri_invoices.html
│   │   │   ├── keiri_invoices_links.json
│   │   │   ├── kousha_sharei_add.html
│   │   │   ├── kousha_sharei_add_links.json
│   │   │   ├── main_menu_links.json
│   │   │   ├── mishukin_list.html
│   │   │   ├── mishukin_list_links.json
│   │   │   ├── nav__HideMenu.html
│   │   │   ├── nav__leftcol.html
│   │   │   ├── nav_full_body.html
│   │   │   ├── nav_links_with_class.json
│   │   │   ├── new_class_schedule_tab.html
│   │   │   ├── new_class_schedule_tab.png
│   │   │   ├── ryokin_package_create.html
│   │   │   ├── ryokin_package_create_links.json
│   │   │   ├── schedule_after_save.html
│   │   │   ├── schedule_after_save.png
│   │   │   ├── schedule_before_save.png
│   │   │   ├── schedule_create_form.html
│   │   │   ├── schedule_create_form.png
│   │   │   ├── sharei_ichiran.html
│   │   │   ├── sharei_ichiran_links.json
│   │   │   ├── sharei_nichibetsu_list.html
│   │   │   ├── sharei_nichibetsu_list_links.json
│   │   │   ├── shimacourse_popup.html
│   │   │   ├── shimacourse_popup.png
│   │   │   ├── shimacourse_register.html
│   │   │   ├── shimacourse_register_links.json
│   │   │   ├── smbc_state_import.html
│   │   │   ├── smbc_state_import_links.json
│   │   │   ├── student_detail.html
│   │   │   ├── student_detail_after_saikenkai.html
│   │   │   ├── student_detail_after_saikenkai_buttons.json
│   │   │   ├── student_detail_after_saikenkai_links.json
│   │   │   ├── student_detail_buttons.json
│   │   │   ├── student_detail_keiri.html
│   │   │   ├── student_detail_keiri_links.json
│   │   │   ├── student_detail_links.json
│   │   │   ├── student_detail_view.html
│   │   │   ├── student_detail_view_buttons_check_buttons.json
│   │   │   ├── student_detail_view_links.json
│   │   │   ├── student_edit.html
│   │   │   ├── student_edit_buttons.json
│   │   │   ├── student_edit_links.json
│   │   │   ├── student_edit_saikenkai.html
│   │   │   ├── student_edit_saikenkai_buttons.json
│   │   │   ├── student_edit_saikenkai_links.json
│   │   │   ├── student_search.html
│   │   │   ├── student_search_links.json
│   │   │   ├── student_smbc_detail.html
│   │   │   ├── student_smbc_detail_buttons.json
│   │   │   ├── student_smbc_detail_links.json
│   │   │   ├── teacher_accounting_fields.json
│   │   │   ├── teacher_detail.html
│   │   │   ├── teacher_detail_keiri.html
│   │   │   ├── teacher_edit.png
│   │   │   ├── teacher_edit_accounting.html
│   │   │   ├── teacher_edit_basic.html
│   │   │   ├── teacher_edit_error.png
│   │   │   ├── teacher_edit_ewan.html
│   │   │   ├── teacher_edit_ewan_keiri.html
│   │   │   ├── teacher_edit_keiri_fields.json
│   │   │   ├── teacher_list.html
│   │   │   ├── teacher_list_links.json
│   │   │   ├── teacher_list_query.html
│   │   │   ├── transaction_list.html
│   │   │   └── transaction_list_links.json
│   │   ├── _fetch_juku_lists.js
│   │   ├── check_confirm_btn.js
│   │   ├── check_schedule.js
│   │   ├── compare_nav.js
│   │   ├── confirm_btn.png
│   │   ├── extract_body_only_fields.py
│   │   ├── extract_side_menu_groups.py
│   │   ├── extract_submenus.py
│   │   ├── fetch_chosekin_person_id.js
│   │   ├── fetch_shimamura_nav.js
│   │   ├── fetch_shimamura_screens.js
│   │   ├── fetch_teacher_edit.js
│   │   ├── fetch_tframe_forms.js
│   │   ├── reg2_after.png
│   │   ├── reg2_filled.png
│   │   ├── reg2_reload.png
│   │   ├── reg3_after.png
│   │   ├── reg3_before.png
│   │   ├── register_schedule.js
│   │   ├── register_schedule2.js
│   │   ├── register_schedule3.js
│   │   ├── schedule_01_top.png
│   │   ├── schedule_after_register.png
│   │   ├── schedule_before_register.png
│   │   ├── schedule_filled.png
│   │   ├── schedule_final.png
│   │   ├── tframe_extract_form_fields.js
│   │   ├── verify_after_submit.png
│   │   ├── verify_filled.png
│   │   └── verify_schedule.js
│   ├── input/ 
│   │   └── side_menu_extract/ 
│   │       └── source.html
│   └── check_pause.js
├── support/ 
│   ├── shimamura/ 
│   │   ├── accountTransferSchedule.js
│   │   ├── constants.js
│   │   ├── hooks.js
│   │   ├── syokai_helpers.js
│   │   └── utils.js
│   ├── tframe/ 
│   │   ├── constants.js
│   │   └── utils.js
│   ├── envLoader.js
│   ├── repoRoot.js
│   ├── steps_file.js
│   └── utils.js
├── tests/ 
│   ├── shimamura/ 
│   │   ├── auth/ 
│   │   │   └── shimamura_login_test.js
│   │   ├── check/ 
│   │   │   ├── bank_payment_type_check_test.js
│   │   │   └── shimamura_class_existence_check_test.js
│   │   ├── flow/ 
│   │   │   ├── contact_register_test.js
│   │   │   ├── course_class_setup_test.js
│   │   │   ├── gessya_ikkatu_setup_test.js
│   │   │   ├── gessya_ikkatu_test.js
│   │   │   ├── keiri_hennkin_syori_test.js
│   │   │   ├── koushi_sharei_manual_test.js
│   │   │   ├── koushi_sharei_tsuika_test.js
│   │   │   ├── shimamura_class_member_registration_test.js
│   │   │   ├── smbc_state_import_test.js
│   │   │   ├── student_saikenkai_test.js
│   │   │   ├── syokai_touroku_test.js
│   │   │   ├── taikai_test.js
│   │   │   └── teacher_keiri_setup_test.js
│   │   ├── page/ 
│   │   │   ├── attendance_today_ichiran_test.js
│   │   │   ├── class_list_ichiran_test.js
│   │   │   ├── contact_list_ichiran_test.js
│   │   │   ├── contact_module_list_ichiran_test.js
│   │   │   ├── course_by_student_ichiran_test.js
│   │   │   ├── course_ichiran_test.js
│   │   │   ├── keiri_invoices_ichiran_test.js
│   │   │   ├── mishukin_list_ichiran_test.js
│   │   │   ├── student_search_ichiran_test.js
│   │   │   ├── teacher_list_ichiran_test.js
│   │   │   ├── transaction_ichiran_test.js
│   │   │   └── validity_data_output_test.js
│   │   └── util/ 
│   │       └── login_and_hold.js
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
│           ├── account_ichiran_test.js
│           ├── account_touroku_test.js
│           ├── branch_ichiran_test.js
│           ├── branch_touroku_test.js
│           ├── calendar_test.js
│           ├── chosekin_ichiran_test.js
│           ├── chosekin_touroku_test.js
│           ├── course_ichiran_test.js
│           ├── course_test.js
│           ├── course_touroku_test.js
│           ├── courseBySt_ichiran_test.js
│           ├── email_test.js
│           ├── help_test.js
│           ├── home_test.js
│           ├── infoHistory_ichiran_test.js
│           ├── infoHistoryTemplate_ichiran_test.js
│           ├── infoHistoryTemplate_touroku_test.js
│           ├── jukusei_ichiran_test.js
│           ├── jukusei_test.js
│           ├── jukusei_touroku_test.js
│           ├── keiryo_master_test.js
│           ├── koshi_ichiran_test.js
│           ├── koshi_test.js
│           ├── koshi_touroku_test.js
│           ├── kyoshitsu_ichiran_test.js
│           ├── kyoshitsu_touroku_test.js
│           ├── master_menu_test.js
│           ├── proByCourse_ichiran_test.js
│           ├── report_test.js
│           ├── ryokin_master_ichiran_test.js
│           ├── ryokin_master_touroku_test.js
│           ├── ryokin_package_ichiran_test.js
│           ├── ryokin_package_touroku_test.js
│           ├── shohin_ichiran_test.js
│           ├── shohin_touroku_test.js
│           ├── staff_ichiran_test.js
│           ├── staff_touroku_test.js
│           ├── stByCourse_ichiran_test.js
│           └── teByStudent_ichiran_test.js
├── .env
├── .gitignore
├── _temp_refactor_run_gui.md
├── _temp_refactoring_e2e_20260706.md
├── _temp_refactoring_shimamura.md
├── _temp_review_汎用性.md
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
