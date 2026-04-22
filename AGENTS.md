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
- `run/view_allure.bat` ブラウザでレポート表示（対話式・推奨）。
- `npm run allure:serve` allure-results をそのままサーブ。
- `npm run allure:report` レポート生成（allure-report/ に出力）。
- `npm run allure:open` 生成済みレポートを開く。
- `npm run allure:clean` allure-results をクリア。
- `npm run allure:archive` 古い実行結果を zip アーカイブ・削除。

### ドキュメント
- `npm run docs:jsdoc` JSDoc 生成（tests/ pages/ support/ 全対象）。
- `npm run docs:update-readme-map` README のディレクトリツリーを自動更新。
- `npm run docs:tree:file` ツリーを docs/tree.md に出力。

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

### tframe 登録テストの共通パターン
新規登録テストを作るときは `pages/tframe/KoshiPage.js`（Page Object）と `tests/tframe/page/koshi_touroku_test.js`（テスト）を雛形にすること。
シンプルな Page Object（MenuNav なし）は `AccountPage.js` / `StaffPage.js` を参照。

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
- ロジックは `run/ps/*.ps1` に書き、.bat は1行 launcher にする。
  ```bat
  @echo off
  powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0ps\xxx.ps1" %*
  ```
- .ps1 内のリポジトリルート取得: `Split-Path (Split-Path $PSScriptRoot -Parent) -Parent`
- .py 内のリポジトリルート取得: `os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))`
- **ファイルを別ディレクトリに移動したときは、必ずリポジトリルートの取得パスを見直すこと。**
  `__file__` や `$PSScriptRoot` はファイルの現在地を基準にするため、移動すると壊れる。
- 命名: `{product}_run_{機能}.bat`（例: `tframe_run_login.bat`, `shimamura_run_syokai.bat`）
- 汎用ツール（特定プロダクトに依存しないもの）は product prefix なし（例: `view_allure.bat`）
- テストを GUI で起動するスクリプトも run/ に置く（例: `shimamura_run_syokai_gui.py`）

### scripts/（テスト支援ツール）
- テストを直接実行しない補助スクリプトを置く。
- サブフォルダはカテゴリで分ける:
  - `allure/`   : Allure 結果の管理・アーカイブ
  - `cleanup/`  : output/ と logs/ の古いファイル削除・アーカイブ
  - `html/`     : HTML解析・ページ構造の抽出
  - `docs/`     : ドキュメント生成・README 更新
- テストを直接起動するものは run/ に置く（scripts/ には入れない）。

## 環境・設定の注意点
- `--profile <name>` でプロファイル指定。`env/.env.<profile>` を用意。
- ルート `.env` を読み込み後、プロファイルが上書き。
- tframe プロファイル: `env/.env.tframe.*` で自動スキャンされる。
- shimamura プロファイル: `env/.env.shimamura.*`（template は除外）で自動スキャンされる。
