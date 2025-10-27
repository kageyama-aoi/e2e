# E2Eテスト

## 1. メンテナンス対象のファイル

このプロジェクトでメンテナンスの主な対象となるのは、以下のファイルです。

*   `tests/shimamura/` 配下のテストスクリプト
*   `tests/tframe/` 配下のテストスクリプト
*   `pages/` 配下のページオブジェクトファイル
*   `codecept.conf.js` （CodeceptJSの設定ファイル）
*   `package.json` （特に`scripts`セクション）

## 2. プログラムの実行方法

### しまむら (`shimamura`) のテストを実行

`npm`スクリプト（推奨）:
```bash
npm run test_s
```

または、直接コマンドを実行:
```bash
npx codeceptjs run ./tests/shimamura/shimamura_syokai_touroku.js --steps --debug --profile shimamura
npx codeceptjs run ./tests/shimamura/*_test.js --profile shimamura
```

### t-frame (`tframe`) のテストを実行

`npm`スクリプト（推奨）:
```bash
npm run test_t
```

または、直接コマンドを実行:
```bash
npx codeceptjs run ./tests/tframe/*_test.js
```

## 3. 現在抱えている問題・課題点

*   画面遷移の動作が不安定な箇所があり、`wait` を使って一時的に安定させている。

## 4. 今後改善していきたい目標

*   AutoLogin機能を実装し、テスト実行の効率を上げる。
*   コードの可読性を向上させ、メンテナンスしやすくする。

## 5. ファイル構成

```C:\Users\kageyama\Tools\testcode\e2e\
├───.gitignore
├───codecept.conf.js
├───jsconfig.json
├───package-lock.json
├───package.json
├───README.md
├───steps.d.ts
├───allure-results\
├───data\
│   └───tframe\
├───doc\
│   ├───class_diagram.md
│   ├───refactoring_proposal.txt
│   ├───refactoring_suggestions.md
│   ├───sequence_diagram_shimamura_login.md
│   ├───sequence_diagram_token_usage_test.md
│   ├───改善点.txt
│   └───追加要望.txt
├───node_modules\...
├───output\
├───pages\
│   ├───shimamura\
│   └───tframe\
├───support\
│   └───steps_file.js
└───tests\
    ├───shimamura\
    ├───smoke\
    └───tframe\
```