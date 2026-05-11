/**
 * @fileoverview tframe レポート画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');
const { isEnglish } = require('../../../support/utils');

module.exports = {
  /** レポートアイコンのセレクタ（日英） */
  locators: {
    reportIconJa: 'a:has-text("レポート")',
    reportIconEn: 'a:has-text("Report")',
  },

  /**
   * メインメニューのレポートアイコンをクリックする
   */
  clickReportIcon() {
    I.say('【メインメニュー】レポートアイコンをクリック');
    I.waitForElement(this.reportIconLocator(), 10);
    I.click(this.reportIconLocator());
  },

  /**
   * 現在の言語設定に合わせたレポートアイコンのロケーターを返す
   * @returns {string} セレクタ文字列
   */
  reportIconLocator() {
    return isEnglish() ? this.locators.reportIconEn : this.locators.reportIconJa;
  },

  ...createMenuNavigationMixin('tframe_report'),
};
