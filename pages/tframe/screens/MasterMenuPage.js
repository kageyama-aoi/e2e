/**
 * @fileoverview tframe マスター画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');

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
   * 指定 href のリンクが画面内に表示されるようスクロールする
   * @param {string} href - スクロール先リンクの href
   */
  scrollToHref(href) {
    I.executeScript(
      ({ targetHref }) => {
        const target = document.querySelector(`a[href="${targetHref}"]`);
        if (!target) return false;
        target.scrollIntoView({ block: 'center', inline: 'nearest' });
        return true;
      },
      { targetHref: href }
    );
  },

  /**
   * 指定 href のリンクをクリックする
   * @param {string} href - クリックするリンクの href
   */
  clickLinkByHref(href) {
    I.executeScript(
      ({ targetHref }) => {
        const target = document.querySelector(`a[href="${targetHref}"]`);
        if (!target) {
          throw new Error(`link not found: ${targetHref}`);
        }
        target.click();
      },
      { targetHref: href }
    );
  },

  /**
   * 現在の言語設定に合わせたマスターアイコンのロケーターを返す
   * @returns {string} セレクタ文字列
   */
  masterIconLocator() {
    return this.isEnglish() ? this.locators.masterIconEn : this.locators.masterIconJa;
  },

  /**
   * 言語設定が英語かどうかを返す
   * @returns {boolean} 英語の場合 true
   */
  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },

  ...createMenuNavigationMixin('tframe_master'),
};
