const { I } = inject();

const locators_2 = {
  usernameField: 'input[name="user_name"]',
  passwordField: 'input[name="user_password"]',
  tantousyaNumberField: 'input[name="idnumber"]',
};

const messages_2 = {
  tantousyaPrompt: '担当者番号を入力してください．',
  mainMenuKeyword: '管理',
};

const promt = {
  tantousyaNumberPromptText: '担当者番号を入力してください',
}

module.exports = {
  locators_2,
  messages_2,
  /**
   * ログイン処理を実行します
   * @param {string} username - ユーザー名
   * @param {string} password - パスワード
   */
  // login(username, password) {
  login() {
    I.say('AutoLoginへ進みます...');
    I.amOnPage('/');
    I.waitForElement(locators_2.usernameField, 5);
    I.fillField(locators_2.usernameField, process.env.SHIMAMURA_USER);
    I.fillField(locators_2.passwordField, process.env.SHIMAMURA_PASSWORD);
    I.click('ログイン');
    I.see('担当者番号を入力してください．', 'tbody');
  },

  // ログイン済みかの簡易チェック
  seeLoggedIn() {
    I.amOnPage('/');
    I.see(messages_2.mainMenuKeyword, 'tbody');
  },

  /**
   * 担当者番号を入力してメインメニューへ進みます。
   * @param {string} tantousyaNumber - 担当者番号
   */
  async enterTantousyaNumberAndProceed(tantousyaNumber) {
    // I.click('操作者変更');
    const linkLocator = locate('a.myAreaLink').withText('操作者変更')

    const count = await I.grabNumberOfVisibleElements(linkLocator);
    if (count > 0) {
      I.say('操作者変更リンクをクリックします');
      I.click(linkLocator);
    } else {
      I.say('操作者変更リンクが見つからないのでスキップします');
    }

    I.say(`担当者番号[${tantousyaNumber}]を入力してメインメニューへ進みます...`);
    I.waitForText(promt.tantousyaNumberPromptText, 5); // 画面が変わるのを待つ
    I.fillField(locators_2.tantousyaNumberField, String(tantousyaNumber));
    I.click('メインメニュー');
  }

};