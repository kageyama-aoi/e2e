/**
 * @fileoverview tframe ヘルプ画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');

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
   * メニュー定義に従い全メニュー項目を順番に押下・検証する
   * @param {{groups: Array.<{items: Array.<{name: string, href: string}>}>}} menuDefinition - メニュー定義
   */
  async verifyMenuNavigation(menuDefinition) {
    for (const group of menuDefinition.groups) {
      for (const item of group.items) {
        await this.clickMenuItemAndVerify(item);
      }
    }
  },

  /**
   * 1つのメニュー項目を押下し、URL遷移・スクリーンショットを検証する
   * @param {{name: string, href: string}} item - メニュー項目
   */
  async clickMenuItemAndVerify(item) {
    I.say(`【子メニュー押下】${item.name}`);
    I.amOnPage(item.href);
    const currentUrl = await this.waitForCurrentUrlMatch(item.href, 10);
    this.assertCurrentUrlMatches(currentUrl, item.href);
    I.saveScreenshotWithTimestamp(this.buildScreenshotName(item.name), true);
    await this.clickSearchIfPresentAndCapture(item.name);
  },

  /**
   * 現在URLが期待hrefを含むまで最大N秒ポーリングする
   * @param {string} expectedHref - 期待するhref
   * @param {number} maxSeconds - 最大待機秒数
   * @returns {Promise.<string>} マッチした（またはタイムアウト時の）URL
   */
  async waitForCurrentUrlMatch(expectedHref, maxSeconds) {
    for (let index = 0; index < maxSeconds; index += 1) {
      const currentUrl = await I.grabCurrentUrl();
      if (decodeURIComponent(currentUrl).includes(decodeURIComponent(expectedHref))) {
        return currentUrl;
      }
      I.wait(1);
    }
    return I.grabCurrentUrl();
  },

  /**
   * 現在の言語設定に合わせたヘルプアイコンのロケーターを返す
   * @returns {string} セレクタ文字列
   */
  helpIconLocator() {
    return this.isEnglish() ? this.locators.helpIconEn : this.locators.helpIconJa;
  },

  /**
   * 言語設定が英語かどうかを返す
   * @returns {boolean} 英語の場合 true
   */
  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },

  ...createMenuNavigationMixin('tframe_help'),
};
