---
name: shimamura-ichiran-dev
description: |
  shimamura の一覧検索画面に対する E2E テストを新規作成・修正するスキル。
  以下のような依頼があったら使用すること：
  - shimamura の特定画面（一覧・検索）のテストを新規作成したい
  - 「〇〇一覧のテストを作って」という依頼
  - 既存の一覧検索 Page Object メソッド / CSV / テストファイルを修正・追加したい

  ワークフロー: フォーム確認（/shimamura-html-fetch） → Page Object にメソッド追記 → CSV → テストファイル → 実行確認

  ※ 登録・編集テストは /shimamura-registration-dev スキルを使うこと（Phase 4 で作成予定）
---

# shimamura 一覧検索テスト開発スキル

shimamura の一覧（ListView）画面に対する E2E テスト（Page Object メソッド / CSV / テストファイル）を
新規作成・修正する際の標準手順。

---

## tframe との主な差分（必ず把握すること）

| 項目 | tframe | shimamura |
|---|---|---|
| 検索ボタン | `#swSearchButton` | `input[type="button"][value="検索"]`（または `'検索'`） |
| 検索結果 | `.tf-group-body-search-result tr` | `a.listViewTdLinkS1` |
| URL | `index.php?r=X%2Fsw%2F_default` | `index.php?module=X&action=Y&...` |
| Page Object 置き場 | `pages/tframe/screens/` | `pages/shimamura/screens/` |
| 認証 | `loginKannrisyaPage.login()` | `validateShimamuraEnv()` + `login('user')` + `enterTantousyaNumberAndProceed()` |
| CSV dataDir | `'tframe'` を明示 | `'shimamura'` を明示（デフォルト値なし） |
| エラー表示 | `#tf-message-summary` | `#top_err_info_msg_div` |

---

## 前提知識：参照すべきファイル

| 目的 | 参照先 |
|---|---|
| ナビゲーションメソッドのパターン | `pages/shimamura/_common/ClassMemberPage.js` |
| ログイン処理のパターン | `tests/shimamura/check/shimamura_class_existence_check_test.js` |
| テストファイルの雛形 | `tests/shimamura/check/shimamura_class_existence_check_test.js` |
| CSV の形式 | `data/shimamura/syokai_touroku_data.csv` |
| 画面 URL 一覧 | `scripts/html/shimamura/main_menu_links.json` / `*_links.json` |
| フォルダ配置ルール | `AGENTS.md` |

---

## ワークフロー

### Step 1: 対象画面の確認

以下を確認する：

1. **検索フォームの HTML を確認する**
   - `scripts/html/shimamura/{name}.html` が既にあれば流用する
   - なければ `/shimamura-html-fetch` スキルで取得する

2. **URL（module / action）を特定する**
   - `scripts/html/shimamura/main_menu_links.json` または `*_links.json` を参照
   - Phase 0/1 で確認済みのパターン: `index.php?module=X&action=Y&extra_params`

3. **Page Object の追記先を決める**
   - `pages/shimamura/_common/ClassMemberPage.js` が既に存在する
   - 検索メソッドが 4 つ程度なら `ClassMemberPage.js` に追記してよい
   - 画面固有のメソッドが多い場合は `pages/shimamura/{ScreenName}Page.js` を新規作成する

---

### Step 2: Page Object にメソッドを追記

`pages/shimamura/_common/ClassMemberPage.js`（または新規ファイル）の末尾に追記する。

```javascript
// ----------------------------------------------------------------
//  {画面名}一覧（ListView）
// ----------------------------------------------------------------

/**
 * {画面名}一覧画面へ遷移する（URL 直遷移）
 */
navigateTo{ScreenName}ListPage() {
  I.say('【{画面名}一覧】一覧画面へ遷移');
  // BASE_URL は末尾スラッシュなし（例: https://example.com/testgcp）なので '/' を明示
  I.amOnPage(process.env.BASE_URL + '/index.php?module={Module}&action={Action}&{extra_params}');
  I.waitForElement('input[name="search"]', 10);
},

/**
 * 検索条件を入力する（空フィールドはスキップ）
 * @param {object} data - {prefix}_ichiran_search_data.csv の1行分
 */
fill{ScreenName}SearchConditions(data) {
  I.say('【{画面名}一覧】検索条件を入力');
  // テキスト入力: executeScript で一括セット（fillField の個別呼び出しより高速）
  const textFields = [
    ['{field1}', data.{field1}],
    ['{field2}', data.{field2}],
  ].filter(([, v]) => v);
  if (textFields.length > 0) {
    I.executeScript((fields) => {
      fields.forEach(([name, value]) => {
        const el = document.querySelector(`[name="${name}"]`);
        if (el) el.value = value;
      });
    }, textFields);
  }
  // selectOption は change イベントが必要なため個別に
  if (data.{selectField}) I.selectOption('select[name="{selectField}"]', data.{selectField});
},

/**
 * 検索ボタンをクリックし、結果が表示されるまで待つ
 */
click{ScreenName}SearchAndWait() {
  I.say('【{画面名}一覧】検索実行');
  I.click('input[type="button"][value="検索"]');
  I.waitForElement('a.listViewTdLinkS1', 15);
},

/**
 * 検索結果に1件以上のリンクがあることを確認する
 */
verify{ScreenName}ResultsExist() {
  I.say('【{画面名}一覧】検索結果が表示されることを確認');
  I.seeElement('a.listViewTdLinkS1');
},

/**
 * 検索結果に指定テキストが表示されることを確認する
 * @param {string} expectedText - 結果一覧に表示されるべき文字列
 */
verify{ScreenName}RecordInResults(expectedText) {
  I.say(`【{画面名}一覧】"${expectedText}" が結果に表示されることを確認`);
  I.see(expectedText, 'a.listViewTdLinkS1');
},
```

