/**
 * @fileoverview tframe ホーム画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');
const { isEnglish } = require('../../../support/utils');

module.exports = {
  /** ホームアイコンのセレクタ（日英） */
  locators: {
    homeIconJa: 'a:has-text("ホーム")',
    homeIconEn: 'a:has-text("Home")',
  },

  /**
   * メインメニューのホームアイコンをクリックする
   */
  clickHomeIcon() {
    I.say('【メインメニュー】ホームアイコンをクリック');
    I.waitForElement(this.homeIconLocator(), 10);
    I.click(this.homeIconLocator());
  },

  /**
   * ホーム画面が表示されていることを確認しスクリーンショットを撮影する
   */
  verifyHomeLoaded() {
    I.say('【ホーム画面確認】ホーム画面が表示されていることを確認');
    I.waitForElement(this.homeIconLocator(), 10);
    I.saveScreenshotWithTimestamp('tframe_home.png', true);
  },

  /**
   * 現在の言語設定に合わせたホームアイコンのロケーターを返す
   * @returns {string} セレクタ文字列
   */
  homeIconLocator() {
    return isEnglish() ? this.locators.homeIconEn : this.locators.homeIconJa;
  },

  ...createMenuNavigationMixin('tframe_home'),
};
