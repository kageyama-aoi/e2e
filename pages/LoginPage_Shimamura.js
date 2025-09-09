const { I } = inject();

module.exports = {
  // TODO: しまむら用のログインページの実際の要素に合わせてセレクタを修正してください
  locators: {
    usernameField: 'input[name="user_name"]', // 例: 'input[name="email"]'
    passwordField: 'input[name="user_password"]', // 例: 'input[name="password"]'
    loginButton: 'ログイン', // 例: 'button[type="submit"]'
    logoutText: 'ログアウト',
  },

  /**
   * ログイン処理を実行します
   * @param {string} username - ユーザー名
   * @param {string} password - パスワード
   */
  login(username, password) {
    // .env.shimamura で定義されたURLを使用します
    I.amOnPage(process.env.LOGIN_SHIMAMURA_URL);
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