# shimamura 実装パターン早見表

SKILL.md のワークフロー中に特殊ケースへ遭遇したときに読む参照ファイル。
（別タブポップアップ / アコーディオン / チェックボックス / 保存ボタン / 保存後確認 / 共通ユーティリティ）

---

## ナビゲーション

```javascript
// 管理タブ → サブメニュー項目
await classMemberPageShimamura.navigateToAdminTab(I, '受講生', '受講生登録');

// サイドメニューのアコーディオンを開く
await toggleGroupmenu(I, { icon_id: 'submenu__detailviews_sub', menuname: '閲覧/登録・経理ビュー' });

// サブメニューリンクをクリック
classMemberPageShimamura.clickSubMenuLink('リンクラベル', 'サブラベル');
```

### アコーディオンメニュー（サブメニューグループ）を開く場合

```javascript
// icon_id: サブメニューグループのトグルボタン ID（例: 'submenu__detailviews_sub'）
// menuname: メニューラベル文字列（例: '閲覧/登録・経理ビュー'）
await toggleGroupmenu(I, { icon_id: 'submenu__xxx_sub', menuname: 'メニュー名' });
classMemberPageShimamura.clickSubMenuLink('リンクラベル', 'サブラベル');
```

---

## 別タブポップアップ

shimamura のポップアップはすべて**別タブ**で開く。選択後はタブが自動でクローズするが、
CodeceptJS は閉じたタブを参照し続けるため、**`I.switchToNextTab()` で明示的に元タブへ戻る必要がある。**
戻らないと次のステップで `Target page, context or browser has been closed` エラーが発生する。

実装例: `KoushiShareiFlowPage.selectTeacher`（最初の結果を選ぶ）/ `SyokaiFlowPage.selectClassInPopup`（完全一致行を選ぶ）

```javascript
// KoushiShareiFlowPage.js より
async function selectTeacher(I) {
  I.say('【講師選択】ポップアップを開く');
  I.click(S.buttons.teacher_popup);
  I.switchToNextTab();                                        // ポップアップタブへ
  I.waitForElement(S.teacher_popup.result, TIMEOUTS.RESULT);  // a.listViewTdLinkS1
  I.say('【講師選択】最初の結果を選択');
  I.click(locate(S.teacher_popup.result).first());
  // ポップアップタブが閉じた後、元のタブへ戻る
  I.switchToNextTab();                                        // ← 必須: 元タブへ戻る
}
```

タブが開くまでの待ちが必要な画面は `I.retry({ retries: 5, minTimeout: 200 }).switchToNextTab();`（`SyokaiFlowPage.fillClassSearchForm`）。
クラス名検索は前方一致で類似クラスが混入するため、`selectClassInPopup` は完全一致の XPath で行を選んでいる。

> **なぜ `switchToNextTab()` で戻れるか**:
> ポップアップタブが閉じると pages 配列から消え、`indexOf(this.page)` が -1 になる。
> その結果 `pages[0]`（元タブ）が選ばれる仕組み。

---

## フォーム操作

| 目的 | コード |
|---|---|
| テキスト入力（`name=` 属性） | `fillTextFieldsByName(I, { last_name: v, first_name: v })`（空値は自動スキップ） |
| テキスト入力（`#id` / 複合セレクタ） | `fillTextFieldsBySelector(I, [['#keijoubi', v], ['#houshugaku', v]])` |
| セレクト | `I.selectOption('select[name="field"]', value)`（個別。change イベントが必要） |
| ボタンクリック | `I.click('input[name="save_button"]')` または `I.click('ボタンラベル')` |
| URL 直遷移 | `I.amOnPage(process.env.BASE_URL + '/index.php?module=X&action=Y')` |

### テキスト入力: 共通ユーティリティを使う（標準）

```javascript
const { fillTextFieldsByName, fillTextFieldsBySelector } = require('../../../support/shimamura/utils');

// ✅ 標準: name= 属性なら fillTextFieldsByName（FORM_FILL_FAST=true で executeScript 一括、既定は fillField 個別）
fillTextFieldsByName(I, {
  last_name:  input.last_name,
  first_name: input.first_name,
});

// ✅ #id 指定なら fillTextFieldsBySelector（常に executeScript 一括）
fillTextFieldsBySelector(I, [
  [S.fields.keijoubi,      input.keijoubi],
  [S.fields.from_datetime, input.from_datetime],
]);

// ❌ 非推奨: executeScript の一括セットを FlowPage 内に直書きする（utils に同じものがある）
```

> **例外 — 以下は通常の fillField / 個別処理を使う**
>
> | ケース | 理由 | 対処 |
> |---|---|---|
> | `selectOption` | change イベントが必要 | 個別に `I.selectOption()` |
> | 郵便番号・銀行コード（AJAX 連動） | API 補完を wait で待つ必要がある | `I.fillField()` + `I.wait(TIMEOUTS.AJAX_DEBOUNCE_SHORT)`（`StudentSaikenkaiFlowPage.fillAndSaveStudentBasicInfo` 参照） |
> | 銀行コードが keyup で補完される画面 | value 代入だけでは発火しない | `executeScript` で `el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }))`（`TeacherKeiriFlowPage.setAccountingTab` 参照） |
> | `readonly` 属性の textarea | removeAttribute が必要 | executeScript 内で `el.removeAttribute('readonly'); el.value = value;` |

