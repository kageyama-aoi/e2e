# しまむらテスト コーディング規約

> 全体の規約は `AGENTS.md` が正。本ファイルは shimamura 固有の補足で、AGENTS.md と矛盾する場合は AGENTS.md を優先する。
> 雛形と共通ユーティリティの一覧は AGENTS.md「shimamura テストの共通パターン」を参照。

## 目的
- UI変更に強いテスト設計を維持する
- しまむら系テストの可読性・再利用性を高める
- 役割分担を明確にして修正コストを下げる

## ディレクトリ責務
- `tests/shimamura/`: シナリオ本体（What/意図）を記述する層。`auth/` `page/` `flow/` `check/` `util/` に分類（AGENTS.md 参照）
- `pages/shimamura/`: 画面操作・セレクタを集約する層
  - `auth/LoginPage.js` — ログイン・担当者番号入力
  - `_common/ClassMemberPage.js` — 管理タブ・サブメニューの共通ナビゲーション
  - `_common/sideMenus.js` — サイドバー画面のメニュー定義（directUrl / moduleUrl / shortcut）
  - `screens/IchiranPage.js` — 一覧検索画面（全一覧画面を1ファイルに集約）
  - `flow/*FlowPage.js` — 複数画面をまたぐ業務フロー（画面単位ではなくフロー単位）
- `support/shimamura/`: しまむら固有の共通処理（`utils.js` `constants.js` `hooks.js` `syokai_helpers.js` `accountTransferSchedule.js`）

## 依存ルール
- `tests/` → `pages/`・`support/` にのみ依存
- `pages/` → `support/` には依存してよい（ユーティリティ共通化）
- `support/` → `tests/`・`pages/` に依存しない
- FlowPage 同士の依存は可（例: `HappyoukaiFlowPage` が `GessyaIkkatuFlowPage.navigateToKouhosei` と `CourseClassSetupFlowPage.setupLinkedCourseAndClass` を再利用）。同じ業務語のロジックを別 FlowPage に再実装しない

## 命名規則
- 関数: `verbNoun`（例: `navigateToStudentGroup`, `searchAndSelectKouhosei`, `fillKeirisyoriScreenB`, `executeTaikai`）
- 画面遷移: `navigateTo...` / `open...` / `goTo...`
- 旧パターン `ShouldBeOn...` は 2026-07 に全廃済み。新規追加はもちろん、既存コードでも見つけたら `verbNoun` に直す
- FlowPage のオーケストレーターは `run...Flow` / `run...`（例: `runRegistrationFlow`, `runSaikenkaiFlow`）

## セレクタ管理
- セレクタは各ファイル先頭の `S`（または `LOCATORS`）オブジェクトに集約し、`fields` / `selects` / `buttons` / `checkboxes` / `error` で分類する
- 全画面共通のもの（エラーコンテナ `#top_err_info_msg_div`、検索結果リンク `.listViewTdLinkS1`）は `SELECTORS`（`support/shimamura/constants.js`）を参照し、ファイル内で文字列を再定義しない
- 文字列直書きは最小限

## 入力・保存・検証
- テキスト入力は `fillTextFieldsByName(I, {...})`（`name=` 属性）／`fillTextFieldsBySelector(I, [[sel, val], ...])`（`#id`）を使う。`executeScript` を FlowPage 内に直書きしない
- `selectOption` は change イベントが必要なため個別に呼ぶ
- 保存後は `assertNoShimamuraError(I, context)`（成功系）／`verifyValidationErrors(I, errors, container)`（異常系）で確認する
- 保存ボタンは `input[name="save_button"]` のように `name=` で指定する（value に全角スペースが混ざる画面がある）

## ログ方針
- `I.say` は画面遷移や重要アクションの節目のみ（`【画面名】操作` 形式）
- 連続操作の都度ログは避ける
- 画面 URL の記録は `logScreenUrl(I, label)`（`support/utils.js`）

## 待機方針
- `I.wait(秒)` の多用は禁止。原則は `I.waitForElement` / `I.waitForVisible` / `I.waitForFunction`
- 例外的に `I.wait` を使う場合は理由をコメントに書き、秒数は `TIMEOUTS`（`constants.js`）の定数を使う
- 保存完了待ちは「エラーが出るか成功後の要素が出るか」を `waitForFunction` で待つ（例: `StudentSaikenkaiFlowPage.waitForSaveResult`）

## CSV/データ
- CSV 読み込みは `loadCsvWithProfile(baseName, 'shimamura')`（`support/utils.js`）に統一。第2引数は必ず明示する
- 独自パーサは作らない
- 日付列は固定値のままだと月をまたいで壊れるため、`resolveDynamicDateIfPast()` を通す

## エラーハンドリング
- 必須環境変数の未設定は `throw new Error` で即時停止（`validateShimamuraEnv()`）
- エラーメッセージは「何が不足か」を明示

## テスト構成
- 1 Scenario = 1 フロー、Arrange → Act → Assert を意識
- `Before(beforeShimamura)` でログイン＋担当者番号入力を共通化（テスト内に Before の中身を書かない）
- 画面遷移やUI操作の詳細は Page Object / FlowPage / Utils へ寄せる
- 未完成テストは `@wip` タグで隔離する（AGENTS.md「テスト運用ガイド」）

## 推奨パターン例

```js
// tests/shimamura/flow/koushi_sharei_manual_test.js
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { runKoushiShareiManualFlow } = require('../../../pages/shimamura/flow/KoushiShareiFlowPage');

Before(beforeShimamura);

Data(csvData).Scenario('講師謝礼を手動登録できる @dev', async ({ I, current }) => {
  await runKoushiShareiManualFlow(I, input);
  I.saveScreenshotWithTimestamp('KOUSHI_SHAREI_MANUAL_result');
});
```

```js
// pages/shimamura/flow/KoushiShareiFlowPage.js
const S = { fields: {...}, selects: {...}, buttons: {...}, message: { error: SELECTORS.ERROR_CONTAINER } };

async function navigateToTsuikaScreen(I) { ... }
async function fillMainForm(I, input) { ... }
async function saveAndVerify(I, expectedErrors) { ... }

async function runKoushiShareiManualFlow(I, input) {
  await navigateToTsuikaScreen(I);
  await selectTeacher(I);
  await fillMainForm(I, input);
  await saveAndVerify(I, input.expectedErrors || []);
}
module.exports = { runKoushiShareiManualFlow, ... };
```

```js
// support/shimamura/utils.js
async function toggleGroupmenu(I, { icon_id, menuname }) { ... }
```

## 運用ルール
- Page Object / FlowPage の修正は「画面仕様変更時」と「共通化・整理」のとき
- テスト変更時にセレクタが出てきたら `pages/` へ移動する
- 共通化できる処理は `support/shimamura/` へ集約する。集約したら AGENTS.md の共通ユーティリティ一覧とスキルも更新する（ドキュメント連動ルール カテゴリF）
