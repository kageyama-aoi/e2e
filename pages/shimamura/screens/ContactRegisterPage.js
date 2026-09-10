'use strict';

const { I } = inject();
const { URLS, TIMEOUTS, BASE_URL } = require('../../../support/shimamura/constants');

module.exports = {

  locators: {
    saveButton: 'input[name="save_button"]',
  },

  /**
   * 問合せ登録画面へ直接遷移します。
   */
  navigateToContactRegister() {
    I.say('【問合せ登録】URL 直遷移');
    I.amOnPage(BASE_URL + URLS.CONTACT_REGISTER);
    I.waitForElement(this.locators.saveButton, TIMEOUTS.SCREEN);
  },

};
