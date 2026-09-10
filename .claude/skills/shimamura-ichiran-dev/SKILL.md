---
name: shimamura-ichiran-dev
description: |
  shimamura の一覧検索画面に対する E2E テストを新規作成・修正するスキル。
  以下のような依頼があったら使用すること：
  - shimamura の特定画面（一覧・検索）のテストを新規作成したい
  - 「〇〇一覧のテストを作って」という依頼
  - 既存の一覧検索 Page Object メソッド / CSV / テストファイルを修正・追加したい

  ワークフロー: フォーム確認（/shimamura-html-fetch） → sideMenus.js に定義追加 → IchiranPage.js にメソッド追記 → CSV → テストファイル → 実行確認

  ※ 登録・処理フローのテストは /shimamura-registration-dev スキルを使うこと
  ※ 一覧画面でも「出力」ボタンでファイルをダウンロード・検証するテストは /shimamura-download-verify を使うこと
---

# shimamura 一覧検索テスト開発スキル

shimamura の一覧（ListView）画面に対する E2E テスト（Page Object メソッド / CSV / テストファイル）を
新規作成・修正する際の標準手順。

> **雛形は実ファイルが正。** このスキルのコードは骨格だけなので、書き方に迷ったら必ず雛形を開く。
> 雛形と共通ユーティリティの一覧は `AGENTS.md`「shimamura テストの共通パターン」にもある。

---

## tframe との主な差分（必ず把握すること）

| 項目 | tframe | shimamura |
|---|---|---|
| 検索ボタン | `#swSearchButton` | `input[name="search"]`（一部画面は `input[name="button"][value="表示"]` 等） |
| 検索結果 | `.tf-group-body-search-result tr` | `a.listViewTdLinkS1`（`SELECTORS.RESULT_LINK`）。未収金・出席表は `.listViewPaginationTdS1` |
| 画面遷移 | URL 直遷移 | `sideMenus.js` の定義 → `IchiranPage._navigateViaMenu()`（既定は directUrl、`SHIMAMURA_NAV=sidebar` でサイドバー経路） |
| Page Object 置き場 | `pages/tframe/screens/{画面}Page.js`（画面ごと） | `pages/shimamura/screens/IchiranPage.js`（全一覧画面を1ファイルに集約） |
| 認証 | `loginKannrisyaPage.login()` | `Before(beforeShimamura)`（`support/shimamura/hooks.js`） |
| CSV dataDir | `'tframe'` を明示 | `'shimamura'` を明示（デフォルト値なし） |
| エラー表示 | `#tf-message-summary` | `#top_err_info_msg_div`（`SELECTORS.ERROR_CONTAINER`） |

---

## 前提知識：参照すべきファイル（雛形）

| 目的 | 参照先 |
|---|---|
| **テストファイルの雛形** | `tests/shimamura/page/transaction_ichiran_test.js` |
| **Page Object の雛形**（1画面ぶんのブロック） | `pages/shimamura/screens/IchiranPage.js` の「入出金一覧 (transaction_list)」ブロック |
| メニュー定義（directUrl / moduleUrl / shortcut / collapseToggle） | `pages/shimamura/_common/sideMenus.js` |
| 結果セレクタが特殊な画面の例 | `IchiranPage.js` の「未収金一覧」「受注・売上」「出席表検索」ブロック |
| ログイン処理 | `support/shimamura/hooks.js`（`beforeShimamura`） |
| 共通ユーティリティ・定数 | `support/shimamura/utils.js`（`fillTextFieldsByName`）、`support/shimamura/constants.js`（`TIMEOUTS` / `SELECTORS`） |
| CSV の形式 | `data/shimamura/transaction_ichiran_search_data.csv` |
| 画面 URL 一覧 | `scripts/html/shimamura/main_menu_links.json` / `*_links.json` |
| フォルダ配置ルール | `AGENTS.md` |

---

## ワークフロー

### Step 1: 対象画面の確認

1. **検索フォームの HTML を確認する**
   - `scripts/html/shimamura/{name}.html` が既にあれば流用する
   - なければ `/shimamura-html-fetch` スキルで取得する
   - 拾うもの: テキスト入力の `name=`、セレクトの `name=`、検索ボタンのセレクタ、結果テーブルのリンククラス、日付範囲フィールドの有無

