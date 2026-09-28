# shimamura 未開発画面の下地拡充 計画

状態: 進行中（2026-09 開始）

作成日: 2026-09-28
親Issue: #251

---

## 目的

tframe は「全メニューの実機採取 → カバレッジ表の自動生成 → バケット分類 → 横展開」で
応用のきく骨格ができた。shimamura も同じ順序で未開発画面を減らし、
いざ仕様変更・障害調査が来たときに **すぐテストを足せる下地**（メニュー定義・Page Object・最低限のテスト）を増やす。

---

## 現状（2026-09-28 時点）

| 観点 | tframe（参考） | shimamura |
|---|---|---|
| 画面カタログ | `pages/tframe/_common/menuSnapshot/*.json` に全メニュー実機採取 | **無い**。採取済みは受講生アイコンのサイドバー17項目＋トップアイコン9個のみ（`scripts/html/shimamura/nav_links_with_class.json`, 2026-05） |
| 未開発画面の可視化 | `docs/tframe/menu_coverage.md`（PO有無×テスト有無を自動生成） | 無い。`screen_navigation_diagram.md` はテスト起点なので未開発画面が映らない |
| Page Object 構造 | 画面別 PO ＋ `IchiranMixin` / `SortableTable` / `MenuNavigationMixin` | `pages/shimamura/screens/IchiranPage.js` 1本に10画面分が同居。各画面 navigate/fill/click/verify の4点セットをコピペ |
| メニュー定義 | 全アイコン分 | `pages/shimamura/_common/sideMenus.js` に13件 |
| テスト本数 | 一覧 95本 | 一覧 11本 / フロー 16本 / check 2本 |

### 判明済みの未着手画面（Phase 0 で正確な一覧に置き換える）

- **受講生アイコン**: 受講生別クラス一覧、資料請求一覧、債権買取顧客情報一覧、メモ一覧、メモテンプレート一覧/登録、
  候補生検索（一覧テストとして）、校舎別月間集計、EDI会員データ取込、有効性データ取込、見込み客連携
- **講師・経理**: 講師謝礼一覧、謝礼日別一覧、返金一覧（HTML取得済み・テスト無し）
- **未調査アイコン**: カレンダー、部屋･備品、Ｅメール、レポート、管理 → 業務でほぼ使わないためバケット E（対象外候補）

### 土台の信頼性に関わる既存課題

下地を増やす前後で並行して片付ける。

- #243 保存されないまま合格している登録テストの洗い出し（**最優先**）
- #211 / #210 / #209 / #207 既存テストの失敗

---

## 決定事項

| 項目 | 決定 |
|---|---|
| 採取対象環境 | `shimamura.testgcp`（testgcp2 / traininggcp との差分は取らない） |
| カレンダー・Ｅメール・レポート・管理 | 業務でほぼ使わない → バケット E（メニュー巡回で開けることの確認のみ） |
| 着手順 | Phase 0 から |

---

## Phase 0: 地図を作る

1. `scripts/html/fetch_shimamura_menus.js` 新設 — ログイン後、トップの全アイコンを巡回し左サイドバー
   （折りたたみグループ含む）を採取
2. 出力 `pages/shimamura/_common/menuSnapshot/testgcp.json`（tframe の menuSnapshot と同構造：
   `capturedAt` / `topMenu` / `sideMenu.<icon>.groups[].items[]`、route は `module` + `action` ＋分岐パラメータ）
3. `scripts/docs/gen_shimamura_menu_coverage.js` 新設 — snapshot × `sideMenus.js` × `pages/shimamura/**` × `tests/shimamura/**` を突き合わせ、
   `docs/shimamura/menu_coverage.md` の AUTOGEN 区間を生成（`--check` でドリフト検出）
4. `package.json`（`docs:menu-coverage` 系）と `.githooks/pre-commit` に接続
5. 生成結果を見て未開発画面の件数を確定し、本計画の Phase 2 バケット表を実数で更新

## Phase 1: 骨格を作る

1. `IchiranPage.js` の共通処理（sideMenus キーで遷移 → 検索条件入力 → 検索 → 結果表の可視確認）を
   `pages/shimamura/_common/` の Mixin に切り出す。画面別 PO に分割するかは Phase 0 の画面数で判断
2. **メニュー巡回テスト**を1本（全メニュー項目を開けること＋スクショ）。全画面に最薄の下地が一気に付く
3. `/shimamura-ichiran-dev` 等のスキル雛形を新パターンに更新（`feedback_skill_drift` 対策）

## Phase 2: バケット分類して横展開

| バケット | 対象（暫定） | 方針 |
|---|---|---|
| A 一覧検索 | 受講生別クラス一覧・資料請求一覧・メモ一覧・メモテンプレート一覧・債権買取顧客情報一覧・候補生検索・講師謝礼一覧・謝礼日別一覧・返金一覧 | 既存パターンで量産。最優先 |
| B 出力・集計 | 校舎別月間集計 など | `/shimamura-download-verify` で件数・構造を検証 |
| C 取込 | EDI会員データ取込・有効性データ取込・見込み客連携 | **実データを変えない**。不正ファイルで弾かれるガード確認のみ（tframe #220 と同じ方針） |
| D 登録 | メモテンプレート登録 など | 作れるデータは受講生のみという制約あり。フォーム送信方式（#231系）が使える画面に限定 |
| E 対象外候補 | カレンダー・部屋･備品・Ｅメール・レポート・管理・一括処理系 | メニュー巡回（Phase 1-2）で開けることのみ確認。共有環境のため個別テストは作らない |

## 注意点

- testgcp は共有環境。候補生は年1回DB投入でUIから作らない（受講生のみ作成可）
- Bash 経由の `--grep` に日本語を渡すと化けて全件実行される → ASCII で絞る
- 新規テスト追加時は `run/test_descriptions.json` を更新
