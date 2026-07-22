---
name: tframe-flow-dev
description: |
  tframe の業務フロー（複数画面をまたぐE2Eシナリオ）を新規作成・修正するスキル。
  以下のような依頼があったら使用すること：
  - tframe で複数画面にまたがるシナリオ（例: 受講生登録→コース紐付け）のテストを作りたい
  - 既存の `pages/tframe/flow/*FlowPage.js` を修正・拡張したい
  - shimamura の flow パターン（`pages/shimamura/flow/*FlowPage.js`）に相当するものを tframe 側にも作りたい

  ワークフロー: 対象UI確認（/tframe-html-fetch or 実機操作）→ pages/tframe/flow/ にFlowPage作成 or 追記 →
             CSV → テストファイル → 実行確認

  ※ 1画面完結の登録・一覧テストは /tframe-registration-dev または /tframe-ichiran-dev を使うこと
---

# tframe 業務フローテスト開発スキル

tframe の「複数画面をまたぐ業務フロー」（例: 受講生登録 → コース紐付け）に対する
E2E テスト（FlowPage / CSV / テストファイル）を新規作成・修正する際の標準手順。

shimamura 側の `pages/shimamura/flow/*FlowPage.js` と同じ役割を tframe に持ち込むためのスキル。
ただし shimamura 固有のユーティリティ（`support/shimamura/utils.js` 等）は使わず、
tframe の既存規約（`TIMEOUTS` 定数・`submitTframeFormAndVerify`・`selectAreaThenBranch` 等）に合わせる。

---

## 前提知識：読むべきファイル

コールドスタート時は必ず以下を読んで構造を把握すること。知識をスキルに書かず、コードを正解とする。

| 目的 | 参照先 |
|---|---|
| flow系Page Objectの雛形（1本目・最も新しい） | `pages/tframe/flow/JukuseiCourseFlowPage.js` |
| 対応するテストファイルの雛形 | `tests/tframe/flow/jukusei_course_link_flow_test.js` |
| shimamura側の同種パターン（構造の参考。丸写し禁止） | `pages/shimamura/flow/SyokaiFlowPage.js` |
| 1画面完結の登録Page Object | `pages/tframe/screens/JukuseiPage.js` / `CoursePage.js` |
| 共通ユーティリティ | `support/utils.js`、`support/tframe/utils.js`、`support/tframe/constants.js` |
| フォルダ配置ルール | `AGENTS.md` の「tframe テストのフォルダ分類」（`flow/` = 複数画面をまたぐ遷移・シナリオ） |

---

## ワークフロー

### Step 1: 対象UIの実在確認（最重要）

flow系シナリオは「登録フォームの延長にある、まだPage Object化されていない画面遷移・ポップアップ・タブ」を
対象にすることが多い。**画面が実在するかを必ず実機で確認してから実装すること。架空のセレクタで実装しない。**

確認方法は2パターン：

- **単純な画面（URLで直接開ける）**: `/tframe-html-fetch` スキルを使う
- **一覧検索→詳細→タブ切替→ポップアップのような多段操作**: `/tframe-html-fetch` の
  `fetch_tframe_forms.js` は単発 URL 取得専用のため対応できない。この場合は
  Playwright を直接使った使い捨て調査スクリプトを `scripts/html/_tmp_探索名.js` に作成し、
  ログイン→検索→クリック→スクリーンショット/HTML保存、を行ってから**必ず削除する**
  （`JukuseiCourseFlowPage.js` 作成時は `student/dw/_default` 詳細画面の「コース」タブ→
  「コース選択」ボタン→ポップアップ、という3段階を実機操作して確認した）。
- 確認が取れない場合は絶対に実装を進めず、その旨をユーザーに報告する。

### Step 2: FlowPage の作成/更新

`pages/tframe/flow/` に `{機能名}FlowPage.js` を作成する（雛形: `JukuseiCourseFlowPage.js`）。

#### 標準構成（shimamura の SyokaiFlowPage と同じ構造だが tframe 規約に合わせる）

```javascript
'use strict';

const { TIMEOUTS } = require('../../../support/tframe/constants');

// 画面・ポップアップのロケーター定義
const XXX_LOCATORS = { /* ... */ };

// 個々の操作は小さい関数に分割する。I は呼び出し元から明示的に渡す
// （shimamura FlowPage と同様、inject() をファイル内で呼ばない）
async function registerXxx(I, xxxPage, data) { /* 既存 screens/ の Page Object に委譲 */ }
function openYyyPopup(I) { /* ... */ }
function verifyZzz(I, expected) { /* ... */ }

// 一括実行用のエントリーポイント
async function runXxxYyyFlow(I, xxxPage, yyyPage, data) { /* ... */ }

module.exports = { XXX_LOCATORS, registerXxx, openYyyPopup, verifyZzz, runXxxYyyFlow };
```

