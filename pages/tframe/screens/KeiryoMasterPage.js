/**
 * @fileoverview tframe 経理画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');
const { isEnglish } = require('../../../support/utils');

module.exports = {
  /** 経理アイコンのセレクタ（日英） */
  locators: {
    accountingIconJa: 'a:has-text("経理")',
    accountingIconEn: 'a:has-text("Accounting")',
  },

  /**
   * メインメニューの経理アイコンをクリックする
   */
  clickKeiryoIcon() {
    I.say('【メインメニュー】経理アイコンをクリック');
    I.waitForElement(this.accountingIconLocator(), 10);
    I.click(this.accountingIconLocator());
  },

  /**
   * 現在の言語設定に合わせた経理アイコンのロケーターを返す
   * @returns {string} セレクタ文字列
   */
  accountingIconLocator() {
    return isEnglish() ? this.locators.accountingIconEn : this.locators.accountingIconJa;
  },

  ...createMenuNavigationMixin('tframe_accounting'),
};
