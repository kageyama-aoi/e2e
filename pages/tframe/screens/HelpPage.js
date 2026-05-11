/**
 * @fileoverview tframe ヘルプ画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');
const { isEnglish } = require('../../../support/utils');

module.exports = {
  /** ヘルプアイコンのセレクタ（日英） */
  locators: {
    helpIconJa: 'a:has-text("ヘルプ")',
    helpIconEn: 'a:has-text("Help")',
  },

  /**
   * メインメニューのヘルプアイコンをクリックする
   */
  clickHelpIcon() {
    I.say('【メインメニュー】ヘルプアイコンをクリック');
    I.waitForElement(this.helpIconLocator(), 10);
    I.click(this.helpIconLocator());
  },

  /**
   * 現在の言語設定に合わせたヘルプアイコンのロケーターを返す
   * @returns {string} セレクタ文字列
   */
  helpIconLocator() {
    return isEnglish() ? this.locators.helpIconEn : this.locators.helpIconJa;
  },

  ...createMenuNavigationMixin('tframe_help'),
};
