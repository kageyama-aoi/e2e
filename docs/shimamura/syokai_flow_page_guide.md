# SyokaiFlowPage.js 学習ガイド
**対象**: IT新人 / E2Eテスト初学者  
**目標**: `SyokaiFlowPage.js` を自分で読み書きできるようになる

---

## このファイルは何をするもの？

`SyokaiFlowPage.js` は「受講生登録〜経理処理」の**画面操作手順書**です。

テストファイル (`syokai_touroku_test.js`) が「何をテストするか」を書くのに対して、  
このファイルは「どうやって画面を操作するか」を書いています。

```
syokai_touroku_test.js         ← 「何をテストするか」（司令塔）
  └─ SyokaiFlowPage.js         ← 「どう操作するか」（現場作業員）
       └─ syokai_helpers.js    ← 「データをどう計算するか」（計算係）
```

---

## Level 1：JavaScriptの基本を押さえる

### 1-1. `require` — 道具を借りてくる

```js
const { logScreenUrl } = require('../../support/utils');
```

`require` は「他のファイルから機能を借りてくる」命令です。

| 書き方 | 意味 |
|---|---|
| `require('./foo')` | 同じフォルダの foo.js から借りる |
| `require('../../support/utils')` | 2つ上のフォルダの support/utils.js から借りる |
| `const { A, B } = require(...)` | A と B だけ取り出す（分割代入） |

**練習**: 以下の `require` はどこのファイルから何を借りていますか？
```js
const { TIMEOUTS } = require('../../support/shimamura/constants');
```
→ `support/shimamura/constants.js` から `TIMEOUTS` を借りている

---

### 1-2. `async` / `await` — 待ってから次へ進む

ブラウザ操作は「時間がかかる処理」です。ページが開くまで待ったり、ボタンが現れるまで待つ必要があります。

```js
// ❌ 待たない（壊れる）
function badExample() {
  I.click('検索');
  const text = I.grabTextFrom('.result'); // まだ結果が表示されていない！
}

// ✅ 待つ（正しい）
async function goodExample() {
  I.click('検索');
  const text = await I.grabTextFrom('.result'); // 結果が来るまで待つ
}
```

**ルール**:
- 値を返す操作（`grab系`）の前には `await` を付ける
- 関数に `async` を付けると、その中で `await` が使えるようになる

---

### 1-3. `module.exports` — 外に公開する

```js
module.exports = {
  runRegistrationFlow,
  ShouldBeOnKeirisyoriScreenE,
  ShouldBeOnTaikai
};
```

`module.exports` に書いたものだけが、他のファイルから `require` で使えます。  
書いていない関数はこのファイルの中だけで使えるプライベートな関数です。

```
公開（module.exports に書く）→ テストファイルから呼べる
非公開（書かない）          → このファイルの中だけで使う
```

---

## Level 2：CodeceptJS の書き方を覚える

### 2-1. `I` とは何か

`I` は CodeceptJS の「操作オブジェクト」です。ブラウザへの命令はすべて `I.xxx()` で書きます。

```js
I.click('ボタン名');              // クリック
I.fillField('フィールド名', '値'); // 文字を入力
I.waitForElement('#id', 10);      // 要素が出るまで最大10秒待つ
I.see('テキスト');                // テキストが画面にあることを確認
I.say('メッセージ');              // ログに出力（デバッグ用）
```

`grab` 系は値を返すので `await` が必要です：

```js
const text = await I.grabTextFrom('.selector');  // テキストを取得
const count = await I.grabNumberOfVisibleElements('.selector');  // 件数を取得
const url = await I.grabCurrentUrl();  // 現在のURLを取得
```

---

### 2-2. `locate()` — 複雑な要素の指定

単純なセレクタで要素が特定できないとき、`locate()` を使って条件を重ねられます。

```js
// 「body の中に '受講生詳細' というテキストがある要素」を待つ
I.waitForElement(locate('body').withText('受講生詳細'), 30);

// 「.listViewTdLinkS1 クラスを持つ要素」をクリック
I.click(locate('.listViewTdLinkS1'));
```

---

### 2-3. `TIMEOUTS` — 待ち時間の定数

```js
const { TIMEOUTS } = require('../../support/shimamura/constants');

I.waitForElement(locators.pulldown.area, TIMEOUTS.SCREEN);
```

