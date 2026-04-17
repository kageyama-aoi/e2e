/**
 * @fileoverview tframe JSON入力ページ Page Object
 */

const { I } = inject();

module.exports = {
  /** JSON入力ページの各要素セレクタ */
  locators: {
    jsonInputMenuLink: 'JSON入力',
    jsonTextarea: '#apiParams',
    executeButton: '実行',
    responseArea: 'pre',
    responseLabel: 'レスポンス',
  },

  /**
   * JSON入力ページへ遷移する
   */
  navigateToPage() {
    I.say('「JSON入力」ページへ遷移します。');
    I.click(this.locators.jsonInputMenuLink);
    I.seeElement(this.locators.jsonTextarea);
  },

  /**
   * JSON テキストエリアにパラメータを入力してAPIを実行する
   * @param {object} apiParams - リクエストボディとして送信する JSON オブジェクト
   */
  executeApi(apiParams) {
    I.say('APIを実行します。');
    I.fillField(this.locators.jsonTextarea, JSON.stringify(apiParams, null, 2));
    I.click(this.locators.executeButton);
    I.waitForText(this.locators.responseLabel, 10);
    I.seeElement(this.locators.responseArea);
  },
};
