---
name: tframe-registration-dev
description: |
  tframe の登録・編集画面に対する E2E テストを新規作成・修正するスキル。
  以下のような依頼があったら使用すること：
  - tframe の特定画面（登録・編集）のテストを新規作成したい
  - 既存の登録・編集系の Page Object / CSV / テストファイルを修正・追加したい
  - input.html に HTML が貼り付けてあるのでテストを作ってほしい
  - 「自分でログインしてフィールドを取得して」という依頼

  ワークフロー: HTML取得 → フィールド解析 → Page Object → CSV → テストファイル → 実行確認

  ※ 一覧検索テスト（「〇〇一覧のテストを作って」等）は /tframe-ichiran-dev スキルを使うこと
---

# tframe 登録系テスト開発スキル

tframe の画面に対する E2E テスト（Page Object / CSV / テストファイル）を新規作成・修正する際の標準手順。

---

## 前提知識：読むべきファイル

コールドスタート時は必ず以下を読んで構造を把握すること。知識をスキルに書かず、コードを正解とする。

| 目的 | 参照先 |
|---|---|
| Page Object の実装パターン | `pages/tframe/screens/KoshiPage.js`（最も完成度が高い） |
| シンプルな Page Object（MenuNav なし） | `pages/tframe/screens/AccountPage.js` または `StaffPage.js` |
| ポップアップピッカーの実装例 | `pages/tframe/screens/ChosekinPage.js`（personId popup 対応済み） |
| 共通ユーティリティの API | `support/utils.js` の exports |
| テストファイルの書き方 | `tests/tframe/page/koshi_touroku_test.js` |
| CSV の形式 | `data/tframe/koshi_touroku_data.csv` |
| ENV 変数の一覧・意味 | `env/.env.tframe.template` |
| フォルダ配置ルール | `AGENTS.md` の「tframe テストのフォルダ分類」 |

---

## ワークフロー

### Step 1: HTML 取得

#### パターン A — ユーザーが HTML を貼り付ける場合

`scripts/html/input/input.html` に HTML が貼り付けてある。次の Step 1b へ進む。

#### パターン B — 「自分でログインして取得して」と依頼された場合（推奨）

`scripts/html/fetch_tframe_forms.js` を使って自動取得する。

```bash
# TARGETS 配列に対象画面を追加してから実行
node scripts/html/fetch_tframe_forms.js tframe.culture_beta
# → scripts/html/input/{name}.html に保存される
```

スクリプトの TARGETS 配列に取得したい画面を追加する：
```javascript
const TARGETS = [
  { name: '{name}_touroku', hint: '{画面名}' },  // 追加
];
```

#### フィールド抽出

```bash
node scripts/html/tframe_extract_form_fields.js scripts/html/input/{name}_touroku.html
```

抽出すべき情報：
- `input` / `select` / `textarea` の `id` 属性
- `select` 要素 → `I.selectOption` が必要（`value` 属性の値を CSV に入れる、表示テキストではない）
- popup picker 要素（`class="popup-picker-button"` を持つ button）
- AJAX連動フィールド（`bankCode`, `bankBranchCode`, 郵便番号ボタン `zipCodeBtn`, エリア→校舎 など）

---

### Step 2: URL パターンの特定

```
index.php?r={module}%2Few%2F_default  → 登録画面（ew = EditView）
index.php?r={module}%2Fsw%2F_default  → 一覧画面（sw = SearchView）
```

`data-actionid` 属性や URL の `r=` パラメータから module 名を取得する。

---

### Step 3: Page Object の作成/更新

**必ず `pages/tframe/screens/AccountPage.js` か `StaffPage.js` を雛形にコピーして改変すること。**（ゼロから書かない）

#### 標準構成

```javascript
const { I } = inject();
const { fillTextFields, submitTframeFormAndVerify, isEnglish } = require('../../support/utils');
const { selectAreaThenBranch } = require('../../../support/tframe/utils');

module.exports = {
  navigateToRegisterPage() { /* USE_MENU_NAV 対応 */ },
  fillRegistrationForm(data) { /* セクション呼び出し */ },
  fill○○Info(data) { /* fillTextFields + selectOption + popup */ },
  async submitAndVerifyRegistration(expectedText) { /* submitTframeFormAndVerify 委譲 */ },
};
```

