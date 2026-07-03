---
name: shimamura-registration-dev
description: |
  shimamura の登録・処理フローに対する E2E テストを新規作成・修正するスキル。
  以下のような依頼があったら使用すること：
  - shimamura の登録フロー・処理フローのテストを新規作成したい
  - 「〇〇登録テストを作って」「〇〇処理のテストを作って」という依頼
  - 既存のフロー Page Object / CSV / テストファイルを修正・追加したい

  ワークフロー: フロー型か確認 → HTML 取得（/shimamura-html-fetch）→
               FlowPage 作成 or 追記 → CSV → テストファイル → 実行確認

  ※ 一覧検索テストは /shimamura-ichiran-dev スキルを使うこと
---

# shimamura 登録・処理フロー テスト開発スキル

shimamura の登録・処理フロー（受講生登録、退会処理、経理処理など）に対する
E2E テスト（Flow Page Object / CSV / テストファイル）を新規作成・修正する際の標準手順。

---

## tframe との根本的な違い（必ず把握すること）

| 項目 | tframe | shimamura |
|---|---|---|
| テストの単位 | 画面単位（登録フォーム 1 枚） | **業務フロー単位**（複数画面をまたぐ） |
| Page Object | `pages/tframe/screens/{名前}Page.js` | `pages/shimamura/{名前}FlowPage.js` |
| フォーム入力 | `fillTextFields(I, fieldMap)`（`#id` 属性） | `executeScript` 一括 + `I.selectOption` 個別（`name=` 属性多数） |
| 保存ボタン | `#ewSaveButton`（全画面共通） | 画面ごとに「更新」「確定」「売上計上する」など異なる |
| エラー確認 | `submitTframeFormAndVerify()` | `verifyValidationErrors(I, errors, '#top_err_info_msg_div')` |
| 画面遷移 | URL 直遷移（`navigateTo*()`） | `navigateToAdminTab()` + `toggleGroupmenu()` + `clickSubMenuLink()` |
| ポップアップ | tframe モーダル（同タブ） | **別タブ**（`I.switchToNextTab()` が必要） |

shimamura には「フォームを1枚埋めて保存」という単純なパターンが少なく、
ほぼすべてが複数画面をまたぐ業務フロー。**Page Object ではなく Flow Page**として設計する。

---

## テストパターン分類

新しいフローテストを作る前に、どのパターンに当てはまるかを確認する。

### パターン A: 複数画面フロー型（主流）

候補生検索 → 詳細 → 経理ビュー A → ポップアップ（別タブ） → 経理ビュー B → 確認 のように
**複数の画面遷移**と**別タブ操作**を含む複雑なフロー。

雛形: `pages/shimamura/flow/SyokaiFlowPage.js` + `tests/shimamura/flow/syokai_touroku_test.js`

```
verbNoun() 関数（各ステップ。例: navigateToXxxScreen / fillXxxForm / confirmXxxSubmit）
    ↓
runXxxFlow()（オーケストレーター）
    ↓
テストファイル（Scenario から runXxxFlow() を呼ぶ）
```

> **命名規則（AGENTS.md参照）**: 各ステップ関数は `ShouldBeOnXxx` ではなく `verbNoun`
> （`navigateTo...` / `open...` / `fill...` / `confirm...` / `execute...` 等）で命名すること。
> `ShouldBeOnXxx` は過去に混在していた旧パターンで、2026-07 に全廃済み（#issue参照）。

### パターン B: フォーム入力型（簡易）

管理タブ → 対象画面 → フォーム入力 → ボタンクリック → 結果確認 のような
**1〜2 画面で完結**するシンプルなフロー。

雛形: `tests/shimamura/flow/keiri_hennkin_syori_test.js`（FlowPage なし・テストファイル内に完結）

---

## 前提知識：参照すべきファイル

| 目的 | 参照先 |
|---|---|
| フロー型 PO のパターン（複雑） | `pages/shimamura/flow/SyokaiFlowPage.js` |
| フロー型テストの書き方 | `tests/shimamura/flow/syokai_touroku_test.js` |
| フォーム型テストの書き方 | `tests/shimamura/flow/keiri_hennkin_syori_test.js` |
| 退会フローの書き方（タブ遷移なし） | `tests/shimamura/flow/taikai_test.js` |
| ナビゲーションメソッド | `pages/shimamura/_common/ClassMemberPage.js` |
| shimamura 固有ユーティリティ | `support/shimamura/utils.js` |
| TIMEOUTS 定数 | `support/shimamura/constants.js` |
| CSV の形式 | `data/shimamura/syokai_touroku_data.csv` |

