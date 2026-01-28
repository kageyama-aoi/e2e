
# CodeceptJS E2Eテストコード 技術解説

このドキュメントは、提示された「新規会員登録と経理処理」のE2Eテストコードに使われている技術・設計思想を、**概念 → 目的 → コード上の具体箇所**の順で整理したものです。
「なぜこの書き方になっているのか」を理解できることを目的にしています。

## 異常系に強いE2Eテスト設計 ― 技術用語集（完全版）

> 目的  
> - 頭の回転が速いエンジニアと、設計意図を短時間で共有する  
> - 「なぜこのテスト構造にしたか」を技術用語で説明できるようにする  

---

### 技術用語一覧（日本語用語・読み・コード例付き）

| 分類 | 用語（英語） | 日本語読み | 用語（日本語） | 意味（会話用に短く） | 最小コード例 |
|---|---|---|---|---|---|
| 設計思想 | Data-Driven Testing | データ・ドリブン・テスティング | データ駆動テスト | テストケースをコードではなくデータで増やす設計 | `Data(csvData).Scenario(...)` |
| 設計思想 | Single Flow / Unified Flow | シングルフロー | 単一フロー設計 | 正常系・異常系を1本の処理フローに統合 | `runKeiriScreenB(I, input, error)` |
| 設計思想 | Error Injection | エラー・インジェクション | エラー注入 | 意図的に入力や操作を壊して異常状態を作る | `{ breakTarget:'kaishi_date' }` |
| 設計思想 | Injection Point | インジェクション・ポイント | 注入ポイント | エラーを差し込む限定箇所 | `if (target !== 'class_select')` |
| 設計思想 | Branch Suppression | ブランチ・サプレッション | 分岐抑制 | 異常系増加による if/else 爆発を防ぐ | 分岐は注入点のみ |
| 設計思想 | Scalable Test Design | スケーラブル設計 | 拡張耐性設計 | ケース増加でも構造が変わらない | CSVに1行追加 |
| 実装技術 | Optional Chaining (`?.`) | オプショナル・チェイニング | 安全参照演算子 | null / undefined を安全に扱う | `errorInjection?.breakTarget` |
| 実装技術 | Ternary Operator (`? :`) | ターナリー | 三項演算子 | 条件に応じて値を切り替える | `cond ? errorVal : normalVal` |
| 実装技術 | Undefined-as-Signal | アンディファインド | 未定義値シグナル | undefined を「処理しない」の意味で使う | `if (val !== undefined)` |
| 実装技術 | Null Object Pattern | ヌル・オブジェクト | ヌルオブジェクト | nullチェックをコードから排除 | `errorInjection = null` |
| 実装技術 | Command-style Helper | コマンド型 | 操作関数設計 | 値を返さず操作のみを行う | `fillAccountingDates(I, ...)` |
| 実装技術 | Idempotent Operation | アイデンポーテント | 冪等操作 | 再実行しても状態が壊れない | `retry().click(btn)` |
| テスト戦略 | Negative Testing | ネガティブ | 異常系テスト | 意図的にエラーを起こす | 開始日未入力 |
| テスト戦略 | Validation Boundary Testing | バウンダリー | 境界値テスト | 未入力・未来日などを検証 | `'2099-01-01'` |
| テスト戦略 | Behavior-Oriented Testing | ビヘイビア | 振る舞い指向テスト | 内部実装ではなく挙動を検証 | `I.see(errorMsg)` |
| テスト戦略 | Test Code as Specification | スペシフィケーション | テスト＝仕様 | テストデータが業務仕様になる | `expectedErrors` |
| アンチパターン | Conditional Explosion | コンディショナル | 分岐爆発 | 異常系増加に比例して if が増える | `if(A)…else if(B)` |
| アンチパターン | Test Logic Duplication | デュプリケーション | テストロジック重複 | 似たテスト関数が量産される | `ScreenB / ScreenBWithError` |
| アンチパターン | Spec Re-implementation | リエンプリ | 仕様再実装 | テストが業務ロジックを判断 | 日付比較 if |

---

### 会話で即使える要約フレーズ

- **「単一フロー設計でエラー注入しています」**
- **「異常系はデータ駆動で breakTarget 管理です」**
- **「分岐は注入ポイントに閉じています」**
- **「分岐爆発を避けた拡張耐性のあるテストです」**
- **「テスト側で業務仕様を再実装しない方針です」**

---

### 超要約（これだけ覚えればOK）

> **単一フロー × データ駆動 × エラー注入**

異常系が増えても  
テストコードの構造が壊れない設計思想。


---