2. **URL（module / action）とサイドバー経路を特定する**
   - `scripts/html/shimamura/main_menu_links.json` または `*_links.json` を参照
   - URL は `index.php?module=X&action=Y&...` 形式。`sideMenus.js` の先頭 `/` は有無どちらでもよい（`_navigateToModule` が `constants.js` の `BASE_URL`（末尾 `/` 付き）と結合する際に重複を除く）
   - サイドバー経路（`moduleUrl` + `shortcut`、折りたたみがあれば `collapseToggle`）も分かれば書く。分からなければ `directUrl` だけでよい

3. **既存の類似画面が無いか確認する**
   - `IchiranPage.js` を画面名で grep。同じ画面のブロックが既にあればメソッド追記だけで済む

---

### Step 2: `sideMenus.js` に定義を追加

`pages/shimamura/_common/sideMenus.js` の該当グループ（受講生系 / クラス・コース系 / 講師 / 経理系 …）に追記する。

```javascript
{camelCaseName}: {
  directUrl: '/index.php?module={Module}&action={Action}&{extra}',
  moduleUrl: '/index.php?module={Module}&action=index&top_menu=1',   // サイドバー経路が分かる場合
  shortcut:  '{サイドバーのリンク文言}',                                // 同上
  // collapseToggle: { icon_id: 'submenu__xxx_sub', menuname: '{グループ名}' },  // 折りたたみがある場合
},
```

既存の定義（`transactionList` / `contactList` 等）をコピーして値を差し替える。

---

### Step 3: `IchiranPage.js` にメソッドを追記

`pages/shimamura/screens/IchiranPage.js` の既存ブロック（例: 「入出金一覧 (transaction_list)」）をコピーして末尾に追記する。
1画面 = 5メソッド（`navigateTo` / `fill` / `click…SearchAndWait` / `verify…ResultsExist` / `verify…RecordInResults`）。

```javascript
// ----------------------------------------------------------------
//  {画面名} ({snake_name})
// ----------------------------------------------------------------

async navigateTo{ScreenName}Page() {
  I.say('【{画面名}】一覧画面へ遷移');
  await this._navigateViaMenu(menus.{camelCaseName});
  I.waitForElement('input[name="search"]', TIMEOUTS.ELEMENT);
  // 日付範囲フィールド（date_group1_rstart/rend）が既定で今日に絞られる画面は空検索が0件になるためクリアする
  // this._clearDateRangeFields();
},

fill{ScreenName}SearchConditions(data) {
  I.say('【{画面名}】検索条件を入力');
  fillTextFieldsByName(I, {
    {field1}: data.{field1},
    {field2}: data.{field2},
  });
  if (data.{selectField}) I.selectOption('select[name="{selectField}"]', data.{selectField});
},

click{ScreenName}SearchAndWait() {
  I.say('【{画面名}】検索実行');
  this._clickSearchAndWait();          // input[name="search"] → SELECTORS.RESULT_LINK を待つ
},

verify{ScreenName}ResultsExist() {
  I.say('【{画面名}】検索結果が表示されることを確認');
  this._verifyResultsExist();
},

verify{ScreenName}RecordInResults(expectedText) {
  I.say(`【{画面名}】"${expectedText}" が結果に表示されることを確認`);
  this._verifyRecordInResults(expectedText);
},
```

**共通ヘルパー**（ファイル先頭に定義済み。再実装しない）:

| ヘルパー | 役割 |
|---|---|
| `_navigateViaMenu(menuDef)` | `sideMenus.js` の定義に従って directUrl / サイドバー経路で遷移 |
| `_clearDateRangeFields()` | `date_group1_rstart` / `rend` を空にする（既定で今日に絞られる画面用） |
| `_clickSearchAndWait()` | `input[name="search"]` をクリックし `a.listViewTdLinkS1` を待つ |
| `_verifyResultsExist()` / `_verifyRecordInResults(text)` | 結果リンクの存在・文言確認 |

**結果セレクタや検索ボタンが標準と違う画面**（未収金一覧・受注売上・出席表など）は、
共通ヘルパーを使わず画面固有の `click…AndWait` / `verify…` を書く。雛形は `IchiranPage.js` の該当ブロック。

> テキスト入力は `fillTextFieldsByName`（`FORM_FILL_FAST` で高速/安全を自動切替）。`executeScript` を Page Object に直書きしない。
> `selectOption` は change イベントが必要なため個別に呼ぶ。

---

