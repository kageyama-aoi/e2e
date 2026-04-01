const { I } = inject();

module.exports = {
  // ログインページの要素（セレクタ）を定義します
  locators: {
    usernameField: 'input[id="loginmodel-username"]',
    passwordField: 'input[id="loginmodel-password"]',
    languageSelect: 'select[name="tflanguage"]',
    loginButton: 'button[type="submit"]',
    logoutLink: 'a:has-text("ログアウト"), a:has-text("Logout")',
  },

  /**
   * ログイン処理を実行します
   * @param {string} username - ユーザー名
   * @param {string} password - パスワード
   */
  login(username, password) {
    I.amOnPage(process.env.LOGIN_TFRAME_URL);
    I.waitForElement(this.locators.usernameField, 5);
    this.selectLanguage(process.env.TFRAME_LANGUAGE);
    I.fillField(this.locators.usernameField, username);
    I.fillField(this.locators.passwordField, secret(password));
    I.click(this.locators.loginButton);
  },

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

  // ログイン成功後の状態（ログアウトボタンの表示）を確認します
  seeLogout() {
    I.waitForElement(this.locators.logoutLink, 10);
  }
};
