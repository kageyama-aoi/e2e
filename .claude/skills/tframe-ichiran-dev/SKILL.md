---
name: tframe-ichiran-dev
description: |
  tframe の一覧検索画面に対する E2E テストを新規作成・修正するスキル。
  以下のような依頼があったら使用すること：
  - tframe の特定画面（一覧・検索）のテストを新規作成したい
  - 既存の一覧検索 Page Object メソッド / CSV / テストファイルを修正・追加したい
  - 「〇〇一覧のテストを作って」という依頼

  ワークフロー: 検索フィールド確認 → Page Object にメソッド追記 → CSV → テストファイル → 実行確認

  ※ 登録・編集テストは /tframe-registration-dev スキルを使うこと
---

# tframe 一覧検索テスト開発スキル

tframe の一覧（SearchView）画面に対する E2E テスト（Page Object メソッド / CSV / テストファイル）を
新規作成・修正する際の標準手順。

---

## 前提知識：参照すべきファイル

コールドスタート時は必ず以下を読んで構造を把握すること。

| 目的 | 参照先 |
|---|---|
| 一覧検索メソッドの実装パターン | `pages/tframe/screens/KoshiPage.js`（`navigateToListPage` 以降） |
| シンプルな Page Object（アイコンなし） | `pages/tframe/screens/StaffPage.js` |
| テストファイルの雛形 | `tests/tframe/page/koshi_ichiran_test.js` |
| CSV の形式 | `data/tframe/koshi_ichiran_search_data.csv` |
| ENV 変数一覧 | `env/.env.tframe.template` |
| フォルダ配置ルール | `AGENTS.md` の「tframe テストのフォルダ分類」 |
| GUI 用説明の登録先 | `run/test_descriptions.json` |

---

## ワークフロー

### Step 1: 対象画面の確認

まず以下を確認する：

1. **既存 Page Object があるか**  
   `pages/tframe/screens/` を確認し、対象の Page Object が存在するか確認する。
   - 存在する → そのファイルにメソッドを追記する
   - 存在しない → `/tframe-registration-dev` スキルでまず Page Object を作ること

2. **module 名（URL の `r=` パラメータ）を特定する**  
   一覧画面の URL パターン: `index.php?r={module}%2Fsw%2F_default`  
   既存 Page Object の `navigateToRegisterPage()` 内の URL から `ew` → `sw` に変換すれば確認できる。

3. **検索フォームのフィールド ID を確認する**  
   - `scripts/html/input/` に `{module}_list.html` があれば流用する
   - なければ以下で取得する:
     ```bash
     node scripts/html/fetch_tframe_forms.js tframe.culture_beta
     # TARGETS に一覧画面を追加してから実行
     ```
   - 一覧画面の検索フォームは `<form id="searchForm">` 内の `input` / `select` 要素を探す

---

### Step 2: Page Object に一覧検索メソッドを追記

既存 Page Object の末尾（`...createMenuNavigationMixin` の直前、またはファイル末尾）に追記する。

**`KoshiPage.js` の一覧検索セクションをそのままコピーして改変すること。**

```javascript
// ----------------------------------------------------------------
//  {画面名}一覧（SW）
// ----------------------------------------------------------------

/**
 * {画面名}一覧画面へ遷移する
 */
navigateToListPage() {
  I.say('【{画面名}一覧】一覧画面へ遷移');
  I.amOnPage(process.env.BASE_URL + 'index.php?r={module}%2Fsw%2F_default');
  I.waitForElement('#swSearchButton', 10);
},

/**
 * 検索条件を入力する（空フィールドはスキップ）
 * @param {object} data - {module}_ichiran_search_data.csv の1行分
 */
fillSearchConditions(data) {
  I.say('【{画面名}一覧】検索条件を入力');
  if (data.{field1}) I.fillField('#{field1}', data.{field1});
  if (data.{field2}) I.fillField('#{field2}', data.{field2});
  // ドロップダウンの場合
  if (data.{selectField}) I.selectOption('#{selectField}', data.{selectField});
  // AJAX連動ドロップダウンの場合
  if (data.{area_id}) {
    I.selectOption('#{area_id}', data.{area_id});
    I.wait(1);
  }
  if (data.{branch_id}) I.selectOption('#{branch_id}', data.{branch_id});
},

/**
 * 検索ボタンをクリックし、結果行が表示されるまで待つ
 */
clickSearchAndWait() {
  I.say('【{画面名}一覧】検索ボタンをクリック');
  I.click('#swSearchButton');
  I.waitForElement('.tf-group-body-search-result tr', 15);
},

/**
 * 検索結果エリアに1件以上の行があることを確認する
 */
verifyResultsExist() {
  I.say('【{画面名}一覧】検索結果が表示されることを確認');
  I.seeElement('.tf-group-body-search-result tr');
},

/**
 * 検索結果エリアに指定テキストが表示されることを確認する
 * @param {string} expectedName - 結果一覧に表示されるべき文字列
 */
verifyRecordInResults(expectedName) {
  I.say(`【{画面名}一覧】"${expectedName}" が結果に表示されることを確認`);
  I.see(expectedName, '.tf-group-body-search-result');
},
```

