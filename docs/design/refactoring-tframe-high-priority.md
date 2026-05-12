# tframe リファクタリング解説（優先度 高 4件）

実装前の理解を深めるための解説ドキュメント。  
各問題について「なぜ問題か」「コードで何が起きているか」「どう直すか」を具体的に説明する。

---

## 目次

1. [一覧検索メソッドの重複（IchiranMixin）](#1-一覧検索メソッドの重複-ichiranmixin)
2. [fillAddressInfo / fillMemoInfo の重複](#2-filladdressinfo--fillmemoinfo-の重複)
3. [isEnglish() のインライン再実装](#3-isenglish-のインライン再実装)
4. [scrollToHref / clickLinkByHref の二重定義](#4-scrolltohref--clicklinkbyhref-の二重定義)

---

## 1. 一覧検索メソッドの重複（IchiranMixin）

### 何が起きているか

`clickSearchAndWait` / `verifyResultsExist` / `verifyRecordInResults` の3メソッドが、
**12個の Page Object に一字一句同じコードでコピーペーストされている。**

例として `AccountPage.js` と `KoshiPage.js` を比較すると：

**AccountPage.js（L120〜141）**
```js
clickSearchAndWait() {
  I.say('【アカウント一覧】検索ボタンをクリック');
  I.click('#swSearchButton');
  I.waitForElement('.tf-group-body-search-result tr', 15);
},
verifyResultsExist() {
  I.say('【アカウント一覧】検索結果が表示されることを確認');
  I.seeElement('.tf-group-body-search-result tr');
},
verifyRecordInResults(expectedName) {
  I.say(`【アカウント一覧】"${expectedName}" が結果に表示されることを確認`);
  I.see(expectedName, '.tf-group-body-search-result');
},
```

**KoshiPage.js（L341〜362）**
```js
clickSearchAndWait() {
  I.say('【講師一覧】検索ボタンをクリック');  // ← 画面名だけ違う
  I.click('#swSearchButton');
  I.waitForElement('.tf-group-body-search-result tr', 15);
},
verifyResultsExist() {
  I.say('【講師一覧】検索結果が表示されることを確認');  // ← 画面名だけ違う
  I.seeElement('.tf-group-body-search-result tr');
},
verifyRecordInResults(expectedName) {
  I.say(`【講師一覧】"${expectedName}" が結果に表示されることを確認`);  // ← 画面名だけ違う
  I.see(expectedName, '.tf-group-body-search-result');
},
```

**`I.say()` のメッセージに含まれる画面名だけが違う。ロジックは完全に同一。**  
同じセレクタ（`#swSearchButton`, `.tf-group-body-search-result tr`）を tframe の全画面で共有している。

### 同じ状況のファイル一覧

`AccountPage` / `BranchPage` / `ChosekinPage` / `ClassroomPage` / `CoursePage` /  
`InfoHistoryPage` / `JukuseiPage` / `KoshiPage` / `RyokinMasterPage` /  
`RyokinPackagePage` / `ShohinPage` / `StaffPage`（計12ファイル）

### なぜ問題か

- セレクタを変更したいとき（例: タイムアウトを 15 → 20 に変更）、12ファイルを全部修正しなければならない
- 新しい一覧 Page Object を作るたびに、同じ3メソッドをコピーする手間がかかる
- 修正漏れが起きやすい（片方だけ変わってバグに気づかない）

### どう直すか

`MenuNavigationMixin.js` が既に同じパターンで作られているので、それを参考にする。

**作成先**: `pages/tframe/_common/IchiranMixin.js`

```js
// pages/tframe/_common/IchiranMixin.js（新規作成）
const { I } = inject();

function createIchiranMixin(screenLabel) {
  return {
    clickSearchAndWait() {
      I.say(`【${screenLabel}】検索ボタンをクリック`);
      I.click('#swSearchButton');
      I.waitForElement('.tf-group-body-search-result tr', 15);
    },
    verifyResultsExist() {
      I.say(`【${screenLabel}】検索結果が表示されることを確認`);
      I.seeElement('.tf-group-body-search-result tr');
    },
    verifyRecordInResults(expectedName) {
      I.say(`【${screenLabel}】"${expectedName}" が結果に表示されることを確認`);
      I.see(expectedName, '.tf-group-body-search-result');
    },
  };
}

module.exports = createIchiranMixin;
```

**各 Page Object での使い方**（`AccountPage.js` を例に）

```js
// Before: 3メソッドを手書き（約20行）

// After: 1行に置き換え
const createIchiranMixin = require('../_common/IchiranMixin');

module.exports = {
  navigateToListPage() { ... },
  fillSearchConditions(data) { ... },

  // 手書きの3メソッドを削除して、スプレッドに置き換え
  ...createIchiranMixin('アカウント一覧'),
};
```

### 実装チェックリスト

- [ ] `pages/tframe/_common/IchiranMixin.js` を新規作成
- [ ] 12ファイルの3メソッドを削除し、`...createIchiranMixin('...')` に置き換え
- [ ] 各ファイルに `require('../_common/IchiranMixin')` を追加
- [ ] `data/tframe/README.md` の SideMenu 対応表を更新（スキップ可）

---

## 2. fillAddressInfo / fillMemoInfo の重複

### 何が起きているか

住所入力 (`fillAddressInfo`) とメモ入力 (`fillMemoInfo`) も、複数の Page Object で
ほぼ同じコードが繰り返されている。

**KoshiPage.js（L275〜297）**
```js
fillAddressInfo(data) {
  I.say('【講師登録】住所情報 を入力');
  if (data.primaryAddressPostalcode) {
    I.fillField('#primaryAddressPostalcode', data.primaryAddressPostalcode);
    I.click('#zipCodeBtn');
    I.wait(1);
  }
  fillTextFields(I, {
    primaryAddressStreet: data.primaryAddressStreet,
    primaryAddressKana:   data.primaryAddressKana,
  });
},
fillMemoInfo(data) {
  if (!data.description) return;
  I.say('【講師登録】メモ情報 を入力');
  fillTextFields(I, { description: data.description });
},
```

**AccountPage.js（L61〜83）**
```js
fillAddressInfo(data) {
  I.say('【法人・団体登録】住所情報 を入力');   // ← 画面名だけ違う
  if (data.primaryAddressPostalcode) {
    I.fillField('#primaryAddressPostalcode', data.primaryAddressPostalcode);
    I.click('#zipCodeBtn');
    I.wait(1);
  }
  fillTextFields(I, {
    primaryAddressStreet: data.primaryAddressStreet,
    primaryAddressKana:   data.primaryAddressKana,
  });
},
fillMemoInfo(data) {
  if (!data.description) return;
  I.say('【法人・団体登録】メモ情報 を入力');   // ← 画面名だけ違う
  fillTextFields(I, { description: data.description });
},
```

同じパターンは `StaffPage` / `BranchPage` / `JukuseiPage` / `ClassroomPage` 等にも存在する。

### なぜ問題か

`#zipCodeBtn` のセレクタや `primaryAddressPostalcode` などは **tframe 全体で共通のフォームフィールド ID**。
1か所で修正できるはずのものが、変更のたびに複数ファイルを触る必要がある。

### どう直すか

`support/utils.js` に共通関数として追加する（`fillTextFields` と同じ方式）。

```js
// support/utils.js に追加

/**
 * 住所フォームを入力する（郵便番号自動補完付き）
 * @param {object} I - CodeceptJS の I オブジェクト
 * @param {object} data - フォームデータ
 * @param {string} [label=''] - I.say() に表示する画面名
 */
function fillAddressWithZip(I, data, label = '') {
  if (label) I.say(`【${label}】住所情報 を入力`);
  if (data.primaryAddressPostalcode) {
    I.fillField('#primaryAddressPostalcode', data.primaryAddressPostalcode);
    I.click('#zipCodeBtn');
    I.wait(1);
  }
  fillTextFields(I, {
    primaryAddressStreet: data.primaryAddressStreet,
    primaryAddressKana:   data.primaryAddressKana,
  });
}

/**
 * メモフィールドを入力する（値が空のときは何もしない）
 * @param {object} I - CodeceptJS の I オブジェクト
 * @param {object} data - フォームデータ
 * @param {string} [label=''] - I.say() に表示する画面名
 */
function fillMemoField(I, data, label = '') {
  if (!data.description) return;
  if (label) I.say(`【${label}】メモ情報 を入力`);
  fillTextFields(I, { description: data.description });
}
```

**各 Page Object での使い方**

```js
// Before
const { fillTextFields, submitTframeFormAndVerify, isEnglish } = require('../../../support/utils');

fillAddressInfo(data) {
  I.say('【講師登録】住所情報 を入力');
  if (data.primaryAddressPostalcode) {
    I.fillField('#primaryAddressPostalcode', data.primaryAddressPostalcode);
    I.click('#zipCodeBtn');
    I.wait(1);
  }
  fillTextFields(I, {
    primaryAddressStreet: data.primaryAddressStreet,
    primaryAddressKana:   data.primaryAddressKana,
  });
},

// After
const { fillTextFields, submitTframeFormAndVerify, isEnglish, fillAddressWithZip, fillMemoField } = require('../../../support/utils');

fillAddressInfo(data) {
  fillAddressWithZip(I, data, '講師登録');
},
fillMemoInfo(data) {
  fillMemoField(I, data, '講師登録');
},
```

### 注意点

`fillAddressInfo` が独自フィールドも含む Page Object（例: 複数住所を持つ画面）が存在する場合、
共通関数だけでは対応できないことがある。**変更前に各ファイルの `fillAddressInfo` を必ず読んで**、
共通部分と独自部分を見極めること。

### 実装チェックリスト

- [ ] `support/utils.js` に `fillAddressWithZip` / `fillMemoField` を追加
- [ ] `module.exports` に両関数を追加する
- [ ] 対象 Page Object（5〜10ファイル）の `fillAddressInfo` / `fillMemoInfo` を置き換え
- [ ] `require` の分割代入に新関数名を追加

---

## 3. isEnglish() のインライン再実装

### 何が起きているか

`support/utils.js` にはすでに `isEnglish()` がエクスポート済み：

```js
// support/utils.js（L177〜179）
function isEnglish() {
  return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
}
// L239: module.exports に含まれている
```

にもかかわらず、以下の8ファイルでまったく同じロジックを**メソッドとして再実装**している：

```js
// CalendarPage.js / HelpPage.js / CoursePage.js / EmailPage.js /
// HomePage.js / JukuseiPage.js / KeiryoMasterPage.js /
// MasterMenuPage.js / ReportPage.js
isEnglish() {
  return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
},
```

さらに `KoshiPage.js` だけは import 済みの関数をわざわざメソッドでラップしている：

```js
// KoshiPage.js（L168〜170）
isEnglish() {
  return isEnglish();  // utils の isEnglish を呼ぶだけ
},
```

### 3つのパターンが混在している

| パターン | ファイル例 | 問題 |
|---|---|---|
| ①直接 `require` して関数として呼ぶ | `AccountPage`, `StaffPage`, `BranchPage` 等 | ✅ 正しい |
| ②`require` してメソッドでラップ | `KoshiPage` | ⚠ 冗長（ラッパー不要） |
| ③`require` なしでインライン実装 | `CalendarPage`, `HelpPage` 等 | ❌ 重複・変更時に漏れる |

パターン①の使い方（正しい例）：

```js
// AccountPage.js（navigateToRegisterPage 内）
const { fillTextFields, submitTframeFormAndVerify, isEnglish } = require('../../../support/utils');

navigateToRegisterPage() {
  if (process.env.USE_MENU_NAV === 'true') {
    I.click(`a:has-text("${isEnglish() ? 'Master' : 'マスター'}")`);  // 直接呼ぶ
    ...
  }
},
```

### どう直すか

パターン③（インライン）は `utils` から `require` して直接呼ぶように変更する。  
パターン②（ラッパーメソッド）は `isEnglish()` メソッドごと削除し、関数をそのまま呼ぶ。

**CalendarPage.js の修正例（パターン③→①）**

```js
// Before
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');
// isEnglish を require していない

module.exports = {
  ...
  calendarIconLocator() {
    return this.isEnglish() ? this.locators.calendarIconEn : this.locators.calendarIconJa;
  },
  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },
  ...createMenuNavigationMixin('tframe_calendar'),
};

// After
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');
const { isEnglish } = require('../../../support/utils');  // ← 追加

module.exports = {
  ...
  calendarIconLocator() {
    return isEnglish() ? this.locators.calendarIconEn : this.locators.calendarIconJa;
    // this.isEnglish() → isEnglish() に変更
  },
  // isEnglish() メソッド定義を丸ごと削除
  ...createMenuNavigationMixin('tframe_calendar'),
};
```

**KoshiPage.js の修正例（パターン②→①）**

```js
// Before
const { fillTextFields, submitTframeFormAndVerify, isEnglish } = require('../../../support/utils');
// ↑ isEnglish は import 済み

isEnglish() {
  return isEnglish();  // 不要なラッパー
},
teacherIconLocator() {
  return this.isEnglish() ? ...  // メソッド経由
},

// After（ラッパーメソッド削除、呼び出し箇所を直接呼びに変更）
teacherIconLocator() {
  return isEnglish() ? ...  // 直接呼ぶ
},
// isEnglish() メソッド定義を削除
```

### 実装チェックリスト

- [ ] パターン③の8ファイルに `const { isEnglish } = require('../../../support/utils')` を追加
- [ ] 各ファイルの `isEnglish()` メソッド定義を削除
- [ ] `this.isEnglish()` → `isEnglish()` に置き換え
- [ ] KoshiPage の `isEnglish()` ラッパーメソッドを削除し `this.isEnglish()` → `isEnglish()` に変更

---

## 4. scrollToHref / clickLinkByHref の二重定義

### 何が起きているか

これは**バグに近い問題**。CalendarPage / HomePage / KoshiPage / JukuseiPage の4ファイルで、
`scrollToHref` と `clickLinkByHref` が**独自定義されているのに、Mixin で上書きされて一度も呼ばれない**状態になっている。

### JavaScript のオブジェクトスプレッドの仕組みを理解する

JS のオブジェクトリテラルでは、**同じキーが複数あると後から書いたほうが勝つ**。

```js
const obj = {
  foo() { return 'A'; },  // ← 先に定義
  ...{ foo() { return 'B'; } },  // ← 後からスプレッド
};
obj.foo(); // → 'B'（Aは完全に上書きされて消える）
```

CalendarPage.js はこの構造になっている：

```js
module.exports = {
  // ...

  // 独自定義（L28〜55）
  scrollToHref(href) { /* 独自実装 */ },
  clickLinkByHref(href) { /* 独自実装 */ },

  isEnglish() { /* ... */ },

  // ← ここでスプレッド（後から展開されるので独自定義を上書きする）
  ...createMenuNavigationMixin('tframe_calendar'),
  //                            ↑ Mixin にも scrollToHref と clickLinkByHref がある
};
```

**結果**: CalendarPage に書かれた `scrollToHref` と `clickLinkByHref` は、
Mixin の同名メソッドに完全に上書きされ、**一度も実行されることなく存在している**。

### 実際のコードで確認する

**CalendarPage の独自定義（L28〜55、死んでいるコード）**

```js
scrollToHref(href) {
  I.executeScript(
    ({ targetHref }) => {
      const target = document.querySelector(`a[href="${targetHref}"]`);
      if (!target) return false;
      target.scrollIntoView({ block: 'center', inline: 'nearest' });
      return true;
    },
    { targetHref: href }
  );
},
clickLinkByHref(href) {
  I.executeScript(
    ({ targetHref }) => {
      const target = document.querySelector(`a[href="${targetHref}"]`);
      if (!target) { throw new Error(`link not found: ${targetHref}`); }
      target.click();
    },
    { targetHref: href }
  );
},
```

**MenuNavigationMixin の同名定義（L80〜107、こちらが実際に動く）**

```js
scrollToHref(href) {
  I.executeScript(  // ← 完全に同じコード
    ...
  );
},
clickLinkByHref(href) {
  I.executeScript(  // ← 完全に同じコード
    ...
  );
},
```

中身まで同じなので動作に問題はないが、**コードが2か所にあることで混乱を招く**。

### KoshiPage / JukuseiPage の特殊事情

KoshiPage と JukuseiPage には `scrollMenuToTexts` / `clickLinkByTexts` / `grabHrefByTexts` という
**Mixin にない独自メソッド**も定義されている（`altName` フォールバック対応のため）。  
しかし `verifyMenuNavigation` / `clickMenuItemAndVerify` も独自定義されており、
Mixin に上書きされる。

```
KoshiPage が定義するメソッド（Mixin スプレッド前）:
  verifyMenuNavigation  ← Mixin が上書き → 独自版は死ぬ
  clickMenuItemAndVerify ← Mixin が上書き → 独自版は死ぬ（altName 対応版）
  scrollToHref          ← Mixin が上書き → 独自版は死ぬ
  scrollMenuToTexts     ← Mixin にない → 生きているが、呼ばれない
  clickLinkByHref       ← Mixin が上書き → 独自版は死ぬ
  clickLinkByTexts      ← Mixin にない → 生きているが、呼ばれない
  grabHrefByTexts       ← Mixin にない → 生きているが、呼ばれない
```

### どう直すか

**CalendarPage / HomePage（シンプルなケース）**

独自定義の `scrollToHref` / `clickLinkByHref` を丸ごと削除するだけでよい。
Mixin が同じ実装を提供しているため、動作は変わらない。

```js
// Before: CalendarPage.js
module.exports = {
  locators: { ... },
  clickCalendarIcon() { ... },
  scrollToHref(href) { ... },     // ← 削除
  clickLinkByHref(href) { ... },  // ← 削除
  calendarIconLocator() { ... },
  isEnglish() { ... },
  ...createMenuNavigationMixin('tframe_calendar'),
};

// After
module.exports = {
  locators: { ... },
  clickCalendarIcon() { ... },
  // scrollToHref, clickLinkByHref はなし（Mixin が提供する）
  calendarIconLocator() { ... },
  // isEnglish() も削除（issue 3 と合わせて対応）
  ...createMenuNavigationMixin('tframe_calendar'),
};
```

**KoshiPage / JukuseiPage（複雑なケース）**

`altName` に対応した独自メソッドがあるが、`sideMenus.js` を確認すると
`teacher` / `student` のすべての項目に `href` が設定されており `altName` を使う項目はない。  
つまり `altName` フォールバック機能は**現状では不要**。

選択肢は2つ：

| 方針 | 内容 |
|---|---|
| A（推奨）| `altName` 対応メソッドをすべて削除。Mixin に完全委譲。 |
| B | `altName` が必要な項目が将来できることを見越して Mixin 自体を拡張する。 |

現状では方針Aが安全。将来必要になれば Mixin を拡張すればよい。

### 実装チェックリスト

- [ ] CalendarPage.js: `scrollToHref` / `clickLinkByHref` を削除
- [ ] HomePage.js: 同上
- [ ] KoshiPage.js: `verifyMenuNavigation` / `clickMenuItemAndVerify` / `scrollToHref` / `scrollMenuToTexts` / `clickLinkByHref` / `clickLinkByTexts` / `grabHrefByTexts` / `assertCurrentUrlMatches` を削除
- [ ] JukuseiPage.js: 同上
- [ ] 削除後にテストを実行して動作確認（`npm run test_t` の check/dropdown_check, check/lang_check）

---

## 作業の進め方（推奨順序）

```
Step 1: isEnglish() の統一（#3）
   → 1ファイルずつ独立して対応できる。影響範囲が局所的で確認しやすい。

Step 2: scrollToHref / clickLinkByHref の削除（#4）
   → dead code の削除なので動作変化なし。テストで即確認できる。

Step 3: IchiranMixin の作成（#1）
   → 新ファイルを作って12ファイルを一括置き換え。テスト実行で確認。

Step 4: fillAddressInfo / fillMemoInfo の共通化（#2）
   → utils.js に追加 → 各ファイルを置き換え。最後に全登録テストを実行。
```

各ステップ後に `npm run test_t` でテストが通ることを確認してからコミットすること。
