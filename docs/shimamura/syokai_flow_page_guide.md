# SyokaiFlowPage.js 学習ガイド
**対象**: IT新人 / E2Eテスト初学者  
**目標**: `SyokaiFlowPage.js` を自分で読み書きできるようになる  
**対応コード**: `pages/shimamura/flow/SyokaiFlowPage.js`（2026-09 時点。関数名が変わったらこのガイドも直す — AGENTS.md ドキュメント連動ルール カテゴリF）

---

## このファイルは何をするもの？

`SyokaiFlowPage.js` は「受講生登録〜経理処理〜退会」の**画面操作手順書**です。

テストファイル (`syokai_touroku_test.js`) が「何をテストするか」を書くのに対して、  
このファイルは「どうやって画面を操作するか」を書いています。

```
syokai_touroku_test.js         ← 「何をテストするか」（司令塔）
  └─ SyokaiFlowPage.js         ← 「どう操作するか」（現場作業員）
       ├─ syokai_helpers.js    ← 「どのステップを実行するか」を計算する（計算係）
       └─ support/shimamura/utils.js ← 入力・検証の共通道具（道具箱）
```

---

## Level 1：JavaScriptの基本を押さえる

### 1-1. `require` — 道具を借りてくる

```js
const { logScreenUrl } = require('../../../support/utils');
```

`require` は「他のファイルから機能を借りてくる」命令です。

| 書き方 | 意味 |
|---|---|
| `require('./foo')` | 同じフォルダの foo.js から借りる |
| `require('../../../support/utils')` | 3つ上のフォルダの support/utils.js から借りる |
| `const { A, B } = require(...)` | A と B だけ取り出す（分割代入） |

**練習**: 以下の `require` はどこのファイルから何を借りていますか？
```js
const { TIMEOUTS, SELECTORS } = require('../../../support/shimamura/constants');
```
→ 3つ上の `support/shimamura/constants.js` から `TIMEOUTS` と `SELECTORS` を借りている

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
  KEIRI_SCREEN_B_LOCATORS,
  runRegistrationFlow,
  openKeirisyoriScreenA,
  fillKeirisyoriScreenB,
  confirmKeirisyoriScreenE,
  executeTaikai,
  fillTaikaiFormAndSubmit,
  resolveUnfinishedKeiriDataIfPresent
};
```

`module.exports` に書いたものだけが、他のファイルから `require` で使えます。  
書いていない関数（`searchAndSelectKouhosei` など）はこのファイルの中だけで使えるプライベートな関数です。

```
公開（module.exports に書く）→ テストファイルや他の FlowPage から呼べる
非公開（書かない）          → このファイルの中だけで使う
```

`openKeirisyoriScreenA` などが公開されているのは、月謝一括作成のセットアップ（`gessya_ikkatu_setup_test.js`）が
「候補生検索は自前で行い、経理ビューの処理だけ借りる」形で再利用しているからです。

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
I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);

// 「.listViewTdLinkS1 クラスを持つ要素」をクリック
I.click(locate(SELECTORS.RESULT_LINK));
```

---

### 2-3. `TIMEOUTS` と `SELECTORS` — 定数で管理する

```js
const { TIMEOUTS, SELECTORS } = require('../../../support/shimamura/constants');

I.waitForElement(locators.pulldown.area, TIMEOUTS.SCREEN);   // 5秒
I.waitForElement(SELECTORS.RESULT_LINK, TIMEOUTS.RESULT);     // 10秒
```

`TIMEOUTS.SCREEN`（画面タイトル待ち = 5秒）、`TIMEOUTS.RESULT`（検索結果待ち = 10秒）のように名前で管理することで、
数字が何を意味するかがわかります。数字を直書きしないのがポイントです。
`SELECTORS.RESULT_LINK`（`.listViewTdLinkS1`）や `SELECTORS.ERROR_CONTAINER`（`#top_err_info_msg_div`）も同じ理由で定数化されています。

---

## Level 3：SyokaiFlowPage.js の構造を読む

ファイルは上から順に「定数 → 小さな部品 → 画面ごとの関数 → まとめ関数」の順で並んでいます。

