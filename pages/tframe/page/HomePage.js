/**
 * @fileoverview tframe ホーム画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');

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
   * 現在の言語設定に合わせたホームアイコンのロケーターを返す
   * @returns {string} セレクタ文字列
   */
  homeIconLocator() {
    return this.isEnglish() ? this.locators.homeIconEn : this.locators.homeIconJa;
  },

  /**
   * 言語設定が英語かどうかを返す
   * @returns {boolean} 英語の場合 true
   */
  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },

  ...createMenuNavigationMixin('tframe_home'),
};