#### tframe 共通のセレクタ（変更不要）

| 要素 | セレクタ |
|---|---|
| 検索ボタン | `#swSearchButton` |
| 検索結果エリア | `.tf-group-body-search-result tr` |
| 検索結果確認 | `.tf-group-body-search-result` |

---

### Step 3: CSV の作成

`data/tframe/{module}_ichiran_search_data.csv` を作成する。

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
- ドロップダウンの値は `value` 属性を使う（表示テキストではない）

例（講師の場合）:
```
scenario,lastName,expectedName
空条件検索,,
姓で検索,テスト,テスト
```

---

### Step 4: テストファイルの作成

`tests/tframe/page/{module}_ichiran_test.js` を作成する。  
**`tests/tframe/page/koshi_ichiran_test.js` を雛形にコピーして改変すること。**

```javascript
/**
 * @fileoverview {画面名}一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 空条件で検索 → 結果エリアに1件以上表示される
 * - C パターン: {検索条件}で絞り込み → 特定レコードが結果に表示される
 *
 * **データソース**
 * - `data/tframe/{module}_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - {field}: 検索条件（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('{module}_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('{画面名}一覧検索');

Data(csvData).Scenario('{画面名}一覧で検索できる @admin', async ({ I, {moduleName}Page, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  {moduleName}Page.navigateToListPage();

  const hasCondition = current.{検索条件フィールド};
  if (hasCondition) {moduleName}Page.fillSearchConditions(current);

  {moduleName}Page.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('{module}_ichiran_search', true);

  if (current.expectedName) {
    {moduleName}Page.verifyRecordInResults(current.expectedName);
  } else {
    {moduleName}Page.verifyResultsExist();
  }
});
```

#### `hasCondition` の決め方

複数の検索フィールドがある場合は、代表的な1フィールドで判定すればよい：

```javascript
// 単一フィールドで判定
const hasCondition = current.lastName;

// 複数フィールドのいずれかに値があれば検索条件ありとみなす場合
const hasCondition = current.name || current.idnumber || current.personStatus;
```

---

### Step 5: test_descriptions.json に追記（必須）

`run/test_descriptions.json` の `"tframe"` セクションに追記する。  
**これを忘れると GUI の TestFile 欄で日本語説明が表示されない。**

```json
"page/{module}_ichiran_test.js": "{画面名}一覧の空検索と条件絞り込み検索を確認",
```

---

### Step 6: テスト実行と確認

```bash
npx codeceptjs run ./tests/tframe/page/{module}_ichiran_test.js --profile tframe.culture_beta
```

**最低1件（空検索）は実際に結果が返ることを確認すること。**

---

## トラブルシューティング

| エラー | 原因 | 対処 |
|---|---|---|
| `#swSearchButton` が見つからない | 一覧画面の URL が違う | `navigateToListPage()` の URL を確認。`?topMenu=1` 等の追加パラメータが必要な場合がある |
| `0 passed`（エラーなし） | CSV の列数がヘッダと不一致 | ヘッダ列数とデータ行列数を揃える |
| 空検索で結果ゼロ | テスト環境にデータがない | テスト環境にデータを登録してから再実行 |
| 条件検索でヒットしない | `expectedName` がテスト環境のデータと一致しない | テスト環境の実データに合わせて CSV を修正 |
| `.tf-group-body-search-result tr` が見つからない | 検索後にローディングが遅い | `waitForElement` のタイムアウトを 15 → 20 に増やす |
| AJAX連動ドロップダウンが動かない | `I.wait(1)` が足りない | `I.wait(2)` に増やす |

---

## 登録テストとの違い

| 項目 | 一覧検索（このスキル） | 登録テスト（`/tframe-registration-dev`） |
|---|---|---|
| URL パターン | `sw%2F_default`（SearchView） | `ew%2F_default`（EditView） |
| Page Object | 既存ファイルにメソッド追記 | 必要に応じて新規作成 |
| CSV の役割 | 検索条件 + 期待値 | 登録フォームの入力データ |
| テストの確認内容 | 結果エリアに表示されること | 保存後の画面に登録データが表示されること |
| HTML 解析の対象 | `<form id="searchForm">` | `<form id="editForm">` 等の入力フォーム |