```
[定数]      KEIRI_SCREEN_B_LOCATORS      ← 経理ビューBのセレクタ一覧
            KEIRI_SUBMENU                ← 「閲覧/登録・経理ビュー」サブメニューの定義
[部品]      navigateToKeirisyoriView     ← サブメニューを開いて経理ビューへ（recordId を渡すと URL 直指定 #244）
            fillClassSearchForm          ← クラス選択ポップアップの検索条件入力
            fillAccountingDates          ← 契約日・開始日・月途中チェック
            createActionExecutor         ← 実行プランのステップを1つずつ動かす仕組み
[画面関数]  navigateToStudentGroup       ← 候補生検索ページへ遷移
            searchAndSelectKouhosei      ← 候補生を姓で検索して選択
            promoteKouhoseiToStudent     ← 候補生詳細で「受講生へ移動」
            openKeirisyoriScreenA        ← 経理ビューAで「クラス追加/更新する」
            selectClassInPopup           ← 別タブでクラスを検索して完全一致行を選ぶ
            fillKeirisyoriScreenB        ← 経理ビューB（クラス適用〜売上計上）
            confirmKeirisyoriScreenE     ← 「確認完了（経理ビューへ）」
[警告解消]  resolveUnfinishedKeiriDataIfPresent ← 「経理処理が完了してないデータがあります」を解消
[退会]      fillTaikaiFormAndSubmit      ← 退会処理画面のフォーム入力〜更新
            executeTaikai                ← 受講生詳細 → 個人情報1 → 退会処理 まで含む
[まとめ]    runRegistrationFlow          ← 候補生検索〜経理ビューBまでを順番に呼ぶ
[公開]      module.exports               ← 外から使えるものを宣言
```

---

### 3-1. ロケーター定数（セレクタのまとめ）

```js
const KEIRI_SCREEN_B_LOCATORS = {
  textbox:  { keiyaku_date: '#contract_dateclass_operation', kaishi_date: '#start_dateclass_operation', class_name: '#course_name' },
  pulldown: { area: '#AN_1_area_id', tenpo: '#school_id', couse_category: '#course_category', remaining_classes: '#remaining_times' },
  checkbox: { mid_month: '#ltd_mid_month' },
  button:   { class_select: '#course_popup_popup_button', label_class_set: 'クラス適用', label_course_set: 'コース料金設定', label_tran_set: '売上計上する' },
  screen:   { name: '受講生詳細' },
  error:    { container: SELECTORS.ERROR_CONTAINER }
};
```

セレクタ（`#id` や `.class` などHTML要素の場所を示す文字列）をオブジェクトにまとめています。

**なぜまとめるの？**  
HTML側でIDが変わったとき、この1箇所だけ直せばすべての操作に反映されます。
全画面共通のもの（エラーコンテナ）は `SELECTORS` から借りていて、ここで文字列を書き直していない点にも注目してください。

---

### 3-2. 画面関数の読み方パターン

画面関数はすべて同じパターンで書かれています：

```js
async function searchAndSelectKouhosei(I, last_name) {
  // ① 使うセレクタをまとめる（共通のものは SELECTORS から）
  const S = {
    button: { search: '検索' },
    result: { list: SELECTORS.RESULT_LINK, link: `a${SELECTORS.RESULT_LINK}` }
  };

  // ② 今何をしているかログに出す
  I.say('【候補生検索】一覧表示＆検索実行');

  // ③ 画面が表示されるまで待つ
  I.waitForElement(locate('body').withText('候補生一覧'), TIMEOUTS.SCREEN);

  // ④ 操作する（テキスト入力は共通ユーティリティ fillTextFieldsByName で）
  fillTextFieldsByName(I, { last_name });
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
  await navigateToStudentGroup(I, classMemberPageShimamura);
  const student_name = await searchAndSelectKouhosei(I, input.lastName);
  await promoteKouhoseiToStudent(I, student_name);
  await openKeirisyoriScreenA(I, classMemberPageShimamura);
  await fillKeirisyoriScreenB(I, input);
}
```

「個々の画面操作」を組み合わせて「業務フロー」にしている関数です。  
これを見るだけで「何の順番で画面を操作するか」が一目でわかります。

テストファイル側はこの後 `confirmKeirisyoriScreenE` → `executeTaikai` を続けて呼び、
登録〜退会までを1シナリオで通しています。

---

### 3-4. `fillKeirisyoriScreenB` — 「実行プラン」という考え方

経理ビューBは CSV の `breakTarget` / `breakValue` によって「契約日を空にしてエラーを出す」
「クラス選択を飛ばす」など、意図的に一部のステップをスキップします。

```js
async function fillKeirisyoriScreenB(I, { class_name01, ..., breakTarget, breakValue, expectedErrors = [] }) {
  const preparedInput = prepareInput({ ... });            // breakTarget に応じて入力値を書き換える
  const { plan } = buildExecutionPlan({ ... });           // 実行するステップの一覧を作る
  const executor = createActionExecutor(I, S, preparedInput, expectedErrors);
  for (const step of plan) {
    await executor.execute(step);                         // 1ステップずつ実行
  }
}
```

「どのステップを実行するか」の判断は `support/shimamura/syokai_helpers.js`（`prepareInput` / `buildExecutionPlan`）に
切り出されていて、画面操作（`createActionExecutor` の中身）とは分かれています。
「条件分岐の計算」と「ブラウザ操作」を分けておくと、計算部分は単体でテストできるからです。

---

## Level 4：自分で新しい関数を書く

### 4-1. テンプレート

新しい画面用の関数を書くときは、このテンプレートを使いましょう。
関数名は `verbNoun`（動詞＋名詞）です。旧パターンの `ShouldBeOn〇〇` は使いません。

