# プロジェクト設計・アーキテクチャガイド

本リポジトリは、テスト自動化プロジェクトにおける「関心の分離」と「運用効率」を追求した構成です。  
最終更新: 2026-05-08

---

## 1. ディレクトリ構成と役割の定義

各ディレクトリは明確な責務を持ち、相互の依存関係が最小限になるよう設計されています。

| ディレクトリ | 責務 | 主な中身 |
|---|---|---|
| `tests/` | テストシナリオ層 | プロダクト・機能別のシナリオファイル（`*_test.js`） |
| `pages/` | ページオブジェクト層 | 画面操作の具象実装 |
| `support/` | 共通基盤層 | ユーティリティ・カスタムSteps・ENV読み込み |
| `data/` | テストデータ層 | CSV・JSによるデータ定義 |
| `env/` | 環境定義層 | プロファイル別 `.env.*` ファイル |
| `run/` | 実行ランチャー層 | 主役は `run_gui.py`（GUI）、特殊フローは `.bat` / `.ps1` |
| `scripts/` | 開発補助ツール層 | テストを起動しない支援ツール群 |
| `docs/` | ドキュメント層 | 設計書・JSDoc生成物・学習資料 |
| `output/` | 生成物（テスト結果） | スクリーンショット・ログ |
| `allure-results/` | 生成物（Allureデータ） | Allureレポートの元データ |

### tests/ の構成

プロダクトごとにサブディレクトリを分割し、tframe はさらに性質別に分類しています。

```
tests/
├── shimamura/        # しまむら系テスト
├── tframe/
│   ├── auth/         # ログイン・認証系
│   ├── page/         # 画面単体の操作・登録確認
│   ├── flow/         # 複数画面をまたぐ遷移シナリオ
│   ├── check/        # 表示・設定の確認系
│   └── api/          # API系
├── taskreport/
└── smoke/
```

### pages/ の構成

```
pages/
├── shimamura/        # しまむら固有の Page Object
├── tframe/           # tframe 固有の Page Object
│   ├── auth/                   # ログイン・認証系
│   │   ├── LoginKannrisyaPage.js
│   │   ├── LoginMyPageTeacherPage.js
│   │   └── LoginMyPageStudentPage.js
│   ├── api/                    # API 操作系
│   │   ├── ApiCommonLoginPage.js
│   │   ├── ApiTeacherInfoGetPage.js
│   │   └── JsonInputPage.js
│   ├── screens/                # 画面操作 Page Object（登録・一覧・メニューナビ）
│   │   ├── KoshiPage.js        # 講師
│   │   ├── JukuseiPage.js      # 受講生
│   │   ├── CoursePage.js       # コース
│   │   └── ...（各画面）
│   └── _common/                # 共通ユーティリティ
│       ├── MenuNavigationMixin.js  # サイドメニュー操作の共通 Mixin
│       ├── sideMenus.js            # 全メニュー定義（キー別エクスポート）
│       └── _urlPath.js             # BASE_URL からパスプレフィックスを実行時解決
└── taskreport/
```

### data/ の構成

```
data/
├── shimamura/
│   ├── syokai_touroku_data.csv                       # 紹介登録データ（共通）
│   ├── syokai_touroku_data_{profile}.csv             # プロファイル別上書き
│   ├── syokai_touroku_validation_errors.csv          # バリデーションエラーテスト用
│   └── ...
└── tframe/
    ├── koshi_touroku_data.csv                        # 講師登録データ
    ├── koshi_touroku_data_minimum.csv                # 最小セット
    ├── account_touroku_data.csv                      # 法人・団体登録データ
    ├── staff_touroku_data.csv                        # スタッフ登録データ
    └── ...
```

> **`_urlPath.js` について**: `pages/tframe/_common/_urlPath.js` に配置。メニュー定義は `href` に URL パスを持つが、`/test/` や `/beta/` はプロファイルによって異なる。`_urlPath.js` が `BASE_URL` からパスプレフィックスを実行時に導出するため、ハードコードが不要。新規メニュー定義を追加する際は必ず `require('./_urlPath')` を使うこと（`sideMenus.js` 内では `require('./_urlPath')`、外部ファイルからは `require('../_common/_urlPath')`）。

---

## 2. 設計上のルールと一貫性

### ロジックの配置原則

- **`tests/`**: 条件分岐・複雑なループを書かない。「手順」のみ記述し、ロジックは `pages/` や `support/` に委譲する。
- **`pages/`**: 画面単位の操作をメソッドとして定義。セレクタを直書きせずページ内に集約。
- **`support/`**: 複数のページ・テストで共有される横断的な処理を集約。