## 1. E2Eテスト（End-to-End Testing）

### 概念
E2Eテストとは、**ユーザー操作を起点に、画面・API・DB連携を含めた一連の流れを通しで検証するテスト**です。

### このコードでの役割
- 実際の画面遷移
- 入力操作
- バリデーションエラー表示
- 売上計上までの業務フロー

をすべてブラウザ操作として検証しています。

### 該当箇所
```js
Feature('Dev sandbox (@dev)');
Data(csvData).Scenario('新規会員登録 @dev', async ({ I, classMemberPageShimamura, current }) => {
```
ここが「E2Eテストのシナリオ定義」です。

---

## 2. CodeceptJS（テストフレームワーク）

### 概念
CodeceptJSは、**「I.click」「I.fillField」など、人が操作する言葉に近いDSL**でテストを書けるE2Eテストフレームワークです。

### このコードでの役割
- Selenium / Playwright 等の操作を隠蔽
- テストコードの可読性向上

### 該当箇所
```js
I.click(S.button.class_select);
I.fillField(locators.textbox.keiyaku_date, dates.keiyaku_date);
I.waitForElement(containerSelector, 5);
```

---

## 3. Data Driven Testing（データ駆動テスト）

### 概念
**テストロジックとテストデータを分離**し、CSVなどの外部データで複数ケースを回す設計。

### このコードでの役割
- 正常系・異常系をCSVで切り替え
- テストケース追加がCSV編集だけで可能

### 該当箇所
```js
const csvData = readCsv(defaultCsvPath);
Data(csvData).Scenario(...)
```

```js
const validationErrorData = readCsv(validationErrorsDefaultPath);
Data(validationErrorData).Scenario(...)
```

---

## 4. 異常系注入（Fault Injection / Error Injection）

### 概念
**わざと壊した入力や操作を入れて、システムの耐性を確認するテスト手法**です。

### このコードでの役割
- contract_date / start_date の不正値
- 操作自体のスキップ（SKIP）
- 期待エラーメッセージの検証

### 該当箇所
```js
breakTarget
breakValue
expectedErrors
```

```js
function prepareInput(input) { ... }
function buildExecutionPlan(input) { ... }
```

---

## 5. Execution Plan（実行計画パターン）

### 概念
if文を大量に書かず、**「実行するステップの配列」を先に作る設計**。

### メリット
- 分岐爆発を防ぐ
- 異常系追加に強い
- テストフローが可視化される

### 該当箇所
```js
const steps = [
  { step: 'class_select' },
  { step: 'switch_to_detail' },
  { step: 'class_apply' },
  { step: 'fill_dates' },
  { step: 'course_set' },
  { step: 'log_after_popup_close' },
  { step: 'transaction' },
  { step: 'verify_errors' }
];
```

```js
const plan = steps.filter(step => !skipSteps.has(step.step));
```

---

## 6. Command Pattern（コマンドパターン）

### 概念
**処理を「名前付きの命令」として登録し、あとから実行する設計**。

### このコードでの役割
- UI操作を action として集約
- 実行順を plan で制御

### 該当箇所
```js
const actions = {
  class_select: async () => { ... },
  fill_dates: async () => { ... },
  transaction: async () => { ... }
};
```

```js
executor.execute(step);
```

---

## 7. Page Object的設計（準拠）

### 概念
画面操作やロケーターを**業務単位の関数にまとめる**設計思想。

### このコードでの役割
- 画面遷移の意味がコードから読める
- UI変更時の影響範囲を限定

### 該当箇所
```js
ShouldBeOnStudentGroup()
ShouldBeOnKeirisyoriScreenA()
ShouldBeOnKeirisyoriScreenB()
```

---

## 8. ガード節（Fail Fast）

### 概念
**おかしな状態なら早めに失敗させる**設計。

### 該当箇所
```js
if (!tantousyaNumber) {
  throw new Error('SHIMAMURA_TANTOUSYA が設定されていません');
}
```

---

## 9. 冪等性・リトライ制御

### 概念
不安定なUI操作に対して、**再実行しても壊れない設計**。

### 該当箇所
```js
I.retry({ retries: 2, minTimeout: 500 })
  .click(locators.button.label_tran_set);
```

---

## 10. まとめ（このコードの設計レベル）

このテストコードは以下の特徴を持っています。

- 業務フロー中心のE2E設計
- CSVによるスケーラブルなテストケース管理
- 異常系耐性を前提としたExecution Plan設計
- if地獄を回避するコマンドパターン

**「テストが仕様書として読める」レベルの、かなり完成度の高い構成**です。

