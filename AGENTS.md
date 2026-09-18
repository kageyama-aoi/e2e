# リポジトリガイドライン

> 久々にプロジェクトへ戻ったときは [`docs/project/orientation.md`](docs/project/orientation.md) を起点にすると、
> 全体像・テスト一覧・前回の続きを順に把握できる。

## プロジェクト構成・モジュール整理
- `tests/` にプロダクト別のシナリオ（`shimamura/`, `tframe/`, `taskreport/`, `smoke/`）を配置。
- `pages/` は Page Object（画面操作・セレクタ）を集約。
- `support/` は共通ヘルパーと環境読み込み（`support/shimamura/` はしまむら固有のユーティリティ・定数）。
- `data/` はプロダクト別のテストデータ（CSV/JS）。
- `env/` はプロファイル別 `.env.*`、ルート `.env` は既定値。
- `run/` はテスト実行ランチャー、`scripts/` はテスト支援ツール（詳細は後述）。
- `output/`, `allure-results/`, `allure-report/` は生成物。
- `docs/` に学習資料・設計メモ（`common/`=横断ガイド、`project/`=設計・アーキテクチャ、`shimamura/` `tframe/`=プロダクト別）。

## ビルド・テスト・開発コマンド

### テスト実行
- `npm install` 依存関係のインストール。
- `npm run gui` テスト実行ランチャー（GUI）を起動（= `python run/run_gui.py`）。
- `npm test` 全テスト実行（CodeceptJS）。
- `npm run test_s` しまむらテスト（実行前に `pretest_s` フックが `pause()` 残存をチェック）。
- `npm run test_t` T-Frame テスト一式。
- `npm run test_taskreport` Taskreport テスト。
- `npx codeceptjs run ./tests/shimamura/flow/syokai_touroku_test.js --profile shimamura.testgcp` 単体実行例。

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
- `npm run docs:catalog` テストカタログ（`docs/project/test_catalog.md`）を再生成。`--check` でドリフト検出。
- `npm run docs:menu-coverage` tframe アイコン別マッピング表（`docs/tframe/menu_coverage.md` の AUTOGEN 区間）を再生成。`--check` でドリフト検出。
- `npm run docs:all` ツリー＋カタログ＋メニュー表をまとめて更新。
- ツリー・カタログ（`tests/` 変更時）と tframe メニュー表（`pages/tframe/screens/` `pages/tframe/_common/menuSnapshot/` `tests/tframe/page/` `codecept.conf.js` 変更時）は `.githooks/pre-commit` で自動再生成される（`npm install` の postinstall で有効化）。

## ディレクトリ配置ルール

### 各ディレクトリの「置いてよいもの／置いてはいけないもの」

| ディレクトリ | 置いてよいもの | 置いてはいけないもの |
|---|---|---|
| `tests/` | テストシナリオ（`*_test.js`）。`<product>/util/` にのみ GUIランチャー専用の手動起動スクリプト（`*_test.js` 非末尾）を許可 | Page Object、汎用ユーティリティ、データ |
| `pages/` | Page Object、メニュー定義（`sideMenus.js`）、URL解決ヘルパー（`_urlPath.js`）、実機採取メニュースナップショット（`tframe/_common/menuSnapshot/*.json`） | テスト入力データ、汎用ユーティリティ |
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
| ディレクトリ構成の変更（追加・削除・移動） | `README.md`（`npm run docs:update-readme-map` で自動更新）、`docs/project/project_architecture_guide.md` |
| `data/tframe/` のファイル追加・削除・移動 | `data/tframe/README.md` の対応表 |
| 配置ルールの変更・新カテゴリの追加 | 本ファイル（`AGENTS.md`）のディレクトリ配置ルール表 |
| 新スキルの追加 | 本ファイル（`AGENTS.md`）のスキル一覧（下記） |
| `tests/` 配下に新テストファイルを追加（tframe / shimamura / taskreport / smoke 問わず） | `run/test_descriptions.json`（GUI の TestFile 欄に日本語説明を表示するために必須）。`docs/project/test_catalog.md` は commit 時に自動再生成 |
| tframe の画面 PO / 一覧・登録テストの追加、tframe メニューの改定 | `docs/tframe/menu_coverage.md` のアイコン別表は commit 時に自動再生成（`gen_tframe_menu_coverage.js`）。メニュー改定時は `pages/tframe/_common/menuSnapshot/*.json` を実機採取し直す。**逆引き（route → PO/テスト/CSV）はこの自動生成表を見る** |
| **Page Object / utils の共通パターン変更**（関数名の変更・共通ユーティリティの新設・Mixin 化・雛形ファイルの差し替え） | 該当プロダクトの `.claude/skills/<product>-*/SKILL.md`（雛形・参照ファイル・テンプレ）、`docs/<product>/` の学習ガイド、本ファイルの「共通ユーティリティ」一覧。**コードだけ直してスキルを放置すると、次のテストが古いパターンで量産される** |
| `scripts/` 配下のスクリプトを移動・リネーム | `package.json` の該当 npm script、`.github/workflows/*.yaml`（CI がこれらを直接パス指定で呼んでいないか）。**CI 設定は push して実行されるまでローカルで気付けない**ため、移動時は必ず `grep -rn "旧パス" .github/ package.json` まで確認する（`/local-safe-move` Step 1 の対象拡張済み） |

