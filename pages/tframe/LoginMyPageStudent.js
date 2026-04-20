/**
 * @fileoverview tframe 受講生マイページ ログイン Page Object
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
    I.amOnPage(process.env.LOGIN_MYPAGE_URL_STUDENT);
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
  },

  /**
   * マイページメニューのリンク一覧を抽出してログに出力する
   */
  async logMenuItems() {
    I.waitForElement('ul.menu li a', 5);
    const labels = await I.grabTextFromAll('ul.menu li a');
    const hrefs  = await I.grabAttributeFromAll('ul.menu li a', 'href');
    I.say('=== 受講生マイページ メニュー一覧 ===');
    labels.forEach((label, i) => {
      I.say(`[${i + 1}] ${label} → ${hrefs[i]}`);
    });
  }
};
