const { I } = inject();

module.exports = {
  // ログインページの要素（セレクタ）を定義します
  locators: {
    usernameField: 'input[id="loginmodel-username"]',
    passwordField: 'input[id="loginmodel-password"]',
    loginButton: 'サインイン',
    logoutText: 'ログアウト',
  },

  /**
   * ログイン処理を実行します
   * @param {string} username - ユーザー名
   * @param {string} password - パスワード
   */
  login(username, password) {
    I.amOnPage(process.env.LOGIN_TFRAME_URL);
    I.waitForElement(this.locators.usernameField, 5);
    I.fillField(this.locators.usernameField, username);
    I.fillField(this.locators.passwordField, secret(password));
    I.click(this.locators.loginButton);
  },

  // ログイン成功後の状態（ログアウトボタンの表示）を確認します
  seeLogout() {
    I.waitForText(this.locators.logoutText, 10);
    I.see(this.locators.logoutText);
  }
};