#### shimamura 共通セレクタ（変更不要）

| 要素 | セレクタ |
|---|---|
| 検索ボタン | `input[type="button"][value="検索"]` |
| 検索結果リンク | `a.listViewTdLinkS1` |
| エラー表示 | `#top_err_info_msg_div` |

#### shimamura のフィールド指定（テキスト入力は executeScript 一括化）

shimamura では `name=` 属性でフィールドを指定する。テキスト入力は **executeScript で一括セット**すること。

```javascript
// ✅ 推奨: テキスト入力は executeScript 一括（複数フィールドをまとめてセット）
const textFields = [
  ['last_name',  data.last_name],
  ['course_name', data.course_name],
].filter(([, v]) => v);
if (textFields.length > 0) {
  I.executeScript((fields) => {
    fields.forEach(([name, value]) => {
      const el = document.querySelector(`[name="${name}"]`);
      if (el) el.value = value;
    });
  }, textFields);
}

// ✅ selectOption は change イベントが必要なため個別に（変更不可）
I.selectOption('select[name="area_id"]', data.area_id);

// ❌ 非推奨: fillField を個別に繰り返す（遅い）
// I.fillField('input[name="last_name"]', data.last_name);
// I.fillField('input[name="course_name"]', data.course_name);
```

> **例外 — 以下は fillField のまま維持**
> - 郵便番号・銀行コードなど **AJAX 連動フィールド**: `I.fillField()` + `I.wait()` で補完を待つ必要がある
> - `readonly` 属性の textarea: executeScript 内で `el.removeAttribute('readonly')` してからセット

---

### Step 3: CSV の作成

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

例（クラス検索の場合）:
```
scenario,course_name,expectedName
空条件検索,,
クラス名で検索,ピアノ,ピアノ水曜日
```

---

### Step 4: テストファイルの作成

`tests/shimamura/page/{prefix}_ichiran_test.js` を作成する。
**`tests/shimamura/check/shimamura_class_existence_check_test.js` を雛形にコピーして改変する。**

```javascript
/**
 * @fileoverview shimamura {画面名}一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 空条件で検索 → 結果エリアに1件以上表示される
 * - C パターン: {検索条件}で絞り込み → 特定レコードが結果に表示される
 *
 * **データソース**
 * - `data/shimamura/{prefix}_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - {field}: 検索条件（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { validateShimamuraEnv } = require('../../../support/shimamura/utils');
const { TIMEOUTS } = require('../../../support/shimamura/constants');

const csvData = withScenarioLabel(
  loadCsvWithProfile('{prefix}_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('{画面名}一覧検索');

Before(async ({ login, loginPageShimamura }) => {
  const tantousyaNumber = validateShimamuraEnv();
  await login('user');
  await loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);
});

Data(csvData).Scenario('{画面名}一覧で検索できる @dev', async ({ I, classMemberPageShimamura, current }) => {
  classMemberPageShimamura.navigateTo{ScreenName}ListPage();

  const hasCondition = current.{代表フィールド名};
  if (hasCondition) classMemberPageShimamura.fill{ScreenName}SearchConditions(current);

  classMemberPageShimamura.click{ScreenName}SearchAndWait();
  I.saveScreenshotWithTimestamp('{prefix}_ichiran_search', true);

  if (current.expectedName) {
    classMemberPageShimamura.verify{ScreenName}RecordInResults(current.expectedName);
  } else {
    classMemberPageShimamura.verify{ScreenName}ResultsExist();
  }
});
```

#### `hasCondition` の決め方

```javascript
// 単一フィールドで判定
const hasCondition = current.course_name;

// 複数フィールドのいずれかに値があれば検索条件ありとみなす場合
const hasCondition = current.last_name || current.area_id || current.contact_status;
```

---

### Step 5: テスト実行と確認

```bash
npx codeceptjs run ./tests/shimamura/page/{prefix}_ichiran_test.js --profile shimamura.testgcp
```

**最低1件（空検索）は実際に結果が返ることを確認すること。**

---

## トラブルシューティング

| エラー | 原因 | 対処 |
|---|---|---|
| `input[type="button"][value="検索"]` が見つからない | URL が違う / 画面に検索ボタンがない | URL を確認。`*_links.json` で正しい module/action を調べる |
| `a.listViewTdLinkS1` が見つからない | 検索結果が0件 / ローディング中 | テスト環境にデータがあるか確認。タイムアウトを 20 秒に増やす |
| 空検索で結果ゼロ | テスト環境にデータがない / 日付フィルタが今日のみ | テスト環境にデータを登録、または `navigateTo*` 内で日付フィールドをクリアする |
| 条件検索でヒットしない | `expectedName` がテスト環境データと不一致 | CSV の値をテスト環境の実データに合わせる |
| `SHIMAMURA_TANTOUSYA` エラー | 環境変数が未設定 | `env/.env.{profile}` に `SHIMAMURA_TANTOUSYA=番号` を追加 |
| 担当者番号入力でタイムアウト | `idnumber` フィールドが出ない | `enterTantousyaNumberAndProceed` は自動スキップするため通常問題なし |
| 遷移後に URL が `testgcpindex.php?...` になる | `BASE_URL` の末尾スラッシュなし | `I.amOnPage(process.env.BASE_URL + '/index.php?...')` と `/` を明示する |
| 検索ボタンが AJAX のため結果が出ない | ボタンの onclick が `ajax_AN()` 呼び出し | `I.waitForElement('a.listViewTdLinkS1', 15)` で十分（AJAX 完了を待つ）。それでも出ない場合は日付フィルタを疑う |