---

## ワークフロー（パターン A: 複数画面フロー型）

### Step 1: 対象フローの確認

0. **既存の類似フローが無いか確認する（必須・最優先）**
   `pages/shimamura/flow/` と `tests/shimamura/flow/` を対象のキーワード（画面名・業務名の
   日本語/ローマ字両方）で grep する。似た処理が既にあれば重複実装せず、既存関数を呼び出す
   か拡張する（引数を増やす等）。
   例: 過去に「退会処理」を `taikai_test.js` に独自実装したまま `SyokaiFlowPage.js` の
   `executeTaikai` と重複していた事例あり（#issue参照）。同じ業務語で複数箇所にロジックが
   分散していないか必ず確認すること。
1. **フローを構成する画面を列挙する**（例: 受講生検索 → 詳細 → 経理ビュー A → クラス選択ポップアップ → 経理ビュー B）
2. **各画面のフォームフィールドを確認する**（`/shimamura-html-fetch` で取得、または既存 HTML を参照）
3. **ポップアップが別タブで開くか確認する**（開く場合は `I.switchToNextTab()` が必要）
4. **URL パターンを確認する**（`scripts/html/shimamura/` のリンク一覧 JSON または実機確認）

---

### Step 2: Flow Page Object の作成

`pages/shimamura/{prefix}FlowPage.js` を作成する。

```javascript
'use strict';

const { logScreenUrl } = require('../../../support/utils');
const {
  toggleGroupmenu,
  verifyValidationErrors
} = require('../../../support/shimamura/utils');
const { TIMEOUTS, SELECTORS } = require('../../../support/shimamura/constants');

// ローカルロケーター（この FlowPage だけで使うセレクタをまとめる）
// エラーコンテナ・検索結果リンク等の全画面共通セレクタは SELECTORS（constants.js）を参照し、
// このファイル内で文字列リテラルとして再定義しないこと（複数ファイルへの重複を防ぐため）。
const LOCATORS = {
  textbox: { field1: '#field_id_1', field2: '#field_id_2' },
  pulldown: { area: '#area_id', school: '#school_id' },
  button:   { save: '更新', search: '検索' },
  screen:   { name: '〇〇画面' },
  error:    { container: SELECTORS.ERROR_CONTAINER }
};

// --------- 各ステップ（verbNoun パターン） ---------

async function navigateToTargetScreen(I, classMemberPageShimamura) {
  I.say('【画面遷移】〇〇画面へ');
  // ナビゲーション
  await classMemberPageShimamura.navigateToAdminTab(I, '管理タブ名', 'メニュー項目名');
  await logScreenUrl(I, '〇〇画面');
  I.waitForElement(locate('body').withText(LOCATORS.screen.name), TIMEOUTS.SCREEN);
}

async function fillTargetForm(I, input) {
  I.say('【フォーム入力】〇〇フォームへ入力');
  // テキスト入力: executeScript で一括セット（fillField の個別呼び出しより高速）
  const textFields = [
    ['field1', input.field1],
    ['field2', input.field2],
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
  if (input.area) I.selectOption(LOCATORS.pulldown.area, input.area);
}

async function submitAndVerify(I, expectedErrors = []) {
  I.say('【確定/保存】');
  I.click(LOCATORS.button.save);
  if (expectedErrors.length > 0) {
    await verifyValidationErrors(I, expectedErrors, LOCATORS.error.container);
    return;
  }
  I.say('【確認】保存成功');
}

// --------- オーケストレーター ---------

async function run{FlowName}Flow(I, classMemberPageShimamura, input) {
  await navigateToTargetScreen(I, classMemberPageShimamura);
  await fillTargetForm(I, input);
  await submitAndVerify(I, input.expectedErrors);
}

module.exports = {
  run{FlowName}Flow
};
```

#### 別タブポップアップが必要な場合