> 参照パス・関数名のドリフトは `npm run docs:check-refs`（`scripts/docs/check_doc_refs.py`）で機械的に検出できる。
> `docs/` `.claude/skills/` `pages/` `support/` `.github/workflows/` を含むコミットでは pre-commit が警告モードで自動実行する
> （`.github/workflows/*.yaml` も走査対象。CI だけが持つパス参照はここでしか拾えない）。
> **CI ワークフロー自体は生パスを書かず、`package.json` の npm script を呼ぶ**（`npm run docs:update-readme-map` 等）ことで
> 「スクリプト移動時に直す場所」を1箇所に集約する（documentation_update.yaml 参照）。

### 計画資料（`docs/**/*_plan.md`）のステータス表記（必須）

調査・導入計画の md は、半年後に読み返したとき「今の話か終わった話か」で迷わないよう、冒頭に必ず状態を書く。

```
状態: 進行中（YYYY-MM 開始） / 完了（YYYY-MM） / 廃止（理由）
```

完了した計画は削除せず、`状態: 完了` を付けて歴史資料として残してよい。

### docs/shimamura/ のサブフォルダ規約

shimamura の docs は「業務としてどう動くか」と「テストがどう検証するか」で置き場所を分ける。

| サブフォルダ | 置くもの | 例 |
|---|---|---|
| `docs/shimamura/concepts/` | 業務仕様・ドメイン概念（DBテーブルに基づく処理ロジックの解説） | `運営管理費の概念.md`, `月謝一括作成の概念.md`, `発表会の概念.md`, `経理ビューの概念.md`, `退会機能の概念.md` |
| `docs/shimamura/flow/` | E2Eテストの流れ解説（`/flow-explain` が出力する `<テスト名>_flow.md`） | `gessya_ikkatu_flow.md` |

### 利用可能なスキル一覧

| スキル | 用途 |
|---|---|
| `/placement-gate` | 新ファイル作成前に性質を分類し、配置先を確定するゲート |
| `/tframe-registration-dev` | tframe 登録・編集テストの新規作成・修正手順 |
| `/tframe-ichiran-dev` | tframe 一覧検索テストの新規作成・修正手順 |
| `/tframe-flow-dev` | tframe 業務フロー（複数画面をまたぐシナリオ）テストの新規作成・修正手順 |
| `/local-safe-move` | ファイル移動時のプロトコル（参照修正・パス見直し・doc-sync）を一括実施（e2e 専用） |
| `/doc-sync` | 開発作業後のドキュメント連動更新チェックリストを実施 |
| `/handoff` | セッション終了時のハンドオフ文書作成 |
| `/newplan` | 新しい開発サイクルの開始（`.spec/` のアーカイブ＆新規作成） |
| `/tframe-html-fetch` | tframe 画面の HTML 取得 + フォームフィールド ID の抽出・整理 |
| `/shimamura-html-fetch` | shimamura 画面の HTML 取得 + フォームフィールド（name/id 属性）の抽出・整理 |
| `/shimamura-ichiran-dev` | shimamura 一覧検索テストの新規作成・修正手順 |
| `/shimamura-registration-dev` | shimamura 登録・処理フローテストの新規作成・修正手順 |
| `/shimamura-download-verify` | shimamura ダウンロードボタンでファイルを取得・検証するテストの新規作成手順（CSV・固定長両対応） |
| `/shimamura-screen-diagram` | shimamura の画面遷移図（Mermaid）の作成・更新手順 |
| `/flow-explain` | flow系E2Eテストのロジックを散文＋Mermaidフローチャートで解説する（画面遷移図の /shimamura-screen-diagram とは別視点） |
| `/launcher-review` | `run/run_gui.py` 修正後にレイアウトの整合性を静的レビューする |
| `/launcher-gui-design` | `run/run_gui.py` を含むTkinterランチャーGUIの設計判断（サブプロセス実行方式、スレッド安全性、Windowsパス問題等）を検討する（グローバルスキル） |
| `/github-issue-dev` | 開発作業全般（バグ修正・機能追加・リファクタリング）を Issue 駆動で進める |
| `/string-template-refactor` | 文字列テンプレートのリファクタリング手順を実施する（グローバルスキル） |

