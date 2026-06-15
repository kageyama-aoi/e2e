/**
 * @fileoverview しまむら ログインページ Page Object
 */

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
   * 環境変数のユーザー情報でログインする
   */
  async login() {
    I.say('=== ログイン 開始 ===');
    I.say('【ログイン】認証情報の入力');
    I.amOnPage('/');
    I.waitForElement(locators_2.usernameField, 5);
    I.executeScript(([user, pass]) => {
      document.querySelector('input[name="user_name"]').value = user;
      document.querySelector('input[name="user_password"]').value = pass;
    }, [process.env.SHIMAMURA_USER, process.env.SHIMAMURA_PASSWORD]);
    I.say('【ログイン】実行');
    I.click('ログイン');
    const count = await I.grabNumberOfVisibleElements(locate('input[name="idnumber"]'));
    if (count > 0) {
      I.see(messages_2.tantousyaPrompt, 'tbody');
    }
    I.say('=== ログイン 終了 ===');
  },

  /**
   * ログイン済みかどうかを簡易チェックする（メインメニューキーワードの存在確認）
   */
  seeLoggedIn() {
    I.amOnPage('/');
    I.see(messages_2.mainMenuKeyword, 'tbody');
  },

  /**
   * 担当者番号を入力してメインメニューへ進む
   * @param {string} tantousyaNumber - 担当者番号
   * @returns {Promise.<void>}
   */
  async enterTantousyaNumberAndProceed(tantousyaNumber) {
    I.say('=== 担当者番号入力 開始 ===');
    const linkLocator = locate('a.myAreaLink').withText('操作者変更');

    const count = await I.grabNumberOfVisibleElements(linkLocator);
    if (count > 0) {
      I.say('【操作者変更】リンクをクリック');
      I.click(linkLocator);
    } else {
      I.say('【操作者変更】リンクがないためスキップ');
    }

    const promptCount = await I.grabNumberOfVisibleElements(locate('input[name="idnumber"]'));
    if (promptCount === 0) {
      I.say('【担当者番号入力】入力フィールドが表示されていないためスキップ');
      I.say('=== 担当者番号入力 終了（スキップ） ===');
      return;
    }

    I.say(`【担当者番号入力】[${tantousyaNumber}] を入力してメインメニューへ`);
    I.waitForText(promt.tantousyaNumberPromptText, 5);
    I.fillField(locators_2.tantousyaNumberField, String(tantousyaNumber));
    I.say('【メインメニュー】遷移');
    I.click('メインメニュー');
    I.say('=== 担当者番号入力 終了 ===');
  }

};
