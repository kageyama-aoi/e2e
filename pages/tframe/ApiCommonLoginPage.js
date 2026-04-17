/**
 * @fileoverview tframe 管理者API共通ログイン Page Object
 */

const { I } = inject();

module.exports = {
  /** API操作に使用するセレクタ */
  locators: {
    adminMenuLink: '管理者メニュー',
    loginLink: 'ログイン',
    executeButton: '実行',
    jsonInputLabel: 'JSON入力',
    personCategoryLabel: 'パーソンカテゴリ',
    responseLabel: 'レスポンス',
    loginIdInput: 'input[id="loginId"]',
    passwordInput: 'input[id="pwd"]',
    smsGroupSelect: 'select[id="smsgroup"]',
    responseArea: 'pre',
  },

  /**
   * APIテストページへ遷移し、パラメータを設定してAPIを実行、tcnTokenを抽出する
   * @param {string} loginId - ログインID（例: 講師ID）
   * @param {string} password - パスワード
   * @param {string} smsGroup - SMSグループ（例: '講師'）
   * @returns {Promise.<string>} 抽出されたtcnToken
   */
  async performApiTestAndExtractToken(loginId, password, smsGroup) {

    I.say('管理画面からAPIを実行し、レスポンスから個人情報（講師）アクセス用のトークンを抽出');
    I.click(this.locators.adminMenuLink);
    I.see(this.locators.jsonInputLabel);
    I.click(this.locators.loginLink);
    I.see(this.locators.personCategoryLabel);

    I.fillField(this.locators.loginIdInput, secret(loginId));
    I.fillField(this.locators.passwordInput, secret(password));
    I.selectOption(this.locators.smsGroupSelect, smsGroup);

    I.click(this.locators.executeButton);
    I.waitForText(this.locators.responseLabel, 10);

    const responseText = await I.grabTextFrom(this.locators.responseArea);

    const tokenMatch = responseText.match(/"tcnToken":\s*"([^"]+)"/);

    if (!tokenMatch || !tokenMatch[1]) {
      I.saveScreenshotWithTimestamp('token_extraction_failed.png');
      I.fail(`レスポンスからtcnTokenを抽出できませんでした。詳細は'token_extraction_failed.png'を確認してください。`);
    }

    const tcnToken = tokenMatch[1];
    console.log('抽出したtcnToken:', secret(tcnToken));

    return tcnToken;
  }
};