## コーディング規約・命名
- JavaScript は既存のスタイルに合わせる（強制フォーマッタなし）。
- 関数名は `verbNoun`（例: `openStudentTab`）、遷移系は `navigateTo...` / `open...` / `goTo...`。
  - `ShouldBeOnXxx` のような独自パターンは使わない（過去に混在していたが `verbNoun` に統一済み）。
- セレクタは Page Object に集約し、テスト内の直書きを避ける。
  - セレクタオブジェクトのカテゴリ名は `fields`（テキスト入力）/ `selects`（プルダウン）/
    `buttons`（ボタン）/ `checkboxes` / `error`（エラー表示）を基本とする。
    画面固有の追加カテゴリ（`accordion` 等）が必要な場合はそのまま追加してよいが、
    既存カテゴリと同じ意味のものを別名で作らない（例: `fields` と `textbox` を両方使わない）。
- 待機は `I.waitForElement` / `I.waitForVisible` を優先し、`I.wait(秒)` は最小限。
  - AJAX補完待ちなど繰り返し使う待機時間は `TIMEOUTS`（`support/<product>/constants.js`）に
    定数化する。マジックナンバーを直書きしない。
- 新規ファイル・識別子のローマ字表記はヘボン式を基本とする（例: 一括=`ikkatsu`、対策=`taisaku`）。
  - 既存ファイルで訓令式（例: `Ikkatu`）や画面名由来の慣用表記が既に定着している場合は、
    無理に一括リネームせず現状を尊重する。ただし誤読・タイポ（例: 月謝を"tsukihi"と読む等）が
    見つかった場合は、影響範囲を確認のうえ修正してよい。
- JSDoc の `@param` / `@returns` オブジェクト型注釈は TypeScript 風の `?:` 省略記法・
  タプル型 `Array<[A, B]>` を使わない（Closure/JSDoc の型パーサーが解釈できずビルド時エラーになる）。
  - 省略可能なプロパティは `{name: (string|undefined)}` のように `(Type|undefined)` で書く。
  - タプルは `Array<Array<string>>` のように書くか、型を諦めて説明文だけにする。
  - コミット前に `npm run docs:jsdoc` が ERROR 無しで通るか確認する（`pages/` `support/` `tests/` の
    `.js` を含むコミットでは pre-commit が警告モードで自動チェックする）。

## テスト運用ガイド
- フレームワーク: CodeceptJS + Playwright、レポートは Allure。
- テストファイル名は `*_test.js`、配置は `tests/<product>/`。
- 1 Scenario = 1 フロー、Arrange → Act → Assert の順を意識。
- **未完成テストは `@wip` タグで隔離する。** ひな形・「（仮）」・`pause()` 待ちなど動作が確定していないテストは
  Scenario 名に `@wip` を付け、`run/test_descriptions.json` の説明を `[WIP] ` で始める。
  `@wip` は `npm test` 系の既定実行と GUI の通常一覧から除外する（実行したいときは `--grep @wip` で明示）。
  コメントに「ひな形」と書くだけでは GUI からは完成品と区別がつかない。
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

### shimamura テストのフォルダ分類
`tests/shimamura/` 配下も性質別サブフォルダで管理する（#100 で分類済み）。

| フォルダ | 対象 | 例 |
|---|---|---|
| `auth/` | ログイン・認証系 | shimamura_login_test |
| `page/` | 一覧・検索画面の操作／表示確認（`*_ichiran_test.js`）、ファイル出力検証 | student_search_ichiran_test, validity_data_output_test |
| `flow/` | 登録・処理フロー（複数画面・バッチ処理をまたぐ） | syokai_touroku_test, gessya_ikkatu_test |
| `check/` | 表示・設定の確認系 | bank_payment_type_check_test |
| `util/` | GUIランチャー専用の手動起動スクリプト（`*_test.js` 非末尾。テストスイートには含まれない） | login_and_hold.js |