shimamura のポップアップはすべて**別タブ**で開く。選択後はタブが自動でクローズするが、
CodeceptJS は閉じたタブを参照し続けるため、**`I.switchToNextTab()` で明示的に元タブへ戻る必要がある。**
戻らないと次のステップで `Target page, context or browser has been closed` エラーが発生する。

```javascript
async function selectFromPopupTab(I) {
  I.say('【ポップアップ】別タブへ切替');
  I.wait(TIMEOUTS.TAB_SWITCH);          // タブが開くまで待つ
  I.switchToNextTab();                  // ポップアップタブへ
  I.waitForElement('.listViewTdLinkS1', TIMEOUTS.RESULT);
  // 検索 → クリック（query=true の場合は検索不要）
  I.click('検索');
  I.waitForElement('.listViewTdLinkS1', TIMEOUTS.RESULT);
  I.click(locate('.listViewTdLinkS1').first());
  I.wait(TIMEOUTS.TAB_SWITCH);          // ポップアップが閉じるまで待つ
  I.switchToNextTab();                  // ← 必須: 元タブへ戻る
}
```

> **なぜ `switchToNextTab()` で戻れるか**:
> ポップアップタブが閉じると pages 配列から消え、`indexOf(this.page)` が -1 になる。
> その結果 `pages[0]`（元タブ）が選ばれる仕組み。

#### アコーディオンメニュー（サブメニューグループ）を開く場合

```javascript
// icon_id: サブメニューグループのトグルボタン ID（例: 'submenu__detailviews_sub'）
// menuname: メニューラベル文字列（例: '閲覧/登録・経理ビュー'）
await toggleGroupmenu(I, { icon_id: 'submenu__xxx_sub', menuname: 'メニュー名' });
classMemberPageShimamura.clickSubMenuLink('リンクラベル', 'サブラベル');
```

#### チェックボックス（shimamura 専用実装）

```javascript
const { clickCheckboxByLabelOrName, verifyCheckboxCheckedByLabelOrName } = require('../../../support/shimamura/utils');

// クリック
await clickCheckboxByLabelOrName(I, {
  labelText: '月途中',     // 画面ラベル
  inputName: 'ltd_mid_month',
  inputId: 'ltd_mid_month',
  containerSelector: '#ltd_mid_month'
});

// 検証
await verifyCheckboxCheckedByLabelOrName(I, {
  labelText: '月途中',
  inputName: 'ltd_mid_month',
  inputId: 'ltd_mid_month'
});
```

---

### Step 3: CSV の作成

`data/shimamura/{prefix}_touroku_data.csv`（正常系）と
`data/shimamura/{prefix}_validation_errors.csv`（異常系）を作成する。

```
scenario,field1,field2,area,expectedErrors
正常登録,テスト値1,テスト値2,エリア名,
必須エラー,,,,必須項目を入力してください
```

**ルール:**
- `scenario` 列は必須（シナリオラベル）
- 正常系は `expectedErrors` を空にする
- 異常系は `expectedErrors` に `|` 区切りで複数エラーを指定できる（`parseExpectedErrors()` で処理）
- フィールド名は HTML の `name=` 属性または `id` 属性の値をそのまま列名にする（camelCase推奨。既存の
  同一概念の列がある場合はそれに合わせる。例: 退会年月は `taikaiYear`/`taikaiMonth` で統一）
- **契約日・開始日・退会年月など日付/年月を含む列は、固定日付を書くとテストが月をまたいで壊れる**。
  テストファイル側で `resolveDynamicDateIfPast()`（`support/shimamura/utils.js`）を通して読み込むこと
  （実装例は `tests/shimamura/flow/syokai_touroku_test.js` を参照）。

#### expectedErrors 列に書くテキストの決め方

**shimamura のエラーメッセージは実機確認が必要。** 以下の手順で取得する。

**手順 A — まず空欄で CSV を作ってテストを走らせる（推奨）**

```csv
scenario,last_name,expectedErrors
姓なしで保存,,
```

`expectedErrors` を空にしてテストを実行すると、エラーコンテナが表示されるだけで
テキスト検証はスキップされる（`parseExpectedErrors('')` が空配列を返すため）。
→ スクリーンショット or Allure レポートでエラー文言を確認してから CSV を更新する。

**手順 B — `--debug` で実行して DOM を直接確認する**

```bash
npx codeceptjs run ./tests/shimamura/{prefix}_touroku_test.js --profile shimamura.testgcp --debug
```

