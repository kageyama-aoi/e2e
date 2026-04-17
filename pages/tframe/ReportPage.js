/**
 * @fileoverview tframe レポート画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('./MenuNavigationMixin');

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
   * 現在の言語設定に合わせたレポートアイコンのロケーターを返す
   * @returns {string} セレクタ文字列
   */
  reportIconLocator() {
    return this.isEnglish() ? this.locators.reportIconEn : this.locators.reportIconJa;
  },

  /**
   * 言語設定が英語かどうかを返す
   * @returns {boolean} 英語の場合 true
   */
  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },

  ...createMenuNavigationMixin('tframe_report'),
};
