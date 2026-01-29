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
    I.say('=== ログイン 開始 ===');
    I.say('【ログイン】認証情報の入力');
    I.amOnPage('/');
    I.waitForElement(locators_2.usernameField, 5);
    I.fillField(locators_2.usernameField, process.env.SHIMAMURA_USER);
    I.fillField(locators_2.passwordField, process.env.SHIMAMURA_PASSWORD);
    I.say('【ログイン】実行');
    I.click('ログイン');
    I.see('担当者番号を入力してください．', 'tbody');
    I.say('=== ログイン 終了 ===');
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
    I.say('=== 担当者番号入力 開始 ===');
    // I.click('操作者変更');
    const linkLocator = locate('a.myAreaLink').withText('操作者変更')

    const count = await I.grabNumberOfVisibleElements(linkLocator);
    if (count > 0) {
      I.say('【操作者変更】リンクをクリック');
      I.click(linkLocator);
    } else {
      I.say('【操作者変更】リンクがないためスキップ');
    }

    I.say(`【担当者番号入力】[${tantousyaNumber}] を入力してメインメニューへ`);
    I.waitForText(promt.tantousyaNumberPromptText, 5); // 画面が変わるのを待つ
    I.fillField(locators_2.tantousyaNumberField, String(tantousyaNumber));
    I.say('【メインメニュー】遷移');
    I.click('メインメニュー');
    I.say('=== 担当者番号入力 終了 ===');
  }

};