ブラウザが閉じずに残るので `#top_err_info_msg_div` の中身を DevTools で確認できる
（`KEEP_BROWSER_OPEN=1` 環境変数が必要な場合もある）。

**手順 C — テスト内で `grabTextFrom` してログ出力する（確認専用）**

```javascript
// 一時的にエラーテキストをログ出力して確認する（確認後は削除する）
I.click(S.button.save);
I.waitForElement(S.error.container, TIMEOUTS.SCREEN);
const errText = await I.grabTextFrom(S.error.container);
I.say('エラー文言: ' + errText);
```

**確認後の CSV 記入例:**

```csv
scenario,last_name,expectedErrors
姓なしで保存,,姓
名なしで保存,テスト,名
複数エラー,,姓|名
```

> **注意**: 部分一致でマッチするため、エラーメッセージ全文ではなくキーワードだけで OK。

---

### Step 4: テストファイルの作成

`tests/shimamura/flow/{prefix}_touroku_test.js` を作成する。

```javascript
/**
 * @fileoverview shimamura {画面名} 登録・処理フロー E2E テスト
 *
 * **データソース**
 * - `data/shimamura/{prefix}_touroku_data.csv`
 * - `data/shimamura/{prefix}_validation_errors.csv`（異常系）
 */
const {
  loadCsvWithProfile,
  withScenarioLabel,
  parseExpectedErrors,
  setBusinessLabels,
  attachBusinessContext,
  attachErrorScreenshot
} = require('../../../support/utils');
const { validateShimamuraEnv } = require('../../../support/shimamura/utils');
const { run{FlowName}Flow } = require('../../../pages/shimamura/flow/{prefix}FlowPage');

const csvData = withScenarioLabel(
  loadCsvWithProfile('{prefix}_touroku_data', 'shimamura'),
  (row) => row.scenario
);

const validationErrorData = withScenarioLabel(
  loadCsvWithProfile('{prefix}_validation_errors', 'shimamura'),
  (row) => row.label || row.scenario
);

Feature('{画面名}登録フロー'); // 必ずテスト内容を表す名前にする。'Dev sandbox (@dev)' 等の仮名を残さない

Before(async ({ login, loginPageShimamura }) => {
  const tantousyaNumber = validateShimamuraEnv();
  await login('user');
  await loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);
});

Data(csvData).Scenario('{画面名}を登録できる @dev @normal', async ({ I, classMemberPageShimamura, current }) => {
  setBusinessLabels({ epic: '{業務名}', feature: '{画面名}登録', story: '正常フロー' });

  const input = {
    field1: current.field1,
    field2: current.field2,
    area: current.area,
    expectedErrors: parseExpectedErrors(current.expectedErrors)
  };

  attachBusinessContext({ label: '正常フロー', input });

  await run{FlowName}Flow(I, classMemberPageShimamura, input);

  I.saveScreenshotWithTimestamp('{PREFIX}_TOUROKU_success');
});

Data(validationErrorData).Scenario('{画面名}のバリデーションエラー @dev @error', async ({ I, classMemberPageShimamura, current }) => {
  const storyLabel = current.label || 'バリデーションエラー';
  setBusinessLabels({ epic: '{業務名}', feature: '{画面名}登録', story: storyLabel });

  const input = {
    field1: current.field1,
    field2: current.field2,
    expectedErrors: parseExpectedErrors(current.expectedErrors)
  };

  attachBusinessContext({ label: storyLabel, input, expectedErrors: input.expectedErrors });

  await run{FlowName}Flow(I, classMemberPageShimamura, input);
  await attachErrorScreenshot(I, '{PREFIX}_VALIDATION_ERROR');
});
```

---

## ワークフロー（パターン B: フォーム入力型）

1〜2 画面で完結する場合は FlowPage を作らず、テストファイル内に完結させる。

雛形: `tests/shimamura/flow/keiri_hennkin_syori_test.js`

