# リポジトリガイドライン

## プロジェクト構成・モジュール整理
- `tests/` にプロダクト別のシナリオ（`shimamura/`, `tframe/`, `Taskreport/`, `smoke/`）を配置。
- `pages/` は Page Object（画面操作・セレクタ）を集約。
- `support/` は共通ヘルパーと環境読み込み（`support/shimamura/` はしまむら固有のユーティリティ・定数）。
- `data/` はプロダクト別のテストデータ（CSV/JS）。
- `env/` はプロファイル別 `.env.*`、ルート `.env` は既定値。
- `output/`, `allure-results/`, `allure-report/` は生成物。
- `docs/`, `doc/` に学習資料・設計メモ。

## ビルド・テスト・開発コマンド
- `npm install` 依存関係のインストール。
- `npm test` 全テスト実行（CodeceptJS）。
- `npm run test_s` しまむらテスト（`--profile shimamura.testgcp`）。
- `npm run test_t` T-Frame テスト一式。
- `npm run test_taskreport` Taskreport テスト（`--profile taskreport`）。
- `npx codeceptjs run ./tests/shimamura/syokai_touroku_test.js --profile shimamura.testgcp` 単体実行例。
- `npx allure serve allure-results` Allure レポート表示。
- `npm run docs:shimamura` JSDoc 生成。

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

## コミット・PR ガイドライン
- コミットは短く内容が伝わる表現（例: `リファクタリング_チェックボックス`, `入力項目追加：月途中入会`）。
- 1コミット1変更を基本に、意図が伝わる単位でまとめる。
- PR には概要、対象プロファイル、実行したテスト、（UI変更時）Allureのスクショ/リンクを記載。

## bat/ と scripts/ の配置ルール

### bat/（テスト実行ランチャー）
- ユーザーが直接起動するファイル（.bat / .py GUI）を置く
- ロジックは `bat/ps/*.ps1` に書き、.bat は1行 launcher にする
  ```bat
  @echo off
  powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0ps\xxx.ps1" %*
  ```
- 命名: `{product}_run_{機能}.bat`（例: `tframe_run_login.bat`, `shimamura_run_syokai.bat`）
- 汎用ツール（特定プロダクトに依存しないもの）は product prefix なし（例: `view_allure.bat`）
- テストを GUI で起動するスクリプトも bat/ に置く（例: `shimamura_run_syokai_gui.py`）

### scripts/（テスト支援ツール）
- テストを直接実行しない補助スクリプトを置く
- サブフォルダはカテゴリで分ける:
  - `allure/`  : Allure 結果の管理・アーカイブ
  - `html/`    : HTML解析・ページ構造の抽出
  - `docs/`    : ドキュメント生成・README 更新
- テストを直接起動するものは bat/ に置く（scripts/ には入れない）

## 環境・設定の注意点
- `--profile <name>` でプロファイル指定。`env/.env.<profile>` を用意。
- ルート `.env` を読み込み後、プロファイルが上書き。
