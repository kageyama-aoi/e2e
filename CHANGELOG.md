# CHANGELOG

このプロジェクトの変更履歴です。月単位でまとめています。

---

## 2026-06（6月）

### GUI ランチャーに sv-ttk テーマを任意適用（2026-06-04）

`pip install sv-ttk` でインストール済みの場合に限り、起動時に Windows 11 スタイルのモダンテーマが自動適用されます。
未インストールでも動作は変わりません。

**CustomTkinter への全面移行については不採用としました。**
理由と経緯の詳細は [`run/README.md` の「UI テーマについて」](run/README.md#ui-テーマについて設計判断の記録) を参照してください。

---

### GUI ランチャーの shimamura 操作性向上（2026-06-03）

- テストの種類がひと目でわかるようにサブフォルダ分類（`auth` / `flow` / `page` / `check`）
  - `flow` ：ログイン・退会・登録など複数画面をまたぐ業務フロー
  - `page` ：一覧・検索などの単体画面操作
  - `auth` ：ログイン認証
  - `check` ：探索・調査系
- `page` テストのリスト表示に機能番号（`[1002_4_3]` 形式）を表示。設計書の番号を `test_descriptions.json` に記入すると即反映
- プロファイルの表示順をお好みの順番に固定可能（`test_descriptions.json` の `_profile_order` で設定）
  - shimamura は `testgcp → testgcp2 → traininggcp → smbcpos_training → MySQL84_dev` 順に設定済み

### CSV テーブルエディタの新規搭載（2026-06-03）

「Open CSV」ボタンでテーブル形式のエディタが開きます。カンマを数えて直接ファイルを編集する必要はありません。

**見やすさ**
- 列ヘッダーを太字・青字で強調表示
- 1行おきに背景色を変えてゼブラ表示
- 左端に行番号（`#`）を自動付与

**編集操作**
- セルをダブルクリックで編集、Enter で確定
- 「行を追加」「行を削除」ボタンで行を管理
- Save ボタンで上書き保存、カンマ数は自動管理

**入力支援**
- 日付列（`YYYY-MM-DD` 形式）はカレンダーが開き日付を選んで入力
- 金額などの数値列は自動でカンマ区切り表示（`1,000,000`）、保存時は自動除去
- `0001` など先頭ゼロ付きのコード類は数値として変換しない

**補足情報**
- ウィンドウ下部にファイル名・レコード数・最終更新日時を常時表示

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
