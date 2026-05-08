# リポジトリガイドライン

## プロジェクト構成・モジュール整理
- `tests/` にプロダクト別のシナリオ（`shimamura/`, `tframe/`, `taskreport/`, `smoke/`）を配置。
- `pages/` は Page Object（画面操作・セレクタ）を集約。
- `support/` は共通ヘルパーと環境読み込み（`support/shimamura/` はしまむら固有のユーティリティ・定数）。
- `data/` はプロダクト別のテストデータ（CSV/JS）。
- `env/` はプロファイル別 `.env.*`、ルート `.env` は既定値。
- `run/` はテスト実行ランチャー、`scripts/` はテスト支援ツール（詳細は後述）。
- `output/`, `allure-results/`, `allure-report/` は生成物。
- `docs/` に学習資料・設計メモ。

## ビルド・テスト・開発コマンド

### テスト実行
- `npm install` 依存関係のインストール。
- `npm test` 全テスト実行（CodeceptJS）。
- `npm run test_s` しまむらテスト。
- `npm run test_t` T-Frame テスト一式。
- `npm run test_taskreport` Taskreport テスト。
- `npx codeceptjs run ./tests/shimamura/syokai_touroku_test.js --profile shimamura.testgcp` 単体実行例。

### Allure レポート
- `run/run_gui.py` → `Open Allure` ボタン（推奨）。選択中プロファイルの最新結果を自動検出してブラウザ表示。
- `npm run allure:latest` プロファイル指定で最新結果をサーブ（`node scripts/allure/serve_latest.js <profile>`）。
- `npm run allure:serve` allure-results 全体をサーブ。
- `npm run allure:report` レポート生成（allure-report/ に出力）。
- `npm run allure:open` 生成済みレポートを開く。
- `npm run allure:clean` allure-results をクリア。
- `npm run allure:archive` 古い実行結果を zip アーカイブ・削除。

### ドキュメント
- `npm run docs:jsdoc` JSDoc 生成（tests/ pages/ support/ 全対象）。
- `npm run docs:update-readme-map` README のディレクトリツリーを自動更新。
- `npm run docs:tree:file` ツリーを docs/tree.md に出力。

## ディレクトリ配置ルール

### 各ディレクトリの「置いてよいもの／置いてはいけないもの」

| ディレクトリ | 置いてよいもの | 置いてはいけないもの |
|---|---|---|
| `tests/` | テストシナリオ（`*_test.js`）のみ | Page Object、ユーティリティ、データ |
| `pages/` | Page Object、メニュー定義（`sideMenus.js`）、URL解決ヘルパー（`_urlPath.js`） | テスト入力データ、汎用ユーティリティ |
| `support/` | テスト実行中に `require()` されるJS（ユーティリティ・カスタムSteps・ENV読み込み） | 単体で起動する補助スクリプト |
| `data/` | テスト入力データ（CSV、パラメータJS） | アプリ構造の定義、メニュー定義、Page Object |
| `scripts/` | 単体で起動する補助ツール（Python・Node） | テスト実行中に `require()` されるJS |
| `run/` | ユーザーが直接起動するランチャー（`.bat` / `.py`） | テストロジック、Page Object |

### 新ファイル作成時のルール（必須）

新しいファイルを作る前に、以下を**必ず宣言してから**作成すること：

1. **性質の分類**：テスト入力データ / アプリ構造定義 / ランタイムユーティリティ / 補助ツール / ランチャー
2. **配置先とその理由**：「〇〇は△△の性質を持つため `pages/` に置く」
3. **既存カテゴリに当てはまらない場合**：勝手に判断せず、ユーザーに確認してから配置先を決める

### 新概念が生まれたときのフロー

```
新しいファイルの種類が出現
    ↓
「これは何者か？」を一言で言語化する
    ↓
既存カテゴリに当てはまる？
  Yes → そのディレクトリに配置・実装
  No  → AGENTS.md に配置ルールを追記してから実装（実装より先にルール化）
    ↓
実装後：配置ルールを変更・追記した場合は AGENTS.md の更新をコミットに含める
```

> `/placement-gate` スキルを使うと、上記フローを対話形式で実行できる。

### ファイル移動時のプロトコル（必須）

ファイルを別ディレクトリに移動したら、以下を**必ず確認**すること：

1. **旧パスへの参照を grep で確認**
   ```bash
   # 例：data/tframe/teacherSideMenu を移動した場合
   grep -r "data/tframe/teacherSideMenu" --include="*.js" .
   ```
   結果がゼロになるまで require パスを修正する。

2. **ドキュメントの記述を更新**（下記「ドキュメント連動ルール」参照）

3. **リポジトリルート取得パスの見直し**（`run/` や `scripts/` 内の `.py` / `.ps1` を移動した場合）

### ドキュメント連動ルール

変更内容に応じて、以下のドキュメントを**セットで更新**すること：

