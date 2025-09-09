const { I } = inject();

module.exports = {
  // TODO: しまむら用のログインページの実際の要素に合わせてセレクタを修正してください
  locators: {
    usernameField: 'input[name="user_name"]',
    passwordField: 'input[name="user_password"]',
    loginButton: 'ログイン',
    tantousyaNumberPromptText: '担当者番号を入力してください',
    tantousyaNumberField: 'input[name="idnumber"]',
    mainMenuButton: 'メインメニュー',
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

  /**
   * 担当者番号を入力してメインメニューへ進みます。
   * .env.shimamura に TESTGCP_SHIMAMURA_TANTOUSYA を設定する必要があります。
   */
  enterTantousyaNumberAndProceed() {
    I.say('担当者番号を入力してメインメニューへ進みます...');
    I.waitForText(this.locators.tantousyaNumberPromptText, 10); // 画面が変わるのを待つ
    const tantousyaNumber = process.env.TESTGCP_SHIMAMURA_TANTOUSYA;
    I.fillField(this.locators.tantousyaNumberField, tantousyaNumber);
    I.click(this.locators.mainMenuButton);
  }

};