### Step 4: CSV の作成

`data/shimamura/{prefix}_ichiran_search_data.csv` を作成する。

```
scenario,{検索フィールド名},expectedName
空条件検索,,
{フィールド名}で検索,{テスト環境に存在する値},{期待値}
```

**ルール：**
- `scenario` 列は必須（シナリオラベルになる）
- 最低2行：空条件検索 + 条件付き検索
- `expectedName` が空の場合は「結果が1件以上あること」のみ確認する
- `expectedName` に使う値は**テスト環境に実際に存在するデータ**を使う
- フィールド名は `name=` 属性の値をそのまま列名に使う（例: `last_name`、`area_id`）

---

### Step 5: テストファイルの作成

`tests/shimamura/page/{prefix}_ichiran_test.js` を作成する。
**`tests/shimamura/page/transaction_ichiran_test.js` をコピーして改変する。**

```javascript
/**
 * @fileoverview shimamura {画面名} E2E テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果に1件以上表示される
 * - {検索条件}で絞り込み → 結果に1件以上表示される
 *
 * **データソース**
 * - `data/shimamura/{prefix}_ichiran_search_data.csv`
 */
const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('{prefix}_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('{画面名}検索');

Before(beforeShimamura);

Data(csvData).Scenario('{画面名}で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateTo{ScreenName}Page();

  const hasCondition = current.{field1} || current.{field2};
  if (hasCondition) ichiranPageShimamura.fill{ScreenName}SearchConditions(current);

  ichiranPageShimamura.click{ScreenName}SearchAndWait();
  I.saveScreenshotWithTimestamp('{prefix}_ichiran', true);

  if (current.expectedName) {
    ichiranPageShimamura.verify{ScreenName}RecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verify{ScreenName}ResultsExist();
  }
});
```

`ichiranPageShimamura` は `codecept.conf.js` の `include` で登録済み（新規登録不要）。

---

### Step 6: テスト実行と確認

```bash
npx codeceptjs run ./tests/shimamura/page/{prefix}_ichiran_test.js --profile shimamura.testgcp
```

**最低1件（空検索）は実際に結果が返ることを確認すること。**

---

### Step 7: ドキュメント連動（/doc-sync）

- `run/test_descriptions.json` の `"shimamura"` に説明を追加（カテゴリ E）
- `docs/shimamura/screen_navigation_diagram.md` の画面一覧に追記（画面遷移図を持つ画面の場合）
- `IchiranPage.js` の共通ヘルパーや `sideMenus.js` の構造を変えた場合はこのスキルも更新する（カテゴリ F）

---

## トラブルシューティング

| エラー | 原因 | 対処 |
|---|---|---|
| `input[name="search"]` が見つからない | URL が違う / 画面の検索ボタンが別 name | `*_links.json` で module/action を確認。ボタンが `input[name="button"][value="表示"]` 等なら画面固有メソッドを書く（受注売上ブロック参照） |
| `a.listViewTdLinkS1` が見つからない | 検索結果が0件 / 結果テーブルの形式が違う | テスト環境にデータがあるか確認。`.listViewPaginationTdS1` 形式なら未収金ブロックを参照 |
| 空検索で結果ゼロ | 日付範囲フィールドが既定で今日に絞られている | `navigateTo…` 内で `this._clearDateRangeFields()` を呼ぶ |
| 条件検索でヒットしない | `expectedName` がテスト環境データと不一致 | CSV の値をテスト環境の実データに合わせる |
| `SHIMAMURA_TANTOUSYA` エラー | 環境変数が未設定 | `env/.env.{profile}` に `SHIMAMURA_TANTOUSYA=番号` を追加 |
| 遷移後に URL が `testgcpindex.php?...` になる | `process.env.BASE_URL`（末尾 `/` なし）を直接連結している | `constants.js` の `BASE_URL`（末尾 `/` 付き）を使う。`IchiranPage._navigateToModule` 経由なら起きない |
| サイドバー経路（`SHIMAMURA_NAV=sidebar`）で検索状態が残る | サイドバーリンクに `top_menu=1` がない画面 | `courseIchiran` と同様に `directUrl` のみ定義する |
| 検索ボタンが AJAX のため結果が出ない | ボタンの onclick が `ajax_AN()` 呼び出し | `_clickSearchAndWait` の `waitForElement` で十分。出ない場合は日付フィルタを疑う |