```javascript
// セレクタをファイル先頭にまとめる（ローカル定数）
// エラーコンテナ等の全画面共通セレクタは SELECTORS（support/shimamura/constants.js）を参照する
const { SELECTORS } = require('../../../support/shimamura/constants');
const S = {
  fields:  { month: '#billing_month', school: '#school_id' },
  buttons: { search: '検索', save: '更新' },
  result:  { table: '.listView' },
  error:   { container: SELECTORS.ERROR_CONTAINER }
};

// 各ステップを async function で定義
async function navigateToTargetScreen(I, classMemberPageShimamura) {
  await classMemberPageShimamura.navigateToAdminTab(I, '管理タブ', 'メニュー項目');
  await logScreenUrl(I, '対象画面');
}

async function fillTargetForm(I, input) {
  // テキスト入力: executeScript で一括セット
  const textFields = [
    ['month', input.month],
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
  I.selectOption(S.fields.school, input.school);
  I.click(S.buttons.search);
}

// Before / Scenario は通常通り
Before(async ({ login, loginPageShimamura }) => {
  const tantousyaNumber = validateShimamuraEnv();
  await login('user');
  await loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);
});

Data(csvData).Scenario('〇〇処理 @dev', async ({ I, classMemberPageShimamura, current }) => {
  await navigateToTargetScreen(I, classMemberPageShimamura);
  await fillTargetForm(I, { month: current.month, school: current.school });
  I.click(S.buttons.save);
  I.saveScreenshotWithTimestamp('TARGET_FORM_result');
});
```

---

## Step 5: テスト実行と確認

```bash
npx codeceptjs run ./tests/shimamura/flow/{prefix}_touroku_test.js --profile shimamura.testgcp
```

確認ポイント:
- 正常系: 最後の画面に到達してスクリーンショットが保存されること
- 異常系: `#top_err_info_msg_div` に期待エラーが表示されること
- タブ操作: 別タブが開閉されても元のタブに正しく戻ること

---

## 共通セレクタ・ユーティリティ早見表

### ナビゲーション

```javascript
// 管理タブ → サブメニュー項目
await classMemberPageShimamura.navigateToAdminTab(I, '受講生', '受講生登録');

// サイドメニューのアコーディオンを開く
await toggleGroupmenu(I, { icon_id: 'submenu__detailviews_sub', menuname: '閲覧/登録・経理ビュー' });

// サブメニューリンクをクリック
classMemberPageShimamura.clickSubMenuLink('リンクラベル', 'サブラベル');
```

### フォーム操作

| 目的 | コード |
|---|---|
| テキスト入力（複数） | `executeScript` で一括セット（下記参照）|
| セレクト | `I.selectOption('select[name="field"]', value)`（個別。change イベントが必要） |
| ボタンクリック | `I.click('ボタンラベル')` または `I.click('#buttonId')` |
| URL 直遷移 | `I.amOnPage(process.env.BASE_URL + '/index.php?module=X&action=Y')` |

#### テキスト入力: executeScript 一括パターン（標準）

```javascript
// ✅ 標準: テキスト入力は executeScript で一括セット
const textFields = [
  ['field1', input.field1],
  ['field2', input.field2],
].filter(([, v]) => v);
if (textFields.length > 0) {
  I.executeScript((fields) => {
    fields.forEach(([name, value]) => {
      const el = document.querySelector(`[name="${name}"]`);
      if (el) el.value = value;
    });
  }, textFields);
}
```

> **例外 — 以下は通常の fillField / 個別処理を使う**
>
> | ケース | 理由 | 対処 |
> |---|---|---|
> | `selectOption` | change イベントが必要 | 個別に `I.selectOption()` |
> | 郵便番号・銀行コード（AJAX 連動） | API 補完を wait で待つ必要がある | `I.fillField()` + `I.wait(TIMEOUTS.AJAX_DEBOUNCE_SHORT)`（マジックナンバーを直書きしない） |
> | `readonly` 属性の textarea | removeAttribute が必要 | executeScript 内で `el.removeAttribute('readonly'); el.value = value;` |

#### shimamura の保存ボタン パターン一覧

shimamura の保存ボタンは `type="button"` + `onclick` で送信するパターンが多い。
value に**全角スペースが混入**しているケースがあるため、テキスト指定より `name=` 属性で指定するのが安全。

```html
<!-- よく見られる形式 -->
<input type="button" name="save_button" value="　保存　" onclick="this.form.submittype.value='save';this.form.submit();">
<input type="button" name="save_button" value="更新" onclick="...">
```

