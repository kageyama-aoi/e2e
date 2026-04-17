/**
 * @fileoverview tframe マイページ ログイン Page Object
 */

const { I } = inject();

module.exports = {
  /** ログインページの各入力要素セレクタ */
  locators: {
    usernameField: 'input[id="loginmodel-username"]',
    passwordField: 'input[id="loginmodel-password"]',
    loginButton: 'ログイン',
    logoutText: 'ログアウト',
  },

  /**
   * ログイン処理を実行する
   * @param {string} username - ユーザー名
   * @param {string} password - パスワード
   */
  login(username, password) {
    I.amOnPage(process.env.LOGIN_MYPAGE_URL);
    I.waitForElement(this.locators.usernameField, 5);
    I.fillField(this.locators.usernameField, username);
    I.fillField(this.locators.passwordField, secret(password));
    I.click(this.locators.loginButton);
  },

  /**
   * ログアウトテキストが表示されていることを確認する（ログイン成功の検証）
   */
  seeLogout() {
    I.waitForText(this.locators.logoutText, 10);
    I.see(this.locators.logoutText);
  }
};
