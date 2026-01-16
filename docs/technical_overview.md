# テスト基盤の技術スタックとテスト別の利用API/補助モジュール一覧

## 技術スタック / ツール
- Node.js / npm / npx: `package.json`
- CodeceptJS（E2Eテストフレームワーク）: `package.json`, `codecept.conf.js`
- Playwright（CodeceptJSのヘルパー）: `package.json`, `codecept.conf.js`
- Allure Report（`allure-codeceptjs` プラグイン）: `package.json`, `codecept.conf.js`
- @codeceptjs/configure（共通プラグイン設定）: `package.json`, `codecept.conf.js`
- dotenv（`.env` / `env/.env.<profile>` ロード）: `package.json`, `support/envLoader.js`
- JSDoc（ドキュメント生成）: `package.json`, `jsdoc.json`
- docdash（JSDocテンプレート）: `package.json`, `jsdoc.json`
- Python（ツリー生成スクリプト）: `package.json`
- Windowsバッチ（テスト起動補助）: `Run_Shimamura_Syokai_Test.bat`

## 共通設定 / 補助モジュール
- 環境変数ローダー: `support/envLoader.js`（`.env` と `env/.env.<profile>` の読み分け）
- カスタムSteps: `support/steps_file.js`
  - `saveScreenshotWithTimestamp`, `saveLogToFile`, `grabAndParseJsonFrom`, `acceptCookiesIfVisible`, `forceClick`, `waitAndFill`, `scrollIntoView`
- CodeceptJS設定: `codecept.conf.js`
  - スイート定義、`helpers.Playwright`、プラグイン（allure / stepByStepReport / autoLogin）

