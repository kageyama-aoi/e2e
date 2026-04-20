/**
 * @fileoverview tframe 管理者ログインページ
 */

const { I } = inject();

module.exports = {
  /** ログインページの各入力要素セレクタ */
  locators: {
    usernameField: 'input[id="loginmodel-username"]',
    passwordField: 'input[id="loginmodel-password"]',
    languageSelect: 'select[name="tflanguage"]',
    loginButton: 'button[type="submit"]',
    logoutLink: 'a:has-text("ログアウト"), a:has-text("Logout")',
  },

  /**
   * ログイン処理を実行する
   * @param {string} username - ユーザー名
   * @param {string} password - パスワード
   */
  login(username, password) {
    I.amOnPage(process.env.BASE_URL);
    I.waitForElement(this.locators.usernameField, 5);
    this.selectLanguage(process.env.TFRAME_LANGUAGE);
    I.fillField(this.locators.usernameField, username);
    I.fillField(this.locators.passwordField, secret(password));
    I.click(this.locators.loginButton);
  },

  /**
   * 表示言語を選択する（TFRAME_LANGUAGE 未指定時はスキップ）
   * @param {string} language - 言語コードまたは言語名（例: 'ja' / 'en'）
   */
  selectLanguage(language) {
    if (!language) {
      I.say('【言語選択スキップ】TFRAME_LANGUAGE 未指定');
      return;
    }

    const normalizedLanguage = this.normalizeLanguage(language);
    I.say(`【言語選択】${normalizedLanguage}`);
    I.waitForElement(this.locators.languageSelect, 5);
    I.selectOption(this.locators.languageSelect, normalizedLanguage);
  },

  /**
   * 言語指定文字列を正規化する（'ja' / 'en' に統一）
   * @param {string} language - 入力言語文字列
   * @returns {string} 正規化済み言語コード
   */
  normalizeLanguage(language) {
    const normalized = String(language).trim().toLowerCase();
    if (normalized === 'ja' || normalized === '日本語') {
      return 'ja';
    }
    if (normalized === 'en' || normalized === 'us english' || normalized === 'english') {
      return 'en';
    }
    return normalized;
  },

  /**
   * ログアウトリンクが表示されていることを確認する（ログイン成功の検証）
   */
  seeLogout() {
    I.waitForElement(this.locators.logoutLink, 10);
  }
};
