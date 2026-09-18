---
name: tframe-ichiran-dev
description: |
  tframe の一覧検索画面に対する E2E テストを新規作成・修正するスキル。
  以下のような依頼があったら使用すること：
  - tframe の特定画面（一覧・検索）のテストを新規作成したい
  - 既存の一覧検索 Page Object メソッド / CSV / テストファイルを修正・追加したい
    （対象: tests/tframe/ 配下の *_ichiran_test.js、data/tframe/ の *_ichiran_search_data.csv。
     koshi_ / jukusei_ / course_ 等のプレフィックスは tframe の画面）
  - 「〇〇一覧のテストを作って」という依頼
  - 一覧（一覧画面・詳細画面のタブ内一覧）の列ヘッダソート検証を追加したい（末尾「ソート検証の追加」）

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
| ソート検証の雛形（一覧画面） | `pages/tframe/screens/StaffPage.js` の `listSortTable` + `tests/tframe/page/staff_ichiran_sort_test.js` |
| ソート検証の雛形（タブ内一覧） | `pages/tframe/screens/CoursePage.js` の `studentSubpanelSortTable` + `tests/tframe/page/course_detail_student_sort_test.js` |

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

#### 経理系・Eメール系などクセのある一覧（`IchiranSearchMixin` を使う）

`smsFee` / `smsContract` / `smsPayment` / `smsTransaction` / `email` / `announcement` / `poll` などは
次の2つのクセがあり、素直に空検索しても結果が0件・不安定になる。既存 `KeiriIchiranPage.js` /
`EmailIchiranPage.js` を雛形にすること。

1. **日付レンジの既定値が「当月」** → 検索前に広げる。CSV に `dateFrom` / `dateTo` 列を持たせ、
   `setDateField('rangeFromDate', data.dateFrom)` 等で直接セット（画面により `rangeFromField` / `rangeToField`）。
2. **エリア / 対象区分 / ステイタス等の絞り込みがサーバー側にセッション記憶される**
   → 検索前に `resetSelects([...])` で主要セレクトを空値（「すべて」）へ戻す。

```javascript
const { setDateField, resetSelects, verifyResultRowsExist } = require('../_common/IchiranSearchMixin');

fillXxxSearchConditions(data) {
  resetSelects(['branchId_area_id', 'branchId_branch_id', 'personStatus', /* 画面のセレクトid */]);
  setDateField('rangeFromDate', data.dateFrom);
  setDateField('rangeToDate', data.dateTo);
  fillTextFields(I, { lastName: data.lastName });
},

// テスト側: verifyResultsExist は thead 行にもマッチして空振り判定できないため、
// 「実際に結果が返ったこと」を担保したいときは verifyResultRowsExist を使う
async verifyResultRowsExist() { await verifyResultRowsExist('画面名'); },
```

> どのセレクトがセッション記憶されるかは実機で確認する（フレッシュな画面表示で
> 既に値が入っているセレクト＝記憶対象）。日付欄の既定値も同様に実機で確認。

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

---

## ソート検証の追加（#223 / #225）

一覧の列ヘッダ（上下矢印）ソートを「第1キー＝クリックした列 → 第2キー＝画面ごとの裏設定」の順で検証する。
一覧画面・詳細画面のタブ内一覧（サブパネル）どちらも同じ部品で扱える。**画面ごとに書くのは次の3つだけ。**

| 用意するもの | 置き場 | 中身 |
|---|---|---|
| ソート定義 | Page Object に `xxxSortTable: createSortableTable({...})` | 表の枠・ソート可能列の型・第2キー |
| 一覧を開く手順 | テストの `openCase` | 一覧画面は `openListCase(po)` で済む（遷移 → `resetSearchForm()` → 絞り込み → 検索）。1つの PO に一覧が複数あるときは `openListCase(po, { navigate: 'navigateToXxxListPage', fill: 'fillXxxSearchConditions' })`（例: `proByCourse_ichiran_sort_test.js`）。タブ内一覧・日付必須画面は個別に書く |
| ケース | `data/tframe/{prefix}_sort_data.csv` | `scenario,sortKey,sortDir` ＋ 画面固有の絞り込み列 |

共通部品（あるものを使う・再実装しない）:

