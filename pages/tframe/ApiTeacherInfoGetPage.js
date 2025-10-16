const { I } = inject();

module.exports = {
  // --- Elements
  locators: {
    personalInfoLink: '#api_technoAdmin_teacherApi',
    tcnTokenInput: 'input[id="tcnToken"]',
    executeButton: '実行',
    responseArea: 'pre',
    personalInfoAcquisitionLinkText: '個人情報取得',
    personalInfoTitle: '個人情報',
    responseLabel: 'レスポンス',
  },

  // --- Actions
  /**
   * 個人情報取得ページへ遷移します。
   */
  navigateToPersonalInfo() {
    I.say('個人情報取得ページへ遷移します。');
    I.click(this.locators.personalInfoAcquisitionLinkText, this.locators.personalInfoLink);
    I.see(this.locators.personalInfoTitle);
  },

  /**
   * トークンを使って個人情報を取得します。
   * @param {string} token - APIの実行に使用するtcnToken
   */
  fetchInfoWithToken(token) {
    I.say('トークンを使って個人情報取得APIを実行します。');
    I.fillField(this.locators.tcnTokenInput, secret(token));
    I.click(this.locators.executeButton);
    I.waitForText(this.locators.responseLabel, 10);
  },
};