### tframe 画面名 ↔ ファイル名 対照表

特定画面のコードを探すときに使う。`Feature('教室一覧')` で grep しても見つかる。

> **route から PO/テスト/CSV を逆引きしたいときは `docs/tframe/menu_coverage.md` の
> 「アイコン別 マッピング表」（自動生成・全画面網羅）を見ること。**
> 下表は prefix 命名の慣習（PO 名とズレるもの等）を手短にまとめた補助。

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
| 料金一覧（経理） | `fee_` | `KeiriIchiranPage.js` | `smsFee` | 一覧検索のみ・juku_beta 主 |
| 契約一覧（経理） | `contract_` | `KeiriIchiranPage.js` | `smsContract` | 一覧検索のみ・juku_beta 主 |
| 入金一覧（経理） | `payment_` | `KeiriIchiranPage.js` | `smsPayment` | 一覧検索のみ・juku_beta 主 |
| 未収金一覧（経理） | `unpaid_amount_` | `KeiriIchiranPage.js` | `smsTransaction` | `sw/unpaidAmountList`・juku_beta 主 |
| 入出金一覧（経理） | `transaction_` | `KeiriIchiranPage.js` | `smsTransaction` | `sw/_default`・juku_beta 主 |
| Eメール一覧 | `email_` | `EmailIchiranPage.js` | `email` | 一覧検索のみ（menu-nav は `EmailPage.js`）・juku_beta 主 |
| Eメールテンプレート一覧 | `email_template_` | `EmailIchiranPage.js` | `emailTemplate` | juku_beta 主 |
| Eメールテンプレートカテゴリ一覧 | `email_template_category_` | `EmailIchiranPage.js` | `emailTemplateCategory` | juku_beta 主 |
| 名簿リスト一覧 | `prospect_list_` | `EmailIchiranPage.js` | `prospectList` | juku_beta 主 |
| お知らせ一覧 | `announcement_` | `EmailIchiranPage.js` | `announcement` | juku_beta 主 |
| アンケート一覧 | `poll_` | `EmailIchiranPage.js` | `poll` | juku_beta 主 |
| 問合せ・入学・退学レポート | `report_inquiry_` | `ReportIchiranPage.js` | `report` | `sw/inquiryEnrollCancelReport`・一覧検索のみ（menu-nav は `ReportPage.js`）・culture_beta 主 |
| 受講生データ組合せレポート | `report_stdata_` | `ReportIchiranPage.js` | `report` | `sw/stDataCombinedReport`・culture_beta 主 |
| 受講生スケジュールレポート | `report_stschedule_` | `ReportIchiranPage.js` | `report` | `sw/stScheduleReport`・culture_beta 主 |
| 講師スケジュールレポート | `report_teschedule_` | `ReportIchiranPage.js` | `report` | `sw/teScheduleReport`・culture_beta 主 |
| 本日の出席表一覧 | `attendance_` | `CoursePage.js` | `attendance` | `sw/_default`・culture_beta のみ（校舎ごとの出席データ在庫依存） |
| 口座振替データ履歴 | `bank_actions_history_` | `KeiriIchiranPage.js` | `bankActionsHistory` | `sw/_default`・culture_beta / juku_beta 両対応 |
| 講師謝礼合計一覧 | `sharei_total_` | `KeiriIchiranPage.js` | `shareiTotal` | `sw/_default`・culture_beta のみ。計上月がセッション記憶されるため要リセット |
| 入退記録一覧 | `entrance_log_` | `CalendarPage.js` | `entranceLog` | `sw/_default`・juku_beta のみ（一覧検索のみ・menu-nav は従来通り `CalendarPage.js` 内で共存） |
| 連絡一覧 | `contact_` | `EmailIchiranPage.js` | `contact` | `sw/_default`・juku_beta のみ。スケジュール開始日/作成日は「どちらか一方は7日以内」の制約あり |
| 名簿リスト編集 | `prospect_list_touroku_` | `EmailTourokuPage.js` | `prospectList` | `ew/_default`・登録のみ（menu-nav は `EmailPage.js`・一覧検索は `EmailIchiranPage.js`）・culture_beta / juku_beta 両対応・#215 |
| お知らせ編集 | `announcement_touroku_` | `EmailTourokuPage.js` | `announcement` | `ew/_default`・culture_beta / juku_beta 両対応・#215 |
| Eメールテンプレートカテゴリ編集 | `email_template_category_touroku_` | `EmailTourokuPage.js` | `emailTemplateCategory` | `ew/_default`・culture_beta / juku_beta 両対応・#215 |
| Eメールテンプレート編集 | `email_template_touroku_` | `EmailTourokuPage.js` | `emailTemplate` | `ew/_default`・categoryId必須（環境別CSVで切替）・culture_beta / juku_beta 両対応・#215 |
| 支払調書 | `payment_statement_output_` | `KeiriIchiranPage.js` | `shareiTotal` | `sw/paymentStatement`・帳票出力系（ファイル中身は未検証・成功メッセージのみ確認）・culture_beta のみ・#217 |
| 入退記録編集 | `entrance_log_touroku_` | `CalendarPage.js` | `entranceLog` | `ew/_default`・受講生ポップアップから選択（`selectFirstFromPopupPicker`）・juku_beta のみ・#216 |

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
- AJAX 連動ドロップダウン（エリア→校舎）→ `support/tframe/utils.js` の `selectAreaThenBranch(I, { area, branch })` を使う（ID体系が `#school_area_id`/`#school_branch_id` と `#branchId_area_id`/`#branchId_branch_id` の2種あるため、後者は `areaSelector`/`branchSelector` を明示指定する）
- 受講生・講師・コース等を選ぶ「ポップアップピッカー」（`#xxxPicker_start` ボタン）→ `support/tframe/utils.js` の
  `selectFirstFromPopupPicker(I, { startSelector, displaySelector })` を使う。**新規タブではなくページ内モーダル**で開き、
  結果行に `<a>` は無く1列目のラジオボタンで選択する（CSSで見た目上非表示のため `executeScript` で直接 click する。#216）。
  先頭の検索結果を選ぶだけなので、対象データが出力条件（日付レンジ等）と噛み合うかは別途確認が要る（#218）。