| 変更内容 | 更新が必要なドキュメント |
|---|---|
| ディレクトリ構成の変更（追加・削除・移動） | `README.md`（`npm run docs:update-readme-map` で自動更新）、`docs/guides/project_architecture_guide.md` |
| `data/tframe/` のファイル追加・削除・移動 | `data/tframe/README.md` の対応表 |
| 配置ルールの変更・新カテゴリの追加 | 本ファイル（`AGENTS.md`）のディレクトリ配置ルール表 |
| 新スキルの追加 | 本ファイル（`AGENTS.md`）のスキル一覧（下記） |
| `tests/tframe/` に新テストファイルを追加 | `run/test_descriptions.json`（GUI の TestFile 欄に日本語説明を表示するために必須） |

### 利用可能なスキル一覧

| スキル | 用途 |
|---|---|
| `/placement-gate` | 新ファイル作成前に性質を分類し、配置先を確定するゲート |
| `/tframe-registration-dev` | tframe 登録・編集テストの新規作成・修正手順 |
| `/tframe-ichiran-dev` | tframe 一覧検索テストの新規作成・修正手順 |
| `/safe-move` | ファイル移動時のプロトコル（参照修正・パス見直し・doc-sync）を一括実施 |
| `/doc-sync` | 開発作業後のドキュメント連動更新チェックリストを実施 |
| `/handoff` | セッション終了時のハンドオフ文書作成 |
| `/newplan` | 新しい開発サイクルの開始（`.spec/` のアーカイブ＆新規作成） |
| `/tframe-html-fetch` | tframe 画面の HTML 取得 + フォームフィールド ID の抽出・整理 |

## コーディング規約・命名
- JavaScript は既存のスタイルに合わせる（強制フォーマッタなし）。
- 関数名は `verbNoun`（例: `openStudentTab`）、遷移系は `navigateTo...` / `open...` / `goTo...`。
- セレクタは Page Object に集約し、テスト内の直書きを避ける。
- 待機は `I.waitForElement` / `I.waitForVisible` を優先し、`I.wait(秒)` は最小限。

## テスト運用ガイド
- フレームワーク: CodeceptJS + Playwright、レポートは Allure。
- テストファイル名は `*_test.js`、配置は `tests/<product>/`。
- 1 Scenario = 1 フロー、Arrange → Act → Assert の順を意識。
- CSV の読み込みは共通ユーティリティに統一。
- Allure 結果の構造: `allure-results/<profile>/<YYYYMMDD_HHMMSS_testname>/`。

### tframe テストのフォルダ分類
`tests/tframe/` 配下は性質別サブフォルダで管理する。新規テスト追加時は以下の基準で配置先を決めること。

| フォルダ | 対象 | 例 |
|---|---|---|
| `auth/` | ログイン・認証系 | login_test, mypage_login_test |
| `page/` | 画面単体の操作・表示確認 | calendar_test, home_test |
| `flow/` | 複数画面をまたぐ遷移・シナリオ | navigation_after_login_test |
| `check/` | 表示・設定の確認系（検証寄り） | lang_check_test, dropdown_check_test |
| `api/` | API系 | get_personal_info_api_test |

### tframe 画面名 ↔ ファイル名 対照表

特定画面のコードを探すときに使う。`Feature('教室一覧')` で grep しても見つかる。

| 画面名（日本語） | テスト/CSV prefix | Page Object | URL module | 備考 |
|---|---|---|---|---|
| 受講生 | `jukusei_` | `JukuseiPage.js` | `student` | |
| 講師 | `koshi_` | `KoshiPage.js` | `teacher` | |
| コース | `course_` | `CoursePage.js` | `course` | |
| アカウント（法人） | `account_` | `AccountPage.js` | `account` | |
| スタッフ | `staff_` | `StaffPage.js` | `staff` | |
| 教室 | `kyoshitsu_` | `ClassroomPage.js` | `classroom` | prefix と PO 名が不一致 |
| 校舎 | `branch_` | `BranchPage.js` | `branch` | |
| 商品 | `shohin_` | `ShohinPage.js` | `product` | culture_beta のみ |
| 調整金（講師謝礼） | `chosekin_` | `ChosekinPage.js` | `shareiDetail` | culture_beta のみ（画面上の名称は「講師謝礼」） |
| 料金マスタ | `ryokin_master_` | `RyokinMasterPage.js` | `smsFeeMaster` | juku_test のみ |
| 料金パッケージ | `ryokin_package_` | `RyokinPackagePage.js` | `smsFeeMasterPackage` | juku_test のみ |

**ファイルの探し方（3点セット）**
1. テストファイル: `tests/tframe/page/{prefix}touroku_test.js` / `{prefix}ichiran_test.js`
2. Page Object: `pages/tframe/screens/{PageObject}`（ログイン系は `auth/`、API系は `api/`、共通は `_common/`）— テストファイルの inject 変数名からも辿れる
3. CSV: `data/tframe/{prefix}touroku_data.csv` / `{prefix}ichiran_search_data.csv`

