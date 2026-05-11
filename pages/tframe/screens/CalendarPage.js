/**
 * @fileoverview tframe カレンダー画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');
const { isEnglish } = require('../../../support/utils');

module.exports = {
  /** カレンダーアイコンのセレクタ（日英） */
  locators: {
    calendarIconJa: 'a:has-text("カレンダー")',
    calendarIconEn: 'a:has-text("Calendar")',
  },

  /**
   * メインメニューのカレンダーアイコンをクリックする
   */
  clickCalendarIcon() {
    I.say('【メインメニュー】カレンダーアイコンをクリック');
    I.waitForElement(this.calendarIconLocator(), 10);
    I.click(this.calendarIconLocator());
  },

  /**
   * 現在の言語設定に合わせたカレンダーアイコンのロケーターを返す
   * @returns {string} セレクタ文字列
   */
  calendarIconLocator() {
    return isEnglish() ? this.locators.calendarIconEn : this.locators.calendarIconJa;
  },

  ...createMenuNavigationMixin('tframe_calendar'),
};