- 一括処理・計算系ボタン（翌月月謝一括作成・講師謝礼計算等）の実行結果確認 → `support/tframe/utils.js` の
  `verifyBulkActionResult(I, buttonSelector)` を使う。冪等な画面が返す「成功」と「対象データなし」
  （`tf-message-error` クラスだが実質は正常系）の両方を日英で許容する（#219）。
- インポート系画面の未選択・不正フォーマット等のガードメッセージ確認 → `support/tframe/utils.js` の
  `verifyGuardMessage(I, expectedMessage)` を使う（#220）。
- 一覧の列ヘッダソート検証 → `IchiranMixin` の `sortByColumnKey(key, dir)`（列キー指定・日英非依存）/
  `grabResultRowsByKey()`（`{列キー: 値, _recordId}` で抽出）と、`support/tframe/sortVerify.js` の
  `findSortViolations(rows, {key, type, dir, secondary})` を使う。第2キーは画面ごとの裏設定なので
  Page Object の `sortSpec` に持たせる（雛形: `CoursePage.sortSpec` + `course_ichiran_sort_test.js`。#223）。

詳細な手順は `/tframe-registration-dev` スキルを参照。

### tframe 業務フロー（複数画面をまたぐシナリオ）のFlowPageパターン

1画面完結ではなく「受講生登録→コース紐付け」のように複数画面・ポップアップをまたぐシナリオは
`pages/tframe/flow/{機能名}FlowPage.js` に集約する（shimamura の `pages/shimamura/flow/*FlowPage.js`
と同じ役割。ただし tframe 規約に合わせて書き直す）。雛形は `pages/tframe/flow/JukuseiCourseFlowPage.js`
と対応するテスト `tests/tframe/flow/jukusei_course_link_flow_test.js`。詳細な手順は
`/tframe-flow-dev` スキルを参照。

### shimamura テストの共通パターン

**雛形は実ファイルを正とする**（SKILL.md のテンプレは骨格のみ。書き方に迷ったら以下を読む）。

| 種類 | 雛形（テスト） | 雛形（Page Object / FlowPage） |
|---|---|---|
| 一覧検索 | `tests/shimamura/page/transaction_ichiran_test.js` | `pages/shimamura/screens/IchiranPage.js`（メニュー定義は `pages/shimamura/_common/sideMenus.js`） |
| 1画面完結の登録・取込（FlowPage なし） | `tests/shimamura/flow/smbc_state_import_test.js` | — |
| 複数画面フロー | `tests/shimamura/flow/koushi_sharei_manual_test.js` | `pages/shimamura/flow/KoushiShareiFlowPage.js` |
| セットアップ→本体の2段構成（セッションファイル受け渡し） | `tests/shimamura/flow/happyoukai_setup_test.js` / `happyoukai_touroku_test.js` | `pages/shimamura/flow/HappyoukaiFlowPage.js` |