### tframe 登録テストの共通パターン
新規登録テストを作るときは `pages/tframe/screens/KoshiPage.js`（Page Object）と `tests/tframe/page/koshi_touroku_test.js`（テスト）を雛形にすること。
シンプルな Page Object（MenuNav なし）は `pages/tframe/screens/AccountPage.js` / `pages/tframe/screens/StaffPage.js` を参照。

共通ユーティリティ（`support/utils.js`）：
- `fillTextFields(I, fieldMap)` — `FORM_FILL_FAST` ENV で高速/安全を自動切替するフィールド一括入力
- `submitTframeFormAndVerify(I, expectedName)` — 保存後に `#tf-message-summary` でバリデーションエラーを検出
- `isEnglish()` — `TFRAME_LANGUAGE=en` 判定（juku プロファイルのみ英語あり、culture は常に ja）
- `loadCsvWithProfile(baseName, dataDir)` — プロファイル対応の CSV 読み込み
- `withScenarioLabel(fn)` — Data Scenario の表示名付与

特殊フィールドの操作：
- 郵便番号 → `I.click('#zipCodeBtn')` + `I.wait(1)` で都道府県・市区町村を自動入力（番地・カナは手動）
- 銀行コード → `I.fillField('#bankCode', val)` + `I.wait(1)` で銀行名を AJAX 自動補完（bankName 列は CSV 不要）
- AJAX 連動ドロップダウン（エリア→校舎）→ エリア選択後に `I.wait(1)` してから校舎を選択

詳細な手順は `/tframe-registration-dev` スキルを参照。

## コミット・PR ガイドライン
- Conventional Commits 形式を使用: `<type>(<scope>): <summary> #<issue>`
  - type: `fix` / `feat` / `refactor` / `docs` / `test` / `chore`
  - 例: `fix(run): ログイン時のpause()を削除 #32`
  - 例: `feat(pages): HomePageにMenuNavigationMixinを追加 #18`
- 1コミット1変更を基本に、意図が伝わる単位でまとめる。
- PR には概要、対象プロファイル、実行したテスト、（UI変更時）Allureのスクショ/リンクを記載。

## run/ と scripts/ の配置ルール

### run/（テスト実行ランチャー）
- ユーザーが直接起動するファイル（.bat / .py GUI）を置く。
- **主要ランチャーは `run/run_gui.py`（GUI）**。Product → Test → Profile の3段階選択でテストを実行できる。
  - `--grep` フィルタ（タグ絞り込み）、`Open Allure`（レポート表示）も内蔵。
  - 起動: `run/run_gui.bat` をダブルクリック。
- 特殊な実行フロー（バッチ連続実行など）は `.bat` + `run/ps/*.ps1` で追加する。
  - .bat は1行 launcher:
    ```bat
    @echo off
    powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0ps\xxx.ps1" %*
    ```
  - .ps1 内のリポジトリルート取得: `Split-Path (Split-Path $PSScriptRoot -Parent) -Parent`
- .py 内のリポジトリルート取得: `os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))`
- **ファイルを別ディレクトリに移動したときは、必ずリポジトリルートの取得パスを見直すこと。**
- 命名: `{product}_run_{機能}.bat`（例: `tframe_run_nav_all.bat`）
- 汎用ツール（特定プロダクトに依存しないもの）は product prefix なし。

### scripts/（テスト支援ツール）
> **⚠️ `support/` との混同注意**
> `support/` はテスト実行中に CodeceptJS が `require()` する JS ファイル（runtime）。
> `scripts/` はテストとは独立して単体で起動する補助ツール（Python・Node スクリプト）。
> 「JS でテスト中に使うものは `support/`、単体で動かすツールは `scripts/`」と覚えること。

- テストを直接実行しない補助スクリプトを置く。
- サブフォルダはカテゴリで分ける:
  - `allure/`   : Allure 結果の管理・アーカイブ
  - `cleanup/`  : output/ と logs/ の古いファイル削除・アーカイブ
  - `html/`     : HTML解析・ページ構造の抽出
  - `docs/`     : ドキュメント生成・README 更新
  - `hooks/`    : Claude Code フック用スクリプト（配置バリデーション・Allure 自動アーカイブ・Bash ログ記録等）
- テストを直接起動するものは run/ に置く（scripts/ には入れない）。

## パス解決のルール（JS テストファイル）
- `tests/` 配下のファイルでリポジトリルート基準のパスを扱う場合は `support/repoRoot.js` を使うこと。
  ```js
  const repoRoot = require('../../../support/repoRoot'); // ..の数はファイルの深さに応じて調整
  const dir = path.join(repoRoot, config.output);
  ```
- `__dirname` + 手動の `'..'` カウントはファイル移動時に壊れるため禁止。
- `support/` 直下のファイルは `path.resolve(__dirname, '..')` が repo root と等しいので直接使ってよい。

## 環境・設定の注意点
- `--profile <name>` でプロファイル指定。`env/.env.<profile>` を用意。
- ルート `.env` を読み込み後、プロファイルが上書き。
- tframe プロファイル: `env/.env.tframe.*` で自動スキャンされる。
- shimamura プロファイル: `env/.env.shimamura.*`（template は除外）で自動スキャンされる。