ポイント：
- `const { I } = inject();` を**しない**。関数の第一引数として `I` を受け取る
  （既存 `screens/` の Page Object とは異なる書き方。flow は複数 Page Object を横断するため）。
- 既存 `screens/` の Page Object メソッド（`navigateToRegisterPage` / `fillRegistrationForm` /
  `submitAndVerifyRegistration` 等）を再利用し、車輪の再発明をしない。
- tframe のカスタムラジオボタン（ポップアップ選択式）は `input` が非表示のため
  `locate('.tf-radio.tf-radio-primary').first()` をクリックする（既存の popup picker と同じ作法）。
- 待機は `TIMEOUTS`（`support/tframe/constants.js`）を使う。マジックナンバー禁止。

### Step 3: CSV の作成/更新

`data/tframe/{機能名}_flow_data.csv` を作成する。

- 複数の画面／エンティティ（例: コースと受講生）を1行にまとめる場合、列名の衝突に注意する。
  例えば `school_area_id` はコース・受講生の両方が持ちうるフィールドなので、
  `courseSchoolAreaId` のようにプレフィックスを付けて区別する。
- 一意性が必要な値（コース名など、重複登録してもエラーにならないがテストの検証が
  曖昧になるもの）は CSV に固定値を書かず、テストファイル側で `Date.now()` 等を
  付与して一意にする（`courseNameBase` → `` `${courseNameBase}_${Date.now()}` ``）。
- ID番号のように重複時にサーバー側でエラーになるものは、既存の
  `jukuseiPage.submitAndVerifyWithIdRetry` + `updateCsvIdnumber` の組み合わせを再利用する。

### Step 4: テストファイルの作成/更新

**`tests/tframe/flow/jukusei_course_link_flow_test.js` を雛形にすること。**

```javascript
const { loadCsvWithProfile, withScenarioLabel, updateCsvIdnumber } = require('../../../support/utils');
const { runXxxYyyFlow } = require('../../../pages/tframe/flow/{機能名}FlowPage');

const csvData = withScenarioLabel(
  loadCsvWithProfile('{機能名}_flow_data', 'tframe'),
  (row) => `...`
);

Feature('{業務フロー名}');

Data(csvData).Scenario('{シナリオ説明} @admin', async ({ I, xxxPage, yyyPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  await runXxxYyyFlow(I, xxxPage, yyyPage, { /* ... */ });

  I.saveScreenshotWithTimestamp('{機能名}_flow_done', true);
});
```

配置先は `tests/tframe/flow/`（AGENTS.md の tframe フォルダ分類：複数画面をまたぐ遷移・シナリオ）。

### Step 5: 実行確認

```bash
npx codeceptjs run ./tests/tframe/flow/{機能名}_flow_test.js --profile tframe.culture_beta
```

**最低1件は実際に最後まで通ることを確認すること。**

#### 環境側のフォーム差異に注意

culture_beta 環境は既存の `screens/` Page Object と実際のフォームがズレている場合がある
（例: `selectAreaThenBranch` が前提とする `#school_area_id` セレクトが、コース登録・受講生登録の
一部で既に廃止され単一の校舎セレクトになっている、等）。これは既存の `course_touroku_test.js` /
`jukusei_touroku_test.js` 自体も現状失敗する既知の環境差異であり、本スキルの対象外（別Issueで
扱う）。flow テストで該当フィールドが本質的に不要な場合は、CSV 側でその列を渡さない
（`selectAreaThenBranch` は `area`/`branch` が falsy なら何もしないため、指定しなければ
デフォルト値のまま登録が進む）ことで回避してよい。

### Step 6: GUI 用の日本語説明を登録する（必須）

`run/test_descriptions.json` の `"tframe"` セクションに追記する。

```json
"flow/{機能名}_flow_test.js": "{業務フロー名}の一連の画面遷移を確認",
```

---

## スキル呼び出し時の受け取り方

ユーザーが「〇〇と△△をまたぐフローのテストを作りたい」と言ったとき：

1. 対象UIが本当に存在するか（Step 1）を最優先で確認する。存在しないなら架空実装せず報告する。
2. `pages/tframe/flow/` に既存FlowPageがあれば流用・拡張、なければ `JukuseiCourseFlowPage.js` を
   雛形にコピーして書き換える。
3. CSV・テストファイルを作成し、`--profile tframe.culture_beta`（または `tframe.juku_test`）で
   実行確認する。
4. `run/test_descriptions.json` の追記を忘れない。