| 部品 | 置き場 | 役割 |
|---|---|---|
| `createSortableTable` / `LIST_CONTAINER` / `subpanelContainer(name)` / `openListCase(po)` | `pages/tframe/_common/SortableTable.js` | ソート操作・行抽出・ソート可能列取得（枠で絞り込む）、一覧画面の標準 openCase |
| `resetSearchForm()` | `pages/tframe/_common/IchiranSearchMixin.js` | 検索条件を全クリア（プルダウンは「すべて」、エリア→校舎の AJAX 連動込み） |
| `runSortCases(I, {table, cases, openCase})` | `support/tframe/sortTestRunner.js` | 1ログインで全ケースを回し違反を集約して報告 |
| `findSortViolations` | `support/tframe/sortVerify.js` | 並び判定（純粋関数） |

### 手順

1. **実機で列と並びを確認する**（推測で sortSpec を書かない）
   - まず調査ツールで案を出す（全列を昇降順に並べ替えて1ページ目を採取し、列の型と第2キー候補を推定）:
     `SORT_PROBE_ROUTE=staff/sw/_default npx codeceptjs run tests/tframe/util/sort_spec_probe.js --profile tframe.culture_beta`
     （タブ内一覧は `SORT_PROBE_RECORD` / `SORT_PROBE_TAB` / `SORT_PROBE_PANEL` を追加。採取行は `output/sort_probe/*.json`）
   - 推定は1ページ分の標本に基づく。英大文字を含まない標本では `stringCi` が `string` と出る等があるので、JSON の行を目視して確定する
   - ソート可能列: 見出し `th#swDataList[キー]` に `a[data-sort]` がある列
   - 枠: 一覧画面は `LIST_CONTAINER`。タブ内一覧は `div[id="<パネル名>[swDataList]"]` → `subpanelContainer('<パネル名>')`
   - 各列を昇順/降順にして1ページ目を眺め、列の型と第2キーを決める
2. **列の型を決める**

   | 型 | 使う列 | 実例 |
   |---|---|---|
   | `string` | 表示値の文字コード順で並ぶ | コース名、日付（`YYYY-MM-DD`） |
   | `stringCi` | 英字の大小を区別せず並ぶ | 講師ID（`cc` が `TA001` より前）、校舎名 |
   | `number` | 数値順 | 年度、定員 |
| `datetime` | 分単位表示の日時（実値は秒まで持つので、表示が同じでも第2キー判定に使わない） | 登録日時・更新日時 |
   | `grouped` | 表示値と別の裏の値で並ぶ（順序は判定不能・同値の連続性のみ） | 氏名（フリガナ順）、区分・ステイタス・エリア（内部コード順） |

3. **第2キーを決める**（第2キーの無い画面もある → `secondary: null`）
   - 同値が多い列（区分・カテゴリ等）でソートし、同値グループ内が何順かを見る
   - 実例: コース一覧＝`_recordId` 昇順（第1キーの方向によらず固定）、講師一覧＝`updated_at` 降順、校舎一覧・コース詳細受講生タブ＝なし
   - 第1キーを全行同値にする絞り込み（例: 年度で絞って年度ソート）を CSV に入れると、第2キーを15件すべてで検証できる
4. **テストを書く**（雛形 `staff_ichiran_sort_test.js` をコピーして PO 名・CSV 名を差し替える。本体は `runSortCases` 1行）
5. `run/test_descriptions.json` と `data/tframe/README.md` に追記し、実行して全ケース OK を確認

### 注意

- 検証は1ページ目（15件）のみ。表示が空の値は NULL / 空文字の区別が付かないため判定対象外
- 環境依存の値（タブ内一覧を開くコースのレコードID等）はプロファイル別 CSV（`{base}_tframe.culture_beta.csv`）に置き、既定 CSV はヘッダのみにする（ケース0件のプロファイルはスキップ）
- 一覧の初期値（エリア=関東/校舎=東京 等）に絞られないよう、`openCase` では必ず `resetSearchForm()` を呼ぶ
- `resetSearchForm()` は日付欄も空にする。日付が必須・既定値前提の画面（経理系の当月既定、連絡一覧の「どちらか一方は7日以内」等）では、`openCase` で呼んだ後に `setDateField` で日付を入れ直す