### 命名規則

- テストファイル: `{機能名}_test.js`（例: `koshi_touroku_test.js`, `login_test.js`）
- Page Object: `{画面名}Page.js`（例: `KoshiPage.js`, `LoginKannrisyaPage.js`）
- ランチャーバッチ: `{product}_run_{機能}.bat`（例: `tframe_run_login.bat`）
- CSVデータ: `{機能名}_data.csv`、プロファイル上書き用は `{機能名}_data_{profile}.csv`

### ENV変数によるモード切り替え

テストの動作をコード変更なしに切り替えられます。

| ENV変数 | 値 | 意味 |
|---|---|---|
| `FORM_FILL_FAST` | `true` | `executeScript` による一括入力（高速・イベント非発火） |
| `FORM_FILL_FAST` | `false` | `fillField` による個別入力（安全・イベント発火） |
| `USE_MENU_NAV` | `true` | メニュークリック経由で画面遷移 |
| `USE_MENU_NAV` | `false` | URL直打ちで画面遷移（デフォルト） |
| `TFRAME_LANGUAGE` | `en` | 英語UI（jukuプロファイルのみ対応） |
| `HEADLESS` | `true/false` | ブラウザ表示の有無 |

---

## 3. 分離の考え方（デカップリング）

本プロジェクトは以下の4要素が独立しています。

1. **処理ロジック**: `pages/`, `tests/`
2. **設定**: `env/`, `codecept.conf.js`
3. **補助機能**: `scripts/`, `run/`
4. **成果物**: `output/`, `allure-results/`, `docs/generated/`

`run/` と `scripts/` は役割で分離されています。

- **`run/`**: 開発者が直接起動するファイル。主役は **`run_gui.py`**（Product → Test → Profile の GUI ランチャー。`--grep` フィルタ・Allure表示内蔵）。バッチ連続実行など特殊フローのみ `.bat` + `run/ps/*.ps1` で追加。
- **`scripts/`**: テストを直接起動しない補助ツール（`allure/`, `cleanup/`, `html/`, `docs/` でカテゴリ分け）

---

## 4. データ駆動テストの仕組み

CSVを使ったデータ駆動テストが基本パターンです。

```javascript
const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

// プロファイル対応CSV読み込み
// data/tframe/koshi_touroku_data.csv を基本に
// data/tframe/koshi_touroku_data_{profile}.csv があれば上書き
const csvData = loadCsvWithProfile('koshi_touroku_data', 'data/tframe');

Feature('講師登録');

Data(csvData).Scenario(
  '管理者ログイン後に講師を新規登録できる',
  { tag: '@admin' },
  withScenarioLabel(({ I, koshiPage, loginKannrisyaPage, current }) => {
    loginKannrisyaPage.login();
    koshiPage.navigateToRegisterPage();
    koshiPage.fillRegistrationForm(current);
    await koshiPage.submitAndVerifyRegistration(current.lastName);
  })
);
```

CSV列名がそのまま `current.{列名}` でアクセスできます。

---

## 5. tframe 登録テストの共通パターン

### Page Object の標準構成

```javascript
const { I } = inject();
const { fillTextFields, submitTframeFormAndVerify, isEnglish } = require('../../support/utils');

module.exports = {
  navigateToRegisterPage() { /* USE_MENU_NAV 対応 */ },
  fillRegistrationForm(data) { /* セクション別メソッドを呼び出す */ },
  fillPersonalInfo(data) { /* fillTextFields + selectOption */ },
  fillAddressInfo(data) { /* zipCodeBtn + fillTextFields */ },
  async submitAndVerifyRegistration(expectedName) {
    await submitTframeFormAndVerify(I, expectedName);
  },
};
```

### 特殊フィールドの操作パターン

```javascript
// 郵便番号ボタン（都道府県・市区町村を自動入力）
I.fillField('#primaryAddressPostalcode', data.primaryAddressPostalcode);
I.click('#zipCodeBtn');
I.wait(1);
// 番地・カナは自動入力されないため手動
fillTextFields(I, { primaryAddressStreet: data.primaryAddressStreet });

// AJAX連動ドロップダウン（エリア→校舎）
I.selectOption('#branchId_area_id', data.branchId_area_id);
I.wait(1); // AJAX完了を待つ
I.selectOption('#branchId_branch_id', data.branchId_branch_id);

// 銀行コード（AJAX補完で銀行名が自動入力）
I.fillField('#bankCode', data.bankCode);
I.wait(1);
// bankName はCSV不要（自動補完のため）

// メニュー経由遷移（USE_MENU_NAV対応）
if (process.env.USE_MENU_NAV === 'true') {
  I.click(`a:has-text("${isEnglish() ? 'Master' : 'マスター'}")`);
  I.waitForElement('a[href*="account%2Few"]', 10);
  I.click('a[href*="account%2Few"]');
} else {
  I.amOnPage(process.env.BASE_URL + 'index.php?r=account%2Few%2F_default');
}
```