```javascript
// 推奨: name 属性で指定（全角スペース問題を回避）
I.click('input[name="save_button"]');

// value テキストで指定する場合は全角スペースをそのまま書く
I.click('　保存　');

// value が「更新」「確定」「登録」の場合はそのまま使える
I.click('更新');
```

### エラー確認

```javascript
const { verifyValidationErrors } = require('../../support/shimamura/utils');
await verifyValidationErrors(I, expectedErrors, '#top_err_info_msg_div');
```

### URL 変化を待って要素をクリック

```javascript
const { verifyNavigationByUrlChange } = require('../../support/shimamura/utils');
// maxTries=5 で 1 秒ごとに URL に 'targetValue' が含まれるか確認し、見つかったらクリック
await verifyNavigationByUrlChange(I, 5, 'DWConfirmCarteKeiri_AN', '確認完了（経理ビューへ）');
```

### TIMEOUTS

```javascript
const { TIMEOUTS } = require('../../support/shimamura/constants');
// TIMEOUTS.SCREEN   = 画面遷移の待機（10〜15秒程度）
// TIMEOUTS.ELEMENT  = 要素待機（5〜10秒程度）
// TIMEOUTS.RESULT   = 検索結果待機（15秒程度）
// TIMEOUTS.ENABLED  = フィールドが enabled になるまで待機
// TIMEOUTS.TAB_SWITCH = 別タブが開くまでの待機（1〜2秒程度）
```

### 保存後の結果確認

保存ボタン押下後の確認方法は、**保存成功時にページ遷移するか否か**で使い分ける。

| ケース | 方法 | 理由 |
|---|---|---|
| 保存後もページに留まる（エラーも成功も同一ページ） | `I.grabTextFrom('#top_err_info_msg_div')` | 要素が常に存在するため安全 |
| 保存成功でページ遷移する（詳細画面などへリダイレクト） | `I.executeScript(...)` で DOM を直接参照 | 遷移後に `grabTextFrom` を呼ぶと `ElementNotFound` になる |

**ページ遷移する場合の実装パターン:**

```javascript
async function saveAndVerify(I, expectedErrors) {
  I.click('input[name="save_button"]');
  I.wait(TIMEOUTS.RESULT);
  if (expectedErrors.length > 0) {
    await verifyValidationErrors(I, expectedErrors, '#top_err_info_msg_div');
    return;
  }
  // 登録成功時はページ遷移するため grabTextFrom は使えない
  // executeScript でDOM直接確認（要素なし=遷移=成功、テキストあり=エラー）
  const errorText = await I.executeScript(() => {
    const el = document.querySelector('#top_err_info_msg_div');
    return el ? el.textContent.trim() : '';
  });
  if (errorText) {
    throw new Error(`登録エラー: ${errorText}`);
  }
  I.say('【確認】登録成功');
}
```

> **なぜ try-catch では解決しないか:**
> CodeceptJS の Recorder は `grabTextFrom` の ElementNotFound を "Uncaught" エラーとして処理するため、
> `async` 関数の `try-catch` をバイパスしてテストが失敗する。`executeScript` は要素不在を例外でなく
> `null` として返すため、JavaScript 側で安全にハンドリングできる。

---

## ファイル配置ルール

| ファイル | 配置先 | 理由 |
|---|---|---|
| Flow Page Object | `pages/shimamura/flow/{prefix}FlowPage.js` | 業務フロー関数の集合（Page Object）|
| テストファイル | `tests/shimamura/flow/{prefix}_touroku_test.js` | テストシナリオのみ |
| CSV（正常系） | `data/shimamura/{prefix}_touroku_data.csv` | テスト入力データ |
| CSV（異常系） | `data/shimamura/{prefix}_validation_errors.csv` | バリデーション用データ |

**既存ファイルへの追記**（新フローが少量の場合）:
- 流れが 3 ステップ以内なら FlowPage は不要でテストファイル内に完結させる（パターン B）
- 既存フロー（syokai）に関連する小さな追記なら `SyokaiFlowPage.js` へ追記することも可

---

## トラブルシューティング

