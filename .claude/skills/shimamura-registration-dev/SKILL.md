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

## 参照ファイル（このスキルの分冊）

| いつ読むか | ファイル |
|---|---|
| 特殊ケースに遭遇したとき（別タブポップアップ・アコーディオン・チェックボックス・保存ボタンの全角スペース・保存後の結果確認・TIMEOUTS 等） | `references/patterns.md` |
| テスト実行でエラーになったとき（ハマりどころの対処一覧） | `references/troubleshooting.md` |

**新しい落とし穴・実装パターンを発見したら、SKILL.md 本体ではなく上記の分冊に追記すること。**

---

## tframe との根本的な違い（必ず把握すること）

| 項目 | tframe | shimamura |
|---|---|---|
| テストの単位 | 画面単位（登録フォーム 1 枚） | **業務フロー単位**（複数画面をまたぐ） |
| Page Object | `pages/tframe/screens/{名前}Page.js` | `pages/shimamura/flow/{名前}FlowPage.js` |
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
3. **ポップアップが別タブで開くか確認する**（開く場合は `I.switchToNextTab()` が必要 → `references/patterns.md` の「別タブポップアップ」参照）
4. **URL パターンを確認する**（`scripts/html/shimamura/` のリンク一覧 JSON または実機確認）

---

### Step 2: Flow Page Object の作成

`pages/shimamura/flow/{prefix}FlowPage.js` を作成する。

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

> **特殊ケースの実装パターンは `references/patterns.md` を参照:**
> - 別タブポップアップ（`switchToNextTab` の使い方・なぜ戻れるか）
> - アコーディオンメニュー（`toggleGroupmenu`）
> - チェックボックス（`clickCheckboxByLabelOrName`）
> - AJAX 連動フィールド・readonly textarea の例外処理
> - 保存ボタンの全角スペース問題
> - 保存後の結果確認（ページ遷移する画面では `grabTextFrom` が使えない）

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

エラーになった場合は `references/troubleshooting.md` の対処一覧を参照する。

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