### 保存後バリデーションエラーの検出

```javascript
// #tf-message-summary にエラーが表示されていれば throw
await submitTframeFormAndVerify(I, expectedName);
```

---

## 6. メリット

- **コールドスタート対応**: `AGENTS.md` の規約とこのガイド、既存の `KoshiPage.js` を読むだけで開発パターンが把握できる
- **ENV切り替えで同一コードを複数環境で使用**: `--profile` でURLやアカウントを切り替え
- **スキルによる開発手順の自動化**: `/tframe-registration-dev` スキルで登録テストの作成手順を再現可能

---

## 7. 技術スタック / 利用ツール一覧

### フレームワーク・ライブラリ

| ツール | 役割 | 設定ファイル |
|---|---|---|
| Node.js / npm | 実行環境・パッケージ管理 | `package.json` |
| CodeceptJS v3.3.7 | E2Eテストフレームワーク | `codecept.conf.js` |
| Playwright | ブラウザ操作ヘルパー | `codecept.conf.js` |
| Allure Report | レポート生成 | `codecept.conf.js` |
| dotenv | ENV変数ロード | `support/envLoader.js` |
| JSDoc + docdash | ドキュメント生成 | `jsdoc.json` |
| Python | 補助スクリプト | `scripts/` |

### 共通モジュール（`support/`）

#### `support/utils.js` — テスト共通ユーティリティ

| 関数 | 説明 |
|---|---|
| `loadCsvWithProfile(baseName, dataDir)` | プロファイル対応CSV読み込み |
| `withScenarioLabel(fn)` | Data Scenarioの表示名付与 |
| `fillTextFields(I, fieldMap)` | `FORM_FILL_FAST` 対応フィールド一括入力 |
| `submitTframeFormAndVerify(I, expectedName)` | 保存後バリデーションエラー検出 |
| `isEnglish()` | `TFRAME_LANGUAGE=en` 判定 |
| `withAllure(callback)` | Allureラベル付与ヘルパー |
| `attachErrorScreenshot(I, baseName)` | エラー時スクリーンショット添付 |
| `logScreenUrl(I, screenName)` | 現在URLをログ出力 |

#### `support/steps_file.js` — カスタムSteps

| メソッド | 説明 |
|---|---|
| `saveScreenshotWithTimestamp(fileName, fullPage)` | タイムスタンプ付きスクリーンショット保存 |
| `saveLogToFile(fileName, responseContent)` | APIレスポンスをファイルに保存 |
| `grabAndParseJsonFrom(selector)` | 要素からJSONをパース |
| `acceptCookiesIfVisible(selector, timeoutSec)` | Cookieバナーを検出時のみ閉じる |
| `forceClick(selector)` | `executeScript` によるクリック強制実行 |
| `waitAndFill(selector, value, timeoutSec)` | 要素出現待ち後に入力 |
| `scrollIntoView(selector)` | 要素をビューポート中央にスクロール |

#### `support/repoRoot.js`

リポジトリルートの絶対パスを返す定数モジュール。`tests/` 配下の深いサブフォルダから `fs` でファイルを扱う際に使う。`__dirname` + 手動の `..` カウントは移動時に壊れるため、このモジュールで代替する。

```js
const repoRoot = require('../../../support/repoRoot');
const dir = path.join(repoRoot, config.output); // .. を数えなくてよい
```

#### `support/envLoader.js`

ルート `.env` を読み込み後、`--profile` 引数に対応する `env/.env.<profile>` で上書きします。

### ENV プロファイル

| ファイル | 用途 |
|---|---|
| `env/.env.tframe.template` | 全ENV変数の定義・説明（リファレンス） |
| `env/.env.tframe.juku_test` | juku テスト環境 |
| `env/.env.tframe.juku_beta` | juku ベータ環境 |
| `env/.env.tframe.culture_test` | culture テスト環境 |
| `env/.env.tframe.culture_beta` | culture ベータ環境 |
| `env/.env.shimamura.template` | しまむら用テンプレート |
| `env/.env.shimamura.testgcp` 等 | しまむら各環境 |

---

*このドキュメントは手動で管理されています。構造変更時は合わせて更新してください。*