| エラー | 原因 | 対処 |
|---|---|---|
| 画面が表示されない | URL の module / action が違う | `scripts/html/shimamura/` の links.json で確認、または実機で URL を取得 |
| `#top_err_info_msg_div` が見つからない | エラーが出ていない / 違うコンテナ | 実際のエラー表示先を実機で確認する |
| 別タブが開かない | クリック対象が wrong / タイムアウト | `I.wait(TIMEOUTS.TAB_SWITCH)` を増やす・セレクタを確認する |
| `switchToNextTab()` 後に要素が見つからない | タブ数がずれている | タブが何番目かを確認（`I.grabCurrentUrl()` でログ取得） |
| サブメニューが開かない | `icon_id` が wrong | 実際の DOM で `submenu__*_sub` の ID を確認する |
| `toggleGroupmenu` が wrong | メニューが既に開いている | すでに開いている場合はスキップされる（問題なし）|
| チェックボックスがクリックできない | DOM 構造が特殊 | `clickCheckboxByLabelOrName` の `labelText` / `inputName` / `inputId` を全て指定する |
| `SHIMAMURA_TANTOUSYA` エラー | 環境変数が未設定 | `env/.env.{profile}` に `SHIMAMURA_TANTOUSYA=番号` を追加 |
| `BASE_URL` の末尾スラッシュなし | URL が `testgcpindex.php...` になる | `I.amOnPage(BASE_URL + '/index.php?...')` と `/` を明示する |
| 保存ボタンが見つからない / クリックできない | value に全角スペース（`"　保存　"`）が混入 | `I.click('input[name="save_button"]')` と name 属性で指定する |
| `expectedErrors` の検証でテストが失敗する | エラー文言が実際のメッセージと不一致 | CSV を空欄にして先に実行し、スクリーンショットでエラー文言を確認してから更新する |
| ポップアップ後に `Target page, context or browser has been closed` エラー | 別タブが自動クローズ後も閉じたタブを参照し続けている | ポップアップ内で選択後 `I.wait(TIMEOUTS.TAB_SWITCH)` → `I.switchToNextTab()` を追加して元タブへ戻る |
| 保存成功後に `Element "#top_err_info_msg_div" was not found` エラー | 成功時にページ遷移する画面で `grabTextFrom` を使用している | `I.executeScript(() => { const el = document.querySelector('#top_err_info_msg_div'); return el ? el.textContent.trim() : ''; })` に切替え |
| 「開始日は当月以降で入力してください。」等の日付バリデーションエラー | CSVに固定日付（例: `2026-06-05`）を書いており月をまたいで過去日になった | `support/shimamura/utils.js` の `resolveDynamicDateIfPast(I, dateStr, fieldLabel, { graceMonths })` で当日日付に自動補正する。画面ごとに許容範囲が異なる（契約日/開始日は当月以降のみ=`graceMonths: 0`、退会処理は先月まで許容=`graceMonths: 1`）ため実機で確認すること |
| 退会処理で「指定の退会日は選択できません。」エラー | 退会処理は「先月まで許容・先々月以前はNG」というルールを持つ（契約日/開始日の「当月以降のみ」とは別ルール） | 上記 `resolveDynamicDateIfPast` を `graceMonths: 1` で使う |
| 退会処理で「退会する対象が選択されていません。」エラー | 対象受講生に有効なクラス・コースが存在しない（既に退会済み等） | テストデータ側の問題。別の受講生を使うか、テスト用受講生を新規作成する |
| 経理カルテビュー等で「経理処理が完了してないデータがあります」の警告が出て後続操作（退会処理等）がブロックされる | 対象受講生に確定していない料金レコードが残っている | `SyokaiFlowPage.js` の `resolveUnfinishedKeiriDataIfPresent(I)` を呼ぶ（「未完了情報確認」→「確認完了（経理ビューへ）」を自動でクリックする）。解消後は経理ビューAに遷移するため、元のタブ状態に依存する後続処理がある場合は再遷移が必要（`taikai_test.js` の `navigateToTaikaiScreen` を参照） |
| 月謝一括作成バッチ（`LWMonthlyFeeCreation_AN`）が何も作成しない | 収納業者のうち1つでも対象月の口座振替スケジュール（`module=ShimaSchedule&action=LWAccountTransferScheduleRegistration_AN`）が未登録だと、その収納業者だけでなく処理対象全体が作成されない | `support/shimamura/accountTransferSchedule.js` の `ensureAccountTransferSchedules` を実行前に呼ぶ（`GessyaIkkatuFlowPage.js` の `runMonthlyFeeCreation` は既に内蔵済み） |
