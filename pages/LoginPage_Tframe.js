const { I } = inject();

module.exports = {
  // ログインページの要素（セレクタ）を定義します
  fields: {
    username: 'input[id="loginmodel-username"]',
    password: 'input[id="loginmodel-password"]',
  },
  buttons: {
    login: 'サインイン',
  },

  /**
   * ログイン処理を実行します
   * @param {string} username - ユーザー名
   * @param {string} password - パスワード
   */
  login(username, password) {
    I.amOnPage(process.env.LOGIN_TFRAME_URL);
    I.waitForElement(this.fields.username, 5);
    I.fillField(this.fields.username, username);
    I.fillField(this.fields.password, secret(password));
    I.click(this.buttons.login);
  },

  // ログイン成功後の状態（ログアウトボタンの表示）を確認します
  seeLogout() {
    I.waitForText('ログアウト', 10);
    I.see('ログアウト');
  }
};