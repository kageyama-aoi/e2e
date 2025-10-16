const { I } = inject();

module.exports = {
  // === LOCATORS ===
  locators: {
    jsonInputMenuLink: 'JSON入力',
    jsonTextarea: '#apiParams',
    executeButton: '実行',
    responseArea: 'pre', // Assuming the response appears in a <pre> tag
    responseLabel: 'レスポンス', // Assuming a label appears before the response
  },

  /**
   * Navigates to the JSON Input page.
   */
  navigateToPage() {
    I.say('「JSON入力」ページへ遷移します。');
    I.click(this.locators.jsonInputMenuLink);
    I.seeElement(this.locators.jsonTextarea);
  },

  /**
   * Fills the JSON textarea with the given parameters and executes the API call.
   * @param {object} apiParams - The JSON object to be sent as the request payload.
   */
  executeApi(apiParams) {
    I.say('APIを実行します。');

    // Fill the textarea with the formatted JSON string
    I.fillField(this.locators.jsonTextarea, JSON.stringify(apiParams, null, 2));

    // Execute the API call
    I.click(this.locators.executeButton);

    // Wait for the response to appear
    I.waitForText(this.locators.responseLabel, 10);
    I.seeElement(this.locators.responseArea);
  },
};
