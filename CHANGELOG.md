# CHANGELOG

このプロジェクトの変更履歴です。月単位でまとめています。

---

## 2026-04（4月）

### 構成・ディレクトリ整理
- `bat/` ディレクトリを `run/` にリネーム（用途が直感的に伝わる名称に変更）
- `scripts/` を用途別サブフォルダに分割（`allure/` `html/` `docs/` `cleanup/`）
- `run/ps/` サブフォルダを作成し `.ps1` ファイルを分離（ユーザー向け `.bat` と実装を整理）
- `tframe_run_icons` → `tframe_run_nav_all` にリネーム（テスト内容を正確に表現）
- `scripts/run_shimamura_test_gui.py` → `run/shimamura_run_syokai_gui.py` に移動

### 実行ランチャー（run/）
- 全 `.bat` を PowerShell（`.ps1`）本体 + 薄い launcher 構成に移行
- プロファイル選択を `env/` の動的スキャン方式に統一（新プロファイル追加時に bat 修正不要）
- `view_allure.bat` を新設・全プロファイル対応の汎用 Allure ビューアに整備
- allure 表示 bat のエラー終了を、ユーザーへの案内メッセージに改善
- `shimamura_run_syokai_gui.bat` launcher 追加（GUI アプリをダブルクリックで起動可能に）
- `shimamura_run_syokai_gui.py` のリポジトリルートパスを `run/` 配置に合わせて修正

### テスト（tframe）
- `HomePage.js` 実装完成・`home_test.js` の `pause()` 除去
- `login_test.js` の `pause()` 削除（bat 自動実行に対応）
- 言語チェックテスト（`lang_check_test`）の改良：スクリーンショット保存・要素検出修正・Proxy 問題対応

### スクリプト
- `scripts/allure/archive_allure_results.py` 追加（Allure 古い結果の zip アーカイブ・削除）
- `scripts/cleanup/cleanup_output_logs.py` 追加（`output/` と `logs/` の古いファイルをアーカイブ・削除）
- 各 Python スクリプトに IN / PROCESS / OUT フローコメントを追加
- allure npm scripts 整備（`allure:serve` / `allure:report` / `allure:open` / `allure:clean` / `allure:archive`）
- cleanup npm scripts 追加（`cleanup` / `cleanup:dry` / `cleanup:output` / `cleanup:logs`）

### ドキュメント・設定
- `AGENTS.md` を新設・充実化（ディレクトリ配置ルール・コマンド一覧・コミット書式を明文化）
- `docs/` 整理（`guides/` `design/` `tools/` に分類）
- README 大幅更新（ツリー自動更新・各セクション最新化）
- AI エージェント設定（`CLAUDE.md` / `GEMINI.md` / `.agent/` / `.spec/`）を追加

---

## 2026-03（3月）

### テスト（tframe）
- 9アイコン分の Page Object・テストスケルトンを一括作成（#18）
- `MenuNavigationMixin` を抽出し、全 tframe ページに適用（student / report / calendar / help / email / teacher / accounting / master menu / master / course / calendar）
- 経理メニュー 料金マスタ一覧の遷移テストを追加（#17）
- ログインテスト対話実行用 bat ファイルを追加（#15）
- `--grep` によるシナリオ選択機能を追加（`@admin` / `@student` タグ方式）（#16）
- student アカウントでの管理者ログイン検証シナリオを追加（#14）
- tframe 用 env ファイル追加・`envLoader` のプロファイル判定を拡張（#13）

### リファクタリング（shimamura）
- CSV 読み込み・環境変数バリデーション・boolean パースを共通ユーティリティに集約（#6）
- 待機時間を定数化し、長大関数を分割・デッドコード削除（#7）
- 命名タイポ修正・デッドコードのクリーンアップ（#8）
- `parseExpectedErrors` と `logScreenUrl` を共通ユーティリティに移動（#9）
- チェックボックスクリックの DOM 検索重複を排除（#10）
- エラー検証ロジックの重複定義を排除（#11）

### 構成整理
- `e2e/` 直下の構成整理（大文字命名修正 / `output/` 分離 / temp 削除）（#12）
- bat ファイルを `bat/` ディレクトリに集約・命名を統一（#20）
- bat の相対パスバグを修正（リポジトリルートを起点に固定）（#21）

---

## 2026-02（2月）

### テスト・ツール開発
- 返金一覧テスト用画面のひな形作成
- HTMLソースから `<tr id="submenu__...">` ブロックを抽出するツール作成
- ツール改良・ファイル出力仕様調整
- GUI テストランナーのログ出力方法修正

---

## 2026-01（1月）

### テスト（shimamura）
- 異常系テストへの対応・正常系・異常系の切り替え機能追加
- コースカテゴリー指定・月途中入会の入力項目追加
- チェックボックス・リファクタリング
- Allure レポートの出力内容整形
- クラス一覧確認機能追加
- エラーコード追加

### 共通ユーティリティ整備
- shimamura 用ユーティリティを段階的に共通化（3段階）
- `@fileoverview` のメンテナンス・コーディング規約更新
- JSDoc 改良・生成方法整備

### 環境・設定
- 環境ファイルの集約・`env/` ディレクトリへの整理
- `codecept.conf.js` の軽量化
- CSV ファイルの階層整理
- GitHub Actions の設定（JSDoc 自動更新・タイムゾーン JST 対応）

### ドキュメント
- 各種学習教材の作成とリンク付け
- ディレクトリツリー出力用 Python スクリプト（`tree_generator.py`）作成
- README 更新

---

*このファイルは git log をもとに手動でまとめています。*
*詳細は `git log --oneline` または GitHub の commit 履歴を参照してください。*