#### パターン集

```javascript
// ── テキストフィールド一括入力（FORM_FILL_FAST 自動対応）
fillTextFields(I, { fieldId: data.fieldId, ... });

// ── ドロップダウン（value 属性の値を使う。表示テキストではない）
if (data.someSelect) I.selectOption('#someSelect', data.someSelect);

// ── AJAX連動ドロップダウン（エリア→校舎）: support/tframe/utils.js の selectAreaThenBranch を使う
// ID体系は #school_area_id/#school_branch_id（デフォルト）と #branchId_area_id/#branchId_branch_id の2種
selectAreaThenBranch(I, { area: data.school_area_id, branch: data.school_branch_id });
// branchId_ 系の場合は areaSelector/branchSelector を明示指定
selectAreaThenBranch(I, {
  areaSelector: '#branchId_area_id',
  branchSelector: '#branchId_branch_id',
  area: data.branchId_area_id,
  branch: data.branchId_branch_id,
});

// ── 郵便番号ボタン（都道府県・市区町村を自動入力）
if (data.primaryAddressPostalcode) {
  I.fillField('#primaryAddressPostalcode', data.primaryAddressPostalcode);
  I.click('#zipCodeBtn');
  I.wait(1);
}
// 番地・住所カナは自動入力されないため手動
fillTextFields(I, { primaryAddressStreet: data.primaryAddressStreet, primaryAddressKana: data.primaryAddressKana });

// ── 銀行コード（AJAX補完）
if (data.bankCode) { I.fillField('#bankCode', data.bankCode); I.wait(1); }
if (data.bankBranchCode) { I.fillField('#bankBranchCode', data.bankBranchCode); I.wait(1); }
// bankName / bankBranchName は自動補完されるため CSV に不要

// ── ポップアップピッカー（#xxx_start ボタン → モーダルリスト → 選択）
// ※ tframe のカスタム radio は CSS で非表示。span.tf-radio をクリックする
if (data.personId) {
  // personId が CSV に指定されていれば JS で直接設定
  I.executeScript((id) => { document.getElementById('personId').value = id; }, data.personId);
} else {
  // なければポップアップを開いて先頭の講師を選択
  I.click('#personId_start');
  I.waitForVisible('.tf-radio.tf-radio-primary', 10);
  I.click(locate('.tf-radio.tf-radio-primary').first());
  I.waitForInvisible('.tf-radio.tf-radio-primary', 10);
  I.wait(0.5);
}
// 他の popup picker も同パターン（ボタンID・クラスが異なる場合は HTML で確認）

// ── メニュー経由遷移（USE_MENU_NAV 対応）
if (process.env.USE_MENU_NAV === 'true') {
  I.click(`a:has-text("${isEnglish() ? 'Accounting' : '経理'}")`);
  I.waitForElement('a[href*="{module}%2Few"]', 10);
  I.click('a[href*="{module}%2Few"]');
} else {
  I.amOnPage(process.env.BASE_URL + 'index.php?r={module}%2Few%2F_default');
}
```

---

### Step 4: codecept.conf.js への登録

```javascript
{moduleName}Page: './pages/tframe/screens/{PageName}.js',
```

---

### Step 5: CSV の作成/更新

`data/tframe/{module}_touroku_data.csv` を作成する。

**重要: `loadCsvWithProfile` はヘッダ列数とデータ列数が一致しない行を無音でスキップする。**
列数が合わないと「0 passed」になる。ヘッダの列数とデータ行の列数を必ず一致させること。

```
name,field1,field2,...   ← N 列
値A,値1,値2,...          ← 必ず N 列（空でも , で埋める）
値B,値3,値4,...          ← 必ず N 列
```

ルール：
- 1行目: ヘッダ（Page Object で使う field 名）
- 2行目以降: 最低2行
- `primaryAddressState` / `primaryAddressCity` は不要（zipCodeBtn で自動入力）
- `bankName` / `bankBranchName` は不要（AJAX補完で自動入力）
- `select` の値は **表示テキストではなく `value` 属性**（HTML で `<option value="001">謝礼</option>` なら `001`）
- ID 列（idnumber など）は繰り返し実行しても重複しない値にする
- popup picker（personId など）は空欄でも OK（先頭レコードを自動選択する）