```js
/**
 * ○○画面で△△する
 * @param {CodeceptJS.I} I
 * @param {string} paramName - 説明
 */
async function fillSomethingForm(I, paramName) {
  // ① セレクタ定義（共通のものは SELECTORS から）
  const S = {
    button: { submit: 'input[name="save_button"]' },
    screen: { name: '○○画面' },
    error:  { container: SELECTORS.ERROR_CONTAINER }
  };

  // ② ログ
  I.say('【○○】△△する');

  // ③ 画面待ち
  I.waitForElement(locate('body').withText(S.screen.name), TIMEOUTS.SCREEN);

  // ④ 操作（テキストは fillTextFieldsByName、セレクトは selectOption）
  fillTextFieldsByName(I, { xxx: paramName });
  I.click(S.button.submit);

  // ⑤ 保存結果の確認
  await assertNoShimamuraError(I, '【○○】保存');

  // ⑥ URLログ
  await logScreenUrl(I, S.screen.name);
}
```

---

### 4-2. チェックリスト（関数を書いたら確認）

- [ ] 関数名が `verbNoun`（`navigateTo〇〇` / `fill〇〇` / `open〇〇` / `confirm〇〇` / `execute〇〇` / `run〇〇`）になっている
- [ ] `async` が付いている
- [ ] セレクタが関数の中の `const S = {...}` かファイル先頭の定数にまとまっている
- [ ] エラーコンテナ・検索結果リンクは `SELECTORS` を参照している（文字列を再定義していない）
- [ ] テキスト入力に `fillTextFieldsByName` / `fillTextFieldsBySelector` を使っている
- [ ] `I.say(...)` でログが出る
- [ ] 画面待ち（`waitForElement` / `waitForText`）がある
- [ ] `await` が必要な場所に付いている（`grab系` の前）
- [ ] 外から呼ぶ必要があれば `module.exports` に追加している
- [ ] 同じ操作が他の FlowPage（`GessyaIkkatuFlowPage` 等）に既にないか grep した

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
function badExample(I) {
  const name = await I.grabTextFrom('.selector');  // SyntaxError!
}

// ✅ 正しい
async function goodExample(I) {
  const name = await I.grabTextFrom('.selector');
}
```

```js
// ❌ 呼び出し側で await しない
navigateToStudentGroup(I, page);  // 完了を待たずに次へ進んでしまう

// ✅ 正しい
await navigateToStudentGroup(I, page);
```

---

## Level 5：全体をつなげて理解する

テスト実行時のデータの流れを追ってみましょう。

```
【CSV ファイル】
lastName,className,keiyakuDate,...
かげやま,ピアノ水曜日_01_01,2026-04-21,...

        ↓ loadCsvWithProfile('syokai_touroku_data', 'shimamura')

【csvData（配列）】
[{ lastName: 'かげやま', className: 'ピアノ水曜日_01_01', ... }]

        ↓ Data(csvData).Scenario(...)

【current（シナリオに渡される1行）】
current.lastName    = 'かげやま'
current.className   = 'ピアノ水曜日_01_01'
current.keiyakuDate = '2026-04-21'

        ↓ input = { ... } で詰め替え（日付は resolveDynamicDateIfPast で当月に補正）

【input（SyokaiFlowPage に渡す形）】
input.lastName     = 'かげやま'
input.class_name01 = 'ピアノ水曜日_01_01'  ← キー名を変換
input.keiyaku_date = '2026-09-10'          ← 過去月だったので本日に補正された

        ↓ runRegistrationFlow(I, page, input)

【SyokaiFlowPage.js の各関数が input を使って画面を操作】
searchAndSelectKouhosei(I, input.lastName)
  → 「かげやま」で候補生を検索

fillKeirisyoriScreenB(I, input)
  → 「ピアノ水曜日_01_01」のクラスを選択
  → 「2026-09-10」を契約日に入力
```

---

## 参考：ファイルの場所

```
e2e/
├── tests/shimamura/flow/
│   ├── syokai_touroku_test.js    ← 「何をテストするか」
│   └── taikai_test.js            ← 退会だけを行うテスト（fillTaikaiFormAndSubmit を再利用）
├── pages/shimamura/flow/
│   └── SyokaiFlowPage.js         ← 「どう画面を操作するか」（このガイドの対象）
├── pages/shimamura/_common/
│   └── ClassMemberPage.js        ← 管理タブ・サブメニューの共通ナビ
├── support/shimamura/
│   ├── syokai_helpers.js         ← 「どのステップを実行するか」を計算する
│   ├── utils.js                  ← fillTextFieldsByName / assertNoShimamuraError など
│   ├── hooks.js                  ← beforeShimamura（ログイン＋担当者番号）
│   └── constants.js              ← TIMEOUTS / SELECTORS
└── data/shimamura/
    └── syokai_touroku_data*.csv  ← テストデータ
```
