/**
 * @fileoverview tframe マスター画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');
const { isEnglish } = require('../../../support/tframe/utils');

module.exports = {
  /** マスターアイコンのセレクタ（日英） */
  locators: {
    masterIconJa: 'a:has-text("マスター")',
    masterIconEn: 'a:has-text("Master")',
  },

  /**
   * メインメニューのマスターアイコンをクリックする
   */
  clickMasterIcon() {
    I.say('【メインメニュー】マスターアイコンをクリック');
    I.waitForElement(this.masterIconLocator(), 10);
    I.click(this.masterIconLocator());
  },

  /**
   * 現在の言語設定に合わせたマスターアイコンのロケーターを返す
   * @returns {string} セレクタ文字列
   */
  masterIconLocator() {
    return isEnglish() ? this.locators.masterIconEn : this.locators.masterIconJa;
  },

  ...createMenuNavigationMixin('tframe_master'),
};