共通ユーティリティ（**あるものを使う。FlowPage 内で再実装しない**）：

| 関数 / 定数 | 置き場 | 用途 |
|---|---|---|
| `beforeShimamura` | `support/shimamura/hooks.js` | `Before(beforeShimamura)` でログイン＋担当者番号入力 |
| `fillTextFieldsByName(I, fieldMap)` | `support/shimamura/utils.js` | `name=` 属性のテキスト一括入力（`FORM_FILL_FAST` で高速/安全切替） |
| `fillTextFieldsBySelector(I, pairs)` | 同上 | `#id` 等の CSS セレクタ指定版 |
| `assertNoShimamuraError(I, context)` | 同上 | 保存後に `#top_err_info_msg_div` が空であることを確認 |
| `verifyValidationErrors(I, errors, container)` | 同上 | 期待エラー文言の検証 |
| `resolveDynamicDateIfPast(I, date, label, {graceMonths})` | 同上 | CSV の過去日付を当月に自動補正（契約日=0、退会=1） |
| `toggleGroupmenu(I, {icon_id, menuname})` | 同上 | サイドメニューの折りたたみ開閉 |
| `clickCheckboxByLabelOrName` / `verifyCheckboxCheckedByLabelOrName` | 同上 | 特殊 DOM のチェックボックス操作 |
| `extractRecordId(url)` | 同上 | URL / href から `record=` の ID を取り出す（保存後の詳細画面 URL や一覧リンクから） |
| `waitForSaveResult(I, {successSelector, successMode})` | 同上 | 保存後「エラー表示 or 成功状態」まで動的に待つ。`appears`（既定: `edit_button` 出現）/ `disappears`（`save_button` 消失）/ `hasText`（完了メッセージ） |
| `buildTestName(prefix, row)` | 同上 | セットアップ系で受講生名を「prefix+MMDD / testNo+scenario」に組み立てる |
| `ensureAccountTransferSchedules(I, {claimMonth, …})` | `support/shimamura/accountTransferSchedule.js` | 口座振替スケジュールの事前確保（月謝一括作成・発表会参加費の前提） |
| `BASE_URL` | `support/shimamura/constants.js` | 末尾 `/` 付きに正規化したベース URL。`BASE_URL + 'index.php?...'` で連結する（`process.env.BASE_URL` を直接連結しない） |
| `TIMEOUTS` / `SELECTORS` / `URLS` | `support/shimamura/constants.js` | 待機秒数・共通セレクタ（`ERROR_CONTAINER`, `RESULT_LINK`）・固定 URL |
| `prepareInput` / `buildExecutionPlan` | `support/shimamura/syokai_helpers.js` | 経理ビューB の実行計画（breakTarget によるステップ skip） |

ナビゲーション：
- 一覧画面へは `sideMenus.js` に定義を足し、`IchiranPage._navigateViaMenu(menus.xxx)` 経由で遷移する（`SHIMAMURA_NAV=sidebar` でサイドバー経路、既定は directUrl）。
- 管理タブ経由の遷移は `classMemberPageShimamura.navigateToAdminTab(I, tab, title)` + `clickSubMenuLink(link, title)`。
- 受講生まわりのサイドバー遷移（`navigateToAdminTab` 後の `toggleGroupmenu` + `clickSubMenuLink`）は
  `SyokaiFlowPage.js` の `navigateToStudentGroup(I, page)`（候補生検索へ）/ `navigateToKeirisyoriView(I, page)`（経理ビュー個人へ）に
  集約済み。他の FlowPage（`GessyaIkkatuFlowPage.js` 等）はこれを import して使う。**FlowPage 内で 3 行の遷移を再実装しない。**
- URL 直遷移は `index.php?module=X&action=Y` 形式で可能（skill_plan.md Phase 0 で確認済み）。

詳細な手順は `/shimamura-ichiran-dev` / `/shimamura-registration-dev` / `/shimamura-download-verify` を参照。

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
  - `input/`, `output/` : 抽出スクリプトの入出力作業ディレクトリ（用途ごとにサブフォルダで区切る）
- カテゴリに収まらない単発スクリプトのみ直下に置く（例: `check_pause.js` = `npm run pretest_s` フック）。
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
