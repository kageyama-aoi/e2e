# リファクタリング詳細解説 — #3 isEnglish / #4 デッドコード

> **このドキュメントの目的**  
> 実装を安心して依頼できるように、JavaScript の基礎から順番に積み上げて解説する。  
> 「なぜそうなるのか」を理解してから手を動かすためのガイドブック。

---

## 目次

- [#3 isEnglish() のインライン再実装](#3-isenglish-のインライン再実装)
- [#4 scrollToHref / clickLinkByHref のデッドコード](#4-scrolltohref--clicklinkbyhref-のデッドコード)

---

## #3 isEnglish() のインライン再実装

### 最初に: この問題を一言で言うと

> **すでに1か所に書いてある関数を、別のファイルで同じ内容のまま書き直している。**

---

### ステップ 1: JavaScript の `require` と `module.exports` とは

Node.js（このプロジェクトで使っている JavaScript 実行環境）では、
ファイル間でコードを共有するために `require` と `module.exports` を使う。

**イメージ: 道具箱とその使い方**

```
support/utils.js           ← 道具箱（ここに道具をまとめて入れる）
   ↓ module.exports に入れる
pages/tframe/screens/*.js  ← 各ファイルが require で取り出して使う
```

**実際のコード（support/utils.js の末尾）**

```js
// support/utils.js の末尾
module.exports = {
  fillTextFields,        // 道具1
  submitTframeFormAndVerify,  // 道具2
  isEnglish,             // 道具3 ← これが今回の主役
  // ...他の関数
};
```

`module.exports` に書かれたものは、他のファイルが `require` で取り出せる。

---

### ステップ 2: `isEnglish` はどこに定義されているか

`support/utils.js` に以下のように書かれている：

```js
// support/utils.js
function isEnglish() {
  return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
}
```

**この関数が何をするか:**

| 環境変数 `TFRAME_LANGUAGE` の値 | 戻り値 |
|---|---|
| `'en'` または `'EN'` | `true`（英語） |
| `'ja'`（または未設定） | `false`（日本語） |

この関数は `module.exports` に含まれているため、どのファイルからでも `require` で取り出して使える。

---

### ステップ 3: `require` の分割代入とは

```js
const { isEnglish } = require('../../../support/utils');
```

これは以下と同じ意味：

```js
const _utils = require('../../../support/utils');
const isEnglish = _utils.isEnglish;  // utils の道具箱から isEnglish だけ取り出す
```

`{ isEnglish }` のように `{}` で囲んで require するのを「分割代入」と呼ぶ。  
複数取り出したい場合はカンマ区切りで書く：

```js
const { fillTextFields, submitTframeFormAndVerify, isEnglish } = require('../../../support/utils');
//      ↑取り出す道具をカンマで並べる
```

---

### ステップ 4: 「関数」と「メソッド」の違い

これが #3 を理解するうえで最も重要なポイント。

| 区別 | 書き方 | 呼び方 |
|---|---|---|
| **関数**（module レベル） | `function isEnglish() { ... }` | `isEnglish()` |
| **メソッド**（オブジェクトのプロパティ） | `isEnglish() { ... }` をオブジェクト内に書く | `this.isEnglish()` |

**関数の例**（ファイルの先頭付近で `require` したもの）：

```js
const { isEnglish } = require('../../../support/utils');
// ↑ isEnglish は「関数」として取り出した

// 呼び出し: this なし
I.click(`a:has-text("${isEnglish() ? 'Master' : 'マスター'}")`);
```

**メソッドの例**（`module.exports = { ... }` の中に書いたもの）：

```js
module.exports = {
  isEnglish() {   // ← これはオブジェクトの「メソッド」
    return ...;
  },
  calendarIconLocator() {
    return this.isEnglish() ? ...  // ← this.isEnglish() と書かないと呼べない
  },
};
```

`this` は「自分自身のオブジェクト（= module.exports の中身）」を指す。  
メソッドとして定義したものを呼ぶには `this.` が必要。  
`require` で取り出した関数を呼ぶには `this.` は不要。

---

### ステップ 5: 3つのパターン — 全部比べてみる

このプロジェクトの Page Object には `isEnglish` の使い方が **3パターン混在** している。

---

#### パターン① 正しい（AccountPage / StaffPage / BranchPage 等）

```js
// ファイル先頭
const { fillTextFields, submitTframeFormAndVerify, isEnglish } = require('../../../support/utils');
//                                                  ↑ require で取り出す

// 使う場所
navigateToRegisterPage() {
  if (process.env.USE_MENU_NAV === 'true') {
    I.click(`a:has-text("${isEnglish() ? 'Master' : 'マスター'}")`);
    //                     ↑ this. なし。関数として直接呼ぶ
  }
}
```

**ポイント:**
- `require` で `isEnglish` を取り出している
- `module.exports = { ... }` の中に `isEnglish()` メソッドを定義していない
- 使う場所では `isEnglish()` と書くだけ（`this.` 不要）

---

#### パターン② 冗長（KoshiPage のみ）

```js
// ファイル先頭
const { fillTextFields, submitTframeFormAndVerify, isEnglish } = require('../../../support/utils');
//                                                  ↑ require で取り出している

// module.exports の中（KoshiPage.js L168〜170）
module.exports = {
  // ...
  isEnglish() {           // ← utils の isEnglish を「ラップ」するメソッドを定義
    return isEnglish();   // ← 中身は require した関数をそのまま呼ぶだけ
  },
  teacherIconLocator() {
    return this.isEnglish() ? ...  // ← this 経由で呼ぶ
  },
};
```

**何が問題か:**  
`isEnglish()` をメソッドとして定義しなくても、`require` した関数を直接呼べば済む。  
「取り出した道具をもう一個の道具箱に入れ直して、そっちから使う」という余計な手順を踏んでいる。

---

#### パターン③ 間違い（CalendarPage / HelpPage 等 8ファイル）

```js
// ファイル先頭
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');
// ↑ isEnglish を require していない！

// module.exports の中（CalendarPage.js L69〜71）
module.exports = {
  // ...
  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
    // ↑ utils.js にある関数と全く同じロジックを「コピペして手書き」している
  },
  calendarIconLocator() {
    return this.isEnglish() ? ...  // ← this 経由で呼ぶ
  },
};
```

**何が問題か:**

1. `support/utils.js` の `isEnglish` と**完全に同じコード**が 8か所に分散している
2. 将来「英語判定のロジックを変えたい」となったとき、`utils.js` だけ直しても**8ファイルは古いまま**になる（変更漏れ）
3. そのバグはすぐには気づかない（動作上は同じ結果なので）

---

### ステップ 6: CalendarPage を例に修正の手順を追う

**修正対象ファイル:** `pages/tframe/screens/CalendarPage.js`

**現在の状態（修正前）:**

```js
// ① require している内容（L5〜6）
const { I } = inject();
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');
// isEnglish を require していない

// ② module.exports の中（L8〜74）
module.exports = {
  locators: {
    calendarIconJa: 'a:has-text("カレンダー")',
    calendarIconEn: 'a:has-text("Calendar")',
  },

  clickCalendarIcon() { ... },

  // （#4 で解説する scrollToHref / clickLinkByHref はいったん無視）

  calendarIconLocator() {
    return this.isEnglish()                  // ← this.isEnglish() を呼んでいる
      ? this.locators.calendarIconEn
      : this.locators.calendarIconJa;
  },

  isEnglish() {                              // ← インライン定義（問題の箇所）
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },

  ...createMenuNavigationMixin('tframe_calendar'),
};
```

---

**修正 手順 1: ファイル先頭の require に `isEnglish` を追加する**

```js
// Before（L5〜6）
const { I } = inject();
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');

// After
const { I } = inject();
const { isEnglish } = require('../../../support/utils');  // ← 追加
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');
```

---

**修正 手順 2: `calendarIconLocator` の呼び出しを `this.isEnglish()` → `isEnglish()` に変更する**

```js
// Before
calendarIconLocator() {
  return this.isEnglish() ? this.locators.calendarIconEn : this.locators.calendarIconJa;
},

// After
calendarIconLocator() {
  return isEnglish() ? this.locators.calendarIconEn : this.locators.calendarIconJa;
  //     ↑ this. を外す（require した関数を直接呼ぶ）
  //                           ↑ this.locators は残す（自分のオブジェクトのプロパティへのアクセスなので）
},
```

> **注意:** `this.` を外すのは `isEnglish()` の呼び出しだけ。  
> `this.locators.calendarIconEn` は module.exports 内のプロパティなので `this.` は残す。

---

**修正 手順 3: `isEnglish()` メソッド定義を丸ごと削除する**

```js
// この7行をまるごと削除する
isEnglish() {
  return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
},
```

---

**修正後の完成形（CalendarPage.js）:**

```js
const { I } = inject();
const { isEnglish } = require('../../../support/utils');  // ← 追加
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');

module.exports = {
  locators: {
    calendarIconJa: 'a:has-text("カレンダー")',
    calendarIconEn: 'a:has-text("Calendar")',
  },

  clickCalendarIcon() {
    I.say('【メインメニュー】カレンダーアイコンをクリック');
    I.waitForElement(this.calendarIconLocator(), 10);
    I.click(this.calendarIconLocator());
  },

  // （scrollToHref / clickLinkByHref は #4 で削除する）

  calendarIconLocator() {
    return isEnglish() ? this.locators.calendarIconEn : this.locators.calendarIconJa;
    //     ↑ this. なし
  },

  // isEnglish() メソッドは削除

  ...createMenuNavigationMixin('tframe_calendar'),
};
```

---

### ステップ 7: KoshiPage（パターン②）の修正手順

KoshiPage は少し違う状況。`require` はしているがラッパーメソッドが余計に存在する。

**修正 手順 1: `isEnglish()` ラッパーメソッドを削除する（KoshiPage.js L168〜170）**

```js
// 削除する箇所
isEnglish() {
  return isEnglish();  // require した関数をそのまま返しているだけ
},
```

**修正 手順 2: `teacherIconLocator` の呼び出しを変更する**

```js
// Before（KoshiPage.js L161〜163）
teacherIconLocator() {
  return this.isEnglish() ? this.locators.teacherIconEn : this.locators.teacherIconJa;
},

// After
teacherIconLocator() {
  return isEnglish() ? this.locators.teacherIconEn : this.locators.teacherIconJa;
},
```

---

### ステップ 8: #3 の実装チェックリスト

```
□ CalendarPage.js
    □ require に { isEnglish } を追加
    □ isEnglish() メソッド定義を削除（7行）
    □ calendarIconLocator: this.isEnglish() → isEnglish() に変更

□ HelpPage.js         （同上パターン）
□ CoursePage.js       （同上パターン）
□ EmailPage.js        （同上パターン）
□ HomePage.js         （同上パターン）
□ JukuseiPage.js      （同上パターン）
□ KeiryoMasterPage.js （同上パターン）
□ MasterMenuPage.js   （同上パターン）
□ ReportPage.js       （同上パターン）

□ KoshiPage.js
    □ isEnglish() ラッパーメソッドを削除（3行）
    □ this.isEnglish() → isEnglish() に変更（呼び出し箇所を grep で確認）
```

---

## #4 scrollToHref / clickLinkByHref のデッドコード

### 最初に: この問題を一言で言うと

> **「メソッドを書いたつもりが、後で同名のメソッドに上書きされて一度も実行されない状態になっている。」**

---

### ステップ 1: JavaScript のオブジェクトリテラルとは

JavaScript のオブジェクトは `{ }` の中に「キー: 値」のペアを並べたもの。

```js
const car = {
  color: 'red',   // キー: color, 値: 'red'
  speed: 100,     // キー: speed, 値: 100
  drive() {       // キー: drive, 値: 関数（メソッド）
    return 'vroom';
  },
};
```

**大事なルール: 同じキーが複数あったら、後から書いたほうが勝つ**

```js
const car = {
  color: 'red',   // ← 先に書く
  color: 'blue',  // ← 後から書く → 'red' は消えて 'blue' が残る
};
console.log(car.color); // → 'blue'
```

---

### ステップ 2: スプレッド演算子（`...`）とは

`...` は「別のオブジェクトの中身をここに展開して混ぜ込む」演算子。

```js
const extra = { x: 10, y: 20 };

const point = {
  label: 'A',
  ...extra,    // ← extra の中身（x と y）をここに展開する
};

// 結果: { label: 'A', x: 10, y: 20 }
```

**スプレッドにも「後から書いたキーが勝つ」ルールが適用される：**

```js
const obj = {
  foo() { return 'A'; },        // ← 先に定義
  ...{ foo() { return 'B'; } }, // ← 後からスプレッド（同名キー = foo を上書き）
};

obj.foo(); // → 'B' （'A' を定義した行は完全に無効になる）
```

---

### ステップ 3: `createMenuNavigationMixin` が返すものを確認する

`MenuNavigationMixin.js` は **関数** で、呼び出すとオブジェクトを返す。

```js
// MenuNavigationMixin.js（簡略版）
function createMenuNavigationMixin(prefix) {
  return {                      // ← オブジェクトを返す
    verifyMenuNavigation() { ... },
    clickMenuItemAndVerify() { ... },
    scrollToHref(href) { ... }, // ← ここに scrollToHref がある
    clickLinkByHref(href) { ... }, // ← ここに clickLinkByHref がある
    // ...他にも多数のメソッド
  };
}
```

つまり `...createMenuNavigationMixin('tframe_calendar')` は、
「この関数を呼んで返ってきたオブジェクトを展開して混ぜ込む」という意味。

---

### ステップ 4: CalendarPage で何が起きているかを順番に追う

`CalendarPage.js` の `module.exports = { ... }` を上から順に見ていく。

```js
module.exports = {
  // --- ❶ まず locators が定義される ---
  locators: {
    calendarIconJa: 'a:has-text("カレンダー")',
    calendarIconEn: 'a:has-text("Calendar")',
  },

  // --- ❷ clickCalendarIcon が定義される ---
  clickCalendarIcon() { ... },

  // --- ❸ scrollToHref が定義される（L28〜38）---
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

  // --- ❹ clickLinkByHref が定義される（L44〜55）---
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

  // --- ❺ calendarIconLocator が定義される ---
  calendarIconLocator() { ... },

  // --- ❻ isEnglish が定義される ---
  isEnglish() { ... },

  // --- ❼ Mixin のスプレッド（L73）---
  ...createMenuNavigationMixin('tframe_calendar'),
  //  ↑ ここで Mixin が展開される。
  //    Mixin には scrollToHref と clickLinkByHref も含まれている。
  //    → ❸と❹で定義したものが、Mixin の同名メソッドに上書きされる。
};
```

**結果の図:**

```
キー名              定義元             状態
──────────────────────────────────────────────────────
locators           CalendarPage       ✅ 生きている（Mixin に同名キーなし）
clickCalendarIcon  CalendarPage       ✅ 生きている（Mixin に同名キーなし）
scrollToHref       CalendarPage ❸     ⬛ 上書きされる
scrollToHref       Mixin ❼           ✅ こちらが最終的に残る
clickLinkByHref    CalendarPage ❹     ⬛ 上書きされる
clickLinkByHref    Mixin ❼           ✅ こちらが最終的に残る
calendarIconLocator CalendarPage      ✅ 生きている（Mixin に同名キーなし）
isEnglish          CalendarPage ❻     ⬛ 上書きされる（Mixin にも isEnglish なし… が、#3 で削除する）
verifyMenuNavigation Mixin ❼         ✅ Mixin から来る
clickMenuItemAndVerify Mixin ❼       ✅ Mixin から来る
（他多数）          Mixin ❼           ✅ Mixin から来る
```

CalendarPage に書かれた `scrollToHref`（❸）と `clickLinkByHref`（❹）は、
実行時には **Mixin の版（❼）** が使われる。CalendarPage の版は存在しているのに呼ばれることがない。  
これを「デッドコード（死んだコード）」と呼ぶ。

---

### ステップ 5: 「動作に問題はない」のになぜ直すのか

CalendarPage の独自定義と Mixin の定義を比べると、**内容が完全に同じ**。

```js
// CalendarPage の scrollToHref（死んでいる）
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

// MenuNavigationMixin の scrollToHref（実際に動く）
scrollToHref(href) {  // ← 全く同じコード
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
```

中身が同じなので動作は変わらない。しかし次のような問題がある：

1. **読み手が混乱する**: 「CalendarPage に scrollToHref があるならこっちが使われているのかな？」と思ってしまう
2. **将来の修正で事故を起こす**: Mixin の scrollToHref を修正したとき、「CalendarPage の版も直さないと」と思い込んで二重に作業したり、逆に「CalendarPage の版だけ直してMixinを忘れる」ことが起きる
3. **コードレビューで「なんでこれがあるの？」と毎回質問される**

---

### ステップ 6: CalendarPage の修正手順（シンプルなケース）

このファイルの修正は**削除するだけ**。Mixin が同じものを提供しているので、動作は変わらない。

**削除する箇所（CalendarPage.js）:**

```js
// ↓ この scrollToHref（L28〜38）を丸ごと削除
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

// ↓ この clickLinkByHref（L44〜55）を丸ごと削除
clickLinkByHref(href) {
  I.executeScript(
    ({ targetHref }) => {
      const target = document.querySelector(`a[href="${targetHref}"]`);
      if (!target) {
        throw new Error(`link not found: ${targetHref}`);
      }
      target.click();
    },
    { targetHref: href }
  );
},
```

**削除後の CalendarPage.js（#3 の修正込み）:**

```js
const { I } = inject();
const { isEnglish } = require('../../../support/utils');
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');

module.exports = {
  locators: {
    calendarIconJa: 'a:has-text("カレンダー")',
    calendarIconEn: 'a:has-text("Calendar")',
  },

  clickCalendarIcon() {
    I.say('【メインメニュー】カレンダーアイコンをクリック');
    I.waitForElement(this.calendarIconLocator(), 10);
    I.click(this.calendarIconLocator());
  },

  calendarIconLocator() {
    return isEnglish() ? this.locators.calendarIconEn : this.locators.calendarIconJa;
  },

  ...createMenuNavigationMixin('tframe_calendar'),
};
```

すっきりした。`scrollToHref` も `clickLinkByHref` も書いていないが、
Mixin がこれらを提供するので問題なく動く。

---

### ステップ 7: KoshiPage（複雑なケース）の状況を把握する

KoshiPage は CalendarPage より複雑。現状の `module.exports` に入っているメソッドを全部並べると：

```
KoshiPage.js の module.exports（スプレッド前）に定義されているメソッド:
  ──────────────────────────────────────────────
  locators               ← Mixin に同名なし → 生きている
  clickKoshiIcon         ← Mixin に同名なし → 生きている
  verifyMenuNavigation   ← Mixin に同名あり → 死んでいる（Mixin に上書き）
  clickMenuItemAndVerify ← Mixin に同名あり → 死んでいる（Mixin に上書き）
  scrollToHref           ← Mixin に同名あり → 死んでいる（Mixin に上書き）
  scrollMenuToTexts      ← Mixin に同名なし → 生きている？（でも呼ばれない）
  clickLinkByHref        ← Mixin に同名あり → 死んでいる（Mixin に上書き）
  clickLinkByTexts       ← Mixin に同名なし → 生きている？（でも呼ばれない）
  grabHrefByTexts        ← Mixin に同名なし → 生きている？（でも呼ばれない）
  isEnglish              ← #3 で削除する
  teacherIconLocator     ← Mixin に同名なし → 生きている
  navigateToRegisterPage ← Mixin に同名なし → 生きている
  fillRegistrationForm   ← Mixin に同名なし → 生きている
  （以下省略）
  navigateToListPage     ← Mixin に同名なし → 生きている
  fillSearchConditions   ← Mixin に同名なし → 生きている
  ...createIchiranMixin  ← #1 で追加済み
  ...createMenuNavigationMixin ← ここでスプレッド（いくつかを上書き）
  navigateToTeByStudentListPage ← Mixin に同名なし → 生きている
  fillTeByStudentSearchConditions ← Mixin に同名なし → 生きている
```

---

### ステップ 8: KoshiPage 独自メソッドの `altName` とは何か

KoshiPage には `scrollMenuToTexts` / `clickLinkByTexts` / `grabHrefByTexts` という
**Mixin にはないメソッド**が3つある。これらは `altName`（別名）対応のために書かれた。

**Mixin の `clickMenuItemAndVerify` が `altName` を受け付けるかどうか:**

```js
// MenuNavigationMixin.js（現在の実装）
async clickMenuItemAndVerify(item) {
  if (!item.href) {              // ← href がなければスキップ
    I.say(`【スキップ】${item.name} (href 未設定)`);
    return;
  }
  // href を使って操作する（altName を参照しない）
}
```

Mixin は `altName` を使わない。`href` が必須。

**KoshiPage 独自版の `clickMenuItemAndVerify` が `altName` を使う理由:**

```js
// KoshiPage.js（独自版、Mixin に上書きされて死んでいる）
async clickMenuItemAndVerify(item) {
  const resolvedHref = item.href || await this.grabHrefByTexts([item.name, item.altName].filter(Boolean));
  //                              ↑ href がなければ altName も使ってリンクを探す
}
```

`href` がない項目があるときのフォールバックとして `altName` を使う設計。

**現在の `sideMenus.js`（講師メニュー定義）を確認すると:**

すべての講師メニュー項目に `href` が設定されている。
つまり「`href` がない → `altName` で探す」というルートは今は通らない。

**結論:** `scrollMenuToTexts` / `clickLinkByTexts` / `grabHrefByTexts` は
現状では呼ばれることがない。削除しても動作は変わらない。

---

### ステップ 9: KoshiPage の修正手順

削除するメソッドと残すメソッドを整理する。

**削除する（Mixin が上書きするか、呼ばれないもの）:**

```
verifyMenuNavigation    → Mixin の版が動く（削除OK）
clickMenuItemAndVerify  → Mixin の版が動く（削除OK）
scrollToHref            → Mixin の版が動く（削除OK）
scrollMenuToTexts       → 現状は呼ばれない（削除OK）
clickLinkByHref         → Mixin の版が動く（削除OK）
clickLinkByTexts        → 現状は呼ばれない（削除OK）
grabHrefByTexts         → 現状は呼ばれない（削除OK）
```

**残す（固有の役割があるもの）:**

```
locators                → 残す（KoshiPage 固有のアイコンロケーター）
clickKoshiIcon          → 残す（KoshiPage 固有のアイコンクリック）
teacherIconLocator      → 残す（KoshiPage 固有のロケーター返却）
isEnglish               → 削除（#3 の対応）
navigateToRegisterPage  → 残す
fillRegistrationForm    → 残す
（その他フォーム入力系）→ 残す
navigateToListPage      → 残す
fillSearchConditions    → 残す
...createIchiranMixin   → 残す（#1 で追加済み）
navigateToTeByStudentListPage → 残す
fillTeByStudentSearchConditions → 残す
...createMenuNavigationMixin  → 残す（必須）
```

---

### ステップ 10: #4 の実装チェックリスト

```
□ CalendarPage.js
    □ scrollToHref（L28〜38）を削除
    □ clickLinkByHref（L44〜55）を削除

□ HomePage.js
    □ scrollToHref を削除
    □ clickLinkByHref を削除

□ KoshiPage.js
    □ verifyMenuNavigation を削除
    □ clickMenuItemAndVerify を削除
    □ scrollToHref を削除
    □ scrollMenuToTexts を削除
    □ clickLinkByHref を削除
    □ clickLinkByTexts を削除
    □ grabHrefByTexts を削除

□ JukuseiPage.js（KoshiPage と同様のケースか確認してから削除）
    □ 削除対象メソッドを grep で確認
    □ 各メソッドを削除
```

---

### ステップ 11: 削除後の動作確認

#4 の修正は「Mixin と全く同じコードを削除するだけ」なので動作は変わらない。  
念のため修正後に以下のテストを実行して確認する：

```powershell
# lang_check テスト（メニューナビゲーションを使うテスト）
npx codeceptjs run tests/tframe/check/lang_check_test.js --steps

# または
npx codeceptjs run tests/tframe/check/dropdown_check_test.js --steps
```

テストが通れば修正完了。

---

## 全体のまとめ

| 問題 | 原因 | 修正内容 | 難易度 |
|---|---|---|---|
| **#3** isEnglish インライン実装 | `require` せずに同じコードを手書き | require 追加 + メソッド削除 + `this.` 除去 | ★☆☆ |
| **#4** デッドコード | スプレッドで上書きされると知らずに定義 | 死んでいるメソッドをまるごと削除 | ★☆☆ |

**推奨作業順序:**

```
1. #3 の修正（各ファイルを1つずつ）
   → require 追加 → isEnglish() メソッド削除 → this.isEnglish() 呼び出し箇所修正

2. #4 の修正（CalendarPage / HomePage は簡単、KoshiPage / JukuseiPage は要確認）
   → デッドコードをまるごと削除

3. テスト実行（lang_check / dropdown_check）で確認
```

両方とも「コードを削除する」作業がメイン。追加するコードは少ない。  
削除することで動作が変わるリスクはほぼなく、テストを実行すれば即座に確認できる。