---

### Step 6: テストファイルの作成/更新

**`tests/tframe/page/koshi_touroku_test.js` を雛形にすること。**

```javascript
const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('{module}_touroku_data', 'tframe'),
  (row) => `${row.{labelField}}`   // シナリオ名のラベル
);

Feature('{画面名}登録');

Data(csvData).Scenario('管理者ログイン後に{画面名}を新規登録できる @admin', async ({ I, {moduleName}Page, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  {moduleName}Page.navigateToRegisterPage();
  {moduleName}Page.fillRegistrationForm(current);
  I.saveScreenshotWithTimestamp('{module}_touroku_input', true);

  await {moduleName}Page.submitAndVerifyRegistration('{検証テキスト}');
  I.saveScreenshotWithTimestamp('{module}_touroku_saved', true);
});
```

---

### Step 7: テスト実行と確認

```bash
npx codeceptjs run ./tests/tframe/page/{module}_touroku_test.js --profile tframe.culture_beta
```

**最低1件は実際に保存まで通ることを確認すること。**

### Step 8: GUI 用の日本語説明を登録する（必須）

`run/test_descriptions.json` の `"tframe"` セクションに追記する。
**これを忘れると GUI の TestFile 欄にテストを選んでも日本語説明が表示されない。**

```json
"page/{module}_touroku_test.js": "{画面名}の新規登録フォームへの入力・保存を確認",
```

例：
```json
"page/kyoshitsu_touroku_test.js": "教室の新規登録フォームへの入力・保存を確認",
```

一覧検索テスト（`_ichiran_test.js`）を追加した場合も同様に追記する：
```json
"page/{module}_ichiran_test.js": "{画面名}一覧の空検索と条件絞り込み検索を確認",
```

#### 保存後の検証テキスト（`submitAndVerifyRegistration` の引数）の決め方

保存後のページに実際に表示されるテキストを使う。以下のルールで決定する：

| ケース | 使うテキスト | 注意 |
|---|---|---|
| 詳細ページへ遷移する場合 | ページタイトル（例: `"調整金詳細"`, `"商品詳細"`） | 最も安定 |
| 一覧ページへ遷移する場合 | 登録した名前（例: `current.name`） | 名前が一覧に表示される場合のみ |
| 金額・数値 | **NG**: `"1000"` → 実際は `"1,000"` と表示される | 使わない |
| 日付 | **NG**: `"2026/04/01"` → 実際は `"2026-04-01"` と表示される | 使わない |

確認が難しい場合はテスト失敗時のスクリーンショット（`output/` フォルダ）を見て実際の表示を確認する。

#### 失敗した場合の主な原因と対処

| エラー | 原因 | 対処 |
|---|---|---|
| `0 passed`（エラーなし） | CSV の列数がヘッダと不一致 | ヘッダ列数とデータ行列数を揃える |
| `Field not found` | `id` が HTML と一致しない | input.html / 取得した HTML を再確認 |
| `バリデーションエラー` | `#tf-message-summary` にエラー | テストデータを修正（必須項目・select value を確認） |
| `Text "xxx" not found` | 検証テキストが実際の表示と異なる | スクリーンショットで実際の表示を確認し検証テキストを修正 |
| `element is not visible` | popup picker の radio input を直接クリックしている | `span.tf-radio.tf-radio-primary` をクリックする |
| `ID重複` | 同じ ID で登録済み | CSV の idnumber を変更 |
| `AJAX タイムアウト` | AJAX 待ちが足りない | `I.wait(1)` → `I.wait(2)` に増やす |

---

## スキル呼び出し時の受け取り方

ユーザーが「{画面名}のテストを作りたい」と言ったとき：

1. `scripts/html/input/input.html` に HTML が貼り付けてあるか確認する
2. なければ「自動取得しますか？ `fetch_tframe_forms.js` で culture_beta からログインして取得できます」と提案する
3. 自動取得を承認されたら `fetch_tframe_forms.js` の TARGETS を更新してスクリプトを実行する
4. 取得した HTML の `data-actionid` から module 名と URL パターンを特定する
5. `tframe_extract_form_fields.js` でフィールド一覧を抽出する
6. popup picker の有無を確認する（`class="popup-picker-button"` を含む button 要素）