---

## チェックボックス（shimamura 専用実装）

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

## 保存ボタンのパターン

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

---

## エラー確認

```javascript
const { verifyValidationErrors, assertNoShimamuraError } = require('../../../support/shimamura/utils');
const { SELECTORS } = require('../../../support/shimamura/constants');

// 異常系: 期待エラー文言が含まれること
await verifyValidationErrors(I, expectedErrors, SELECTORS.ERROR_CONTAINER);

// 成功系: エラーコンテナが空であること（テキストがあれば throw）
await assertNoShimamuraError(I, '【〇〇】保存');
```

## URL 変化を待って要素をクリック

```javascript
const { verifyNavigationByUrlChange } = require('../../../support/shimamura/utils');
// 最大 5 秒、URL に 'DWConfirmCarteKeiri_AN' が含まれるのを待ってからクリック
await verifyNavigationByUrlChange(I, 5, 'DWConfirmCarteKeiri_AN', '確認完了（経理ビューへ）');
```

## TIMEOUTS（`support/shimamura/constants.js` の実値）

```javascript
const { TIMEOUTS } = require('../../../support/shimamura/constants');
// TIMEOUTS.SCREEN             = 5   画面タイトルの出現待ち
// TIMEOUTS.ELEMENT            = 10  通常の要素出現待ち
// TIMEOUTS.RESULT             = 10  検索結果の表示待ち
// TIMEOUTS.ENABLED            = 15  入力可能になるまでの待ち
// TIMEOUTS.TAB_SWITCH         = 2   タブ切り替え・AJAX 再描画後の安定待ち
// TIMEOUTS.AJAX_DEBOUNCE      = 1   郵便番号/銀行コード等の AJAX 補完待ち（標準）
// TIMEOUTS.AJAX_DEBOUNCE_SHORT= 0.5 軽量な AJAX 補完待ち
```

## 口座振替スケジュールの事前確保

月謝一括作成・発表会参加費など「対象月の料金を作る」処理は、収納業者の口座振替スケジュールが
未登録だと処理全体が止まる（#169）。バッチ前に `ensureAccountTransferSchedules` で確保する。

```javascript
const { ensureAccountTransferSchedules } = require('../../../support/shimamura/accountTransferSchedule');
await ensureAccountTransferSchedules(I, { claimMonth: '2026-10', debitDate: '2026-10-11', depositDate: '2026-10-15' });
```

---

## 保存後の結果確認

保存ボタン押下後の確認方法は、**保存成功時にページ遷移するか否か**で使い分ける。

| ケース | 方法 | 理由 |
|---|---|---|
| 保存後もページに留まる（エラーも成功も同一ページ） | `I.grabTextFrom('#top_err_info_msg_div')` | 要素が常に存在するため安全 |
| 保存成功でページ遷移する（詳細画面などへリダイレクト） | `I.executeScript(...)` で DOM を直接参照 | 遷移後に `grabTextFrom` を呼ぶと `ElementNotFound` になる |

**ページ遷移する場合の実装パターン**（`KoushiShareiFlowPage.saveAndVerify` より）:

```javascript
async function saveAndVerify(I, expectedErrors) {
  I.click(S.buttons.save);
  // エラーが出るか保存ボタンが消える（ページ遷移）まで動的に待機。固定 I.wait は使わない
  // codeceptjs の waitForFunction は第2引数が配列でないと args として渡されないため注意
  await I.waitForFunction(
    ([selector]) => document.querySelector(selector)?.textContent.trim() ||
          !document.querySelector('input[name="save_button"]'),
    [SELECTORS.ERROR_CONTAINER],
    TIMEOUTS.RESULT
  );
  if (expectedErrors.length > 0) {
    await verifyValidationErrors(I, expectedErrors, S.message.error);
    return;
  }
  // 登録成功時はページ遷移するため grabTextFrom は使えない → assertNoShimamuraError（executeScript で DOM 直接確認）
  await assertNoShimamuraError(I, '登録');
  I.say('【確認】登録成功');
}
```

保存後に編集画面から詳細画面へ戻る画面は、`'input[name="save_button"]'` が消える代わりに
`'input[name="edit_button"]'` が現れるのを待つ（`StudentSaikenkaiFlowPage.waitForSaveResult` / `TeacherKeiriFlowPage.setAccountingTab`）。

> **なぜ try-catch では解決しないか:**
> CodeceptJS の Recorder は `grabTextFrom` の ElementNotFound を "Uncaught" エラーとして処理するため、
> `async` 関数の `try-catch` をバイパスしてテストが失敗する。`executeScript` は要素不在を例外でなく
> `null` として返すため、JavaScript 側で安全にハンドリングできる。
