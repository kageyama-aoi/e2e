# E2Eテスト リファクタリング提案

## 1. はじめに

このドキュメントは、`e2e` ディレクトリ内のテストコードベースを分析し、品質、保守性、拡張性を向上させるためのリファクタリング案をまとめたものです。
各提案には、現状の課題、具体的な改善案、そして期待される効果を記載しています。

## 2. 全体的な所感

CodeceptJSとPlaywrightを用いたE2Eテストの基本的な構造が整っています。特に、関心事を分離するためのPage Objectパターンが `codecept.conf.js` の `include` 設定から採用されていることが伺え、メンテナンス性の高いテストコードを目指す良い出発点であると感じます。

現状でもテストは機能しますが、設定ファイルの柔軟性向上や、今後のテストケース増加を見越した一般的な設計原則を適用することで、より堅牢でスケールしやすいテスト基盤を構築できると考えます。

---

## 3. リファクタリング提案一覧

### 【提案1】`codecept.conf.js`: テスト対象ファイルの動的な指定

*   **優先度:** 高
*   **対象箇所:** `c:\Users\kageyama\Tools\testcode\e2e\codecept.conf.js`
*   **現状の課題:**
    *   `tests` プロパティに `token_usage_test.js` という単一のファイルがハードコードされています。これにより、新しいテストファイルを追加したり、実行対象を切り替えたりするたびに、この設定ファイルを手動で変更する必要があり、手間がかかりメンテナンス性が低下します。
    *   `exclude` プロパティも同様に、ファイル名を直接指定しています。
*   **提案内容:**
    *   globパターンを利用して、`tests` ディレクトリ以下の特定の命名規則（例: `*_test.js`）に一致するファイルをすべてテスト対象とするように変更します。これにより、ファイルを追加するだけで自動的にテストスイートに含めることができます。
    ```javascript
    // 変更案
    exports.config = {
      // 'tests' ディレクトリ以下の `_test.js` で終わるファイルをすべて対象にする
      tests: './tests/**/*_test.js',
      // 'exclude' も必要であればglobパターンで見直す
      exclude: [
        // './tests/wip/*' // 例: wipディレクトリ以下を除外
      ],
      // ...
    }
    ```
*   **期待される効果:**
    *   テストファイルの追加・削除に対して設定ファイルが無変更で済むようになり、開発効率とメンテナンス性が向上します。
    *   実行したいテスト/したくないテストの管理が、ファイル名や配置ディレクトリのルールによって行えるようになります。

### 【提案2】`codecept.conf.js`: 設定の明確化と環境に応じた柔軟性の向上

*   **優先度:** 中
*   **対象箇所:** `c:\Users\kageyama\Tools\testcode\e2e\codecept.conf.js`
*   **現状の課題:**
    *   `helpers.Playwright.show` が `true` に固定されています。`setHeadlessWhen` によってCI環境などではヘッドレスモードになりますが、設定の意図が少し読み取りにくくなっています。
    *   不要な日本語コメントが残っています。
*   **提案内容:**
    *   `show` プロパティを環境変数 `HEADLESS` と明示的に連動させることで、設定の意図を明確にします。
    *   不要なコメント (`// 個人情報ページを追加`) を削除し、コードをクリーンに保ちます。
    ```javascript
    // 変更案
    helpers: {
      Playwright: {
        url: process.env.BASE_URL || 'http://localhost',
        // HEADLESS=true の場合は false、それ以外は true となり、意図が明確になる
        show: process.env.HEADLESS !== 'true',
        browser: 'chromium'
      }
    },
    include: {
      I: './steps_file.js',
      loginPage: './pages/LoginPage_Tframe.js',
      apiTestPage: './pages/ApiTestPage.js',
      personalInfoPage: './pages/PersonalInfoPage.js'
    },
    ```
*   **期待される効果:**
    *   設定の可読性が向上し、ローカル実行時とCI実行時の挙動の違いが理解しやすくなります。
    *   コードがクリーンになり、将来のメンテナンスが容易になります。

### 【提案3】Page Objectとテストコードの責務分離の徹底（一般的提案）

*   **優先度:** 中
*   **対象ファイル:** `tests/**/*.js`, `pages/**/*.js` （※ファイルはコンテキストに無いため、一般的な提案となります）
*   **現状の懸念点:**
    *   テストコード (`tests/` 内のファイル) に、セレクタ（例: `'#username'`）やページ操作の詳細なロジックが直接記述されている可能性があります。
*   **提案内容:**
    *   **Page Object (`pages/`):** ページ上のUI要素のセレクタと、それらを操作するメソッド（例: `login(user, pass)`, `clickSubmitButton()`）をすべてカプセル化します。
    *   **テストコード (`tests/`):** Page Objectのメソッドのみを呼び出して、テストシナリオ（例: 「有効なユーザーでログインし、マイページが表示されることを確認する」）を記述することに専念します。アサーション（`I.see()`, `I.dontSee()`など）はテストコードに記述します。
    ```javascript
    // 悪い例 (テストコード内)
    Scenario('login', ({ I }) => {
      I.fillField('#username', 'testuser');
      I.fillField('#password', 'password');
      I.click('button[type="submit"]');
      I.see('Welcome, testuser');
    });

    // 良い例
    // pages/LoginPage.js
    const { I } = inject();
    module.exports = {
      fields: {
        username: '#username',
        password: '#password',
      },
      submitButton: 'button[type="submit"]',

      login(username, password) {
        I.fillField(this.fields.username, username);
        I.fillField(this.fields.password, password);
        I.click(this.submitButton);
      }
    }

    // tests/login_test.js
    Scenario('login', ({ I, loginPage }) => {
      loginPage.login('testuser', 'password');
      I.see('Welcome, testuser');
    });
    ```
*   **期待される効果:**
    *   UIの変更（セレクタの変更など）があった場合、修正箇所がPage Objectに限定され、テストコードの変更が不要になります。
    *   テストコードが「何をしているか(What)」の記述に集中でき、可読性が大幅に向上します。
    *   同じページ操作を複数のテストで再利用しやすくなります。