`TIMEOUTS.SCREEN` のように名前で管理することで、「30秒待つ」という数字が何を意味するかがわかりやすくなります。数字を直書きしないのがポイントです。

---

## Level 3：SyokaiFlowPage.js の構造を読む

ファイルは上から順に「小さな部品 → 大きな処理」の順で並んでいます。

```
[定数]         KEIRI_SCREEN_B_LOCATORS  ← 画面のセレクタ一覧
[部品]         fillClassSearchForm      ← 検索フォームへの入力
[部品]         fillAccountingDates      ← 日付入力
[部品]         createActionExecutor     ← 実行プランを動かす仕組み
[画面関数]     ShouldBeOnStudentGroup   ← 候補生検索ページへ遷移
[画面関数]     ShouldBeOnKouhoseiList   ← 候補生を検索して選択
[画面関数]     ShouldBeOnKouhouseiDetail ← 候補生詳細を確認
[画面関数]     ShouldBeOnKeirisyoriScreenA/B/E ← 経理処理の各画面
[画面関数]     ShouldBeOnTaikai         ← 退会処理
[まとめ関数]   runRegistrationFlow      ← 上の画面関数を順番に呼ぶ
[公開]         module.exports           ← 外から使えるものを宣言
```

---

### 3-1. ロケーター定数（セレクタのまとめ）

```js
const KEIRI_SCREEN_B_LOCATORS = {
  textbox: {
    keiyaku_date: '#contract_dateclass_operation',
    kaishi_date:  '#start_dateclass_operation',
    class_name:   '#course_name'
  },
  pulldown: {
    area:             '#AN_1_area_id',
    couse_category:   '#course_category',
    remaining_classes:'#remaining_times'
  },
  button: {
    class_select:    '#course_popup_popup_button',
    label_class_set: 'クラス適用',
    label_tran_set:  '売上計上する'
  },
  error: { container: '#top_err_info_msg_div' }
};
```

セレクタ（`#id` や `.class` などHTML要素の場所を示す文字列）をオブジェクトにまとめています。

**なぜまとめるの？**  
HTML側でIDが変わったとき、この1箇所だけ直せばすべての操作に反映されます。

---

### 3-2. 画面関数の読み方パターン

画面関数はすべて同じパターンで書かれています：

```js
async function ShouldBeOnKouhoseiList(I, last_name) {
  // ① 使うセレクタをまとめる
  const S = {
    field:  { lastName: 'last_name' },
    button: { search: '検索' },
    result: { list: '.listViewTdLinkS1', link: 'a.listViewTdLinkS1' }
  };

  // ② 今何をしているかログに出す
  I.say('【候補生検索】一覧表示＆検索実行');

  // ③ 画面が表示されるまで待つ
  I.waitForElement(locate('body').withText('候補生一覧'), TIMEOUTS.SCREEN);

  // ④ 操作する
  I.fillField(S.field.lastName, last_name);
  I.click(S.button.search);
  I.waitForElement(S.result.list, TIMEOUTS.RESULT);

  // ⑤ ログ（Allure レポート用）
  await logScreenUrl(I, '候補生一覧');

  // ⑥ 値を取得して返す（必要な場合だけ）
  const student_name = await I.grabTextFrom(S.result.link);
  I.click(locate(S.result.list));
  return student_name;
}
```

**読み方のコツ**: `I.say(...)` の日本語を拾うだけで操作の流れがわかります。

---

### 3-3. `runRegistrationFlow` — 全体の流れをまとめる関数

```js
async function runRegistrationFlow(I, classMemberPageShimamura, input) {
  await classMemberPageShimamura.navigateToAdminTab(I, '受講生', '受講生登録');
  await ShouldBeOnStudentGroup(I, classMemberPageShimamura);
  const student_name = await ShouldBeOnKouhoseiList(I, input.lastName);
  await ShouldBeOnKouhouseiDetail(I, student_name);
  await ShouldBeOnKeirisyoriScreenA(I, classMemberPageShimamura);
  await ShouldBeOnKeirisyoriScreenB(I, input);
}
```

「個々の画面操作」を組み合わせて「業務フロー」にしている関数です。  
これを見るだけで「何の順番で画面を操作するか」が一目でわかります。

---

## Level 4：自分で新しい関数を書く

### 4-1. テンプレート

新しい画面用の関数を書くときは、このテンプレートを使いましょう。

```js
/**
 * ○○画面で△△する
 * @param {CodeceptJS.I} I
 * @param {string} paramName - 説明
 */
async function ShouldBeOn○○(I, paramName) {
  // ① セレクタ定義
  const S = {
    field:  { xxx: 'input[name="xxx"]' },
    button: { submit: '保存' },
    screen: { name: '○○画面' }
  };

  // ② ログ
  I.say('【○○】△△する');

  // ③ 画面待ち
  I.waitForElement(locate('body').withText(S.screen.name), TIMEOUTS.SCREEN);

  // ④ 操作
  I.fillField(S.field.xxx, paramName);
  I.click(S.button.submit);

  // ⑤ URLログ
  await logScreenUrl(I, S.screen.name);
}
```

---

### 4-2. チェックリスト（関数を書いたら確認）

- [ ] 関数名が `ShouldBeOn〇〇` または `fill〇〇` / `run〇〇` になっている
- [ ] `async` が付いている
- [ ] セレクタが関数の中の `const S = {...}` にまとまっている
- [ ] `I.say(...)` でログが出る
- [ ] 画面待ち（`waitForElement` / `waitForText`）がある
- [ ] `await` が必要な場所に付いている（`grab系` の前）
- [ ] 外から呼ぶ必要があれば `module.exports` に追加している

---

### 4-3. よくあるミス

```js
// ❌ await 忘れ
const name = I.grabTextFrom('.selector');  // name が Promise になってしまう
console.log(name);  // → [object Promise]

// ✅ 正しい
const name = await I.grabTextFrom('.selector');
console.log(name);  // → "かげやま"
```

```js
// ❌ async を付け忘れた関数で await を使う
function bad(I) {
  const name = await I.grabTextFrom('.selector');  // SyntaxError!
}

// ✅ 正しい
async function good(I) {
  const name = await I.grabTextFrom('.selector');
}
```

```js
// ❌ 呼び出し側で await しない
ShouldBeOnStudentGroup(I, page);  // 完了を待たずに次へ進んでしまう

// ✅ 正しい
await ShouldBeOnStudentGroup(I, page);
```

---

## Level 5：全体をつなげて理解する

テスト実行時のデータの流れを追ってみましょう。

```
【CSV ファイル】
lastName,className,keiyakuDate,...
かげやま,ピアノ水曜日_01_01,2026-04-21,...

        ↓ loadCsvWithProfile()

【csvData（配列）】
[{ lastName: 'かげやま', className: 'ピアノ水曜日_01_01', ... }]

        ↓ Data(csvData).Scenario(...)

【current（シナリオに渡される1行）】
current.lastName    = 'かげやま'
current.className   = 'ピアノ水曜日_01_01'
current.keiyakuDate = '2026-04-21'

        ↓ input = { ... } で詰め替え

【input（SyokaiFlowPage に渡す形）】
input.lastName     = 'かげやま'
input.class_name01 = 'ピアノ水曜日_01_01'  ← キー名を変換
input.keiyaku_date = '2026-04-21'          ← キー名を変換

        ↓ runRegistrationFlow(I, page, input)

【SyokaiFlowPage.js の各関数が input を使って画面を操作】
ShouldBeOnKouhoseiList(I, input.lastName)
  → 「かげやま」で候補生を検索

ShouldBeOnKeirisyoriScreenB(I, input)
  → 「ピアノ水曜日_01_01」のクラスを選択
  → 「2026-04-21」を契約日に入力
```

---

## 参考：ファイルの場所

```
e2e/
├── tests/shimamura/
│   └── syokai_touroku_test.js    ← 「何をテストするか」
├── pages/shimamura/
│   └── SyokaiFlowPage.js         ← 「どう画面を操作するか」（このガイドの対象）
├── support/shimamura/
│   ├── syokai_helpers.js         ← 「データをどう計算するか」
│   ├── utils.js                  ← しまむら共通ユーティリティ
│   └── constants.js              ← TIMEOUTS などの定数
└── data/shimamura/
    └── syokai_touroku_data*.csv  ← テストデータ
```
