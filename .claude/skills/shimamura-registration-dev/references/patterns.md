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

---

## フォーム操作

| 目的 | コード |
|---|---|
| テキスト入力（複数） | `executeScript` で一括セット（下記参照）|
| セレクト | `I.selectOption('select[name="field"]', value)`（個別。change イベントが必要） |
| ボタンクリック | `I.click('ボタンラベル')` または `I.click('#buttonId')` |
| URL 直遷移 | `I.amOnPage(process.env.BASE_URL + '/index.php?module=X&action=Y')` |

### テキスト入力: executeScript 一括パターン（標準）

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
const { verifyValidationErrors } = require('../../support/shimamura/utils');
await verifyValidationErrors(I, expectedErrors, '#top_err_info_msg_div');
```

## URL 変化を待って要素をクリック

```javascript
const { verifyNavigationByUrlChange } = require('../../support/shimamura/utils');
// maxTries=5 で 1 秒ごとに URL に 'targetValue' が含まれるか確認し、見つかったらクリック
await verifyNavigationByUrlChange(I, 5, 'DWConfirmCarteKeiri_AN', '確認完了（経理ビューへ）');
```

## TIMEOUTS

```javascript
const { TIMEOUTS } = require('../../support/shimamura/constants');
// TIMEOUTS.SCREEN   = 画面遷移の待機（10〜15秒程度）
// TIMEOUTS.ELEMENT  = 要素待機（5〜10秒程度）
// TIMEOUTS.RESULT   = 検索結果待機（15秒程度）
// TIMEOUTS.ENABLED  = フィールドが enabled になるまで待機
// TIMEOUTS.TAB_SWITCH = 別タブが開くまでの待機（1〜2秒程度）
```

---

## 保存後の結果確認

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
