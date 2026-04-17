/**
 * @fileoverview tframe 経理画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('./MenuNavigationMixin');

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
   * メニュー定義に従い全メニュー項目を順番に押下・検証する
   * @param {{groups: Array.<{items: Array.<{name: string, href: string, altName: string}>}>}} menuDefinition - メニュー定義
   * @returns {Promise.<void>}
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
   * @param {{name: string, href: string, altName: string}} item - メニュー項目
   * @returns {Promise.<void>}
   */
  async clickMenuItemAndVerify(item) {
    const itemName = item.name;
    const expectedHref = item.href;
    I.say(`【子メニュー押下】${itemName}`);
    const resolvedHref = expectedHref || await this.grabHrefByTexts([item.name, item.altName].filter(Boolean));

    if (expectedHref) {
      this.scrollToHref(expectedHref);
      I.waitForElement(locate(`a[href="${expectedHref}"]`), 10);
      this.clickLinkByHref(expectedHref);
    } else {
      this.scrollMenuToTexts([item.name, item.altName].filter(Boolean));
      this.clickLinkByTexts([item.name, item.altName].filter(Boolean));
    }

    I.wait(1);
    const currentUrl = await I.grabCurrentUrl();
    this.assertCurrentUrlMatches(currentUrl, resolvedHref);
    I.saveScreenshotWithTimestamp(this.buildScreenshotName(itemName), true);
    await this.clickSearchIfPresentAndCapture(itemName);
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
   * 複数テキストのいずれかに一致するリンクが画面内に表示されるようスクロールする
   * @param {Array.<string>} texts - 候補テキストの配列
   */
  scrollMenuToTexts(texts) {
    I.executeScript(
      ({ targetTexts }) => {
        const links = Array.from(document.querySelectorAll('a'));
        const target = links.find((link) =>
          targetTexts.some((text) => link.textContent && link.textContent.includes(text))
        );
        if (!target) return false;

        target.scrollIntoView({ block: 'center', inline: 'nearest' });
        return true;
      },
      { targetTexts: texts }
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
   * 複数テキストのいずれかに一致するリンクをクリックする
   * @param {Array.<string>} texts - 候補テキストの配列
   */
  clickLinkByTexts(texts) {
    I.executeScript(
      ({ targetTexts }) => {
        const links = Array.from(document.querySelectorAll('a'));
        const target = links.find((link) =>
          targetTexts.some((text) => link.textContent && link.textContent.includes(text))
        );
        if (!target) {
          throw new Error(`link not found: ${targetTexts.join(', ')}`);
        }
        target.click();
      },
      { targetTexts: texts }
    );
  },

  /**
   * 複数テキストのいずれかに一致するリンクの href を取得する
   * @param {Array.<string>} texts - 候補テキストの配列
   * @returns {Promise.<string|null>} href 属性値（見つからない場合 null）
   */
  async grabHrefByTexts(texts) {
    return I.executeScript(
      ({ targetTexts }) => {
        const links = Array.from(document.querySelectorAll('a'));
        const target = links.find((link) =>
          targetTexts.some((text) => link.textContent && link.textContent.includes(text))
        );
        return target ? target.getAttribute('href') : null;
      },
      { targetTexts: texts }
    );
  },

  /**
   * 現在の言語設定に合わせた経理アイコンのロケーターを返す
   * @returns {string} セレクタ文字列
   */
  accountingIconLocator() {
    return this.isEnglish() ? this.locators.accountingIconEn : this.locators.accountingIconJa;
  },

  /**
   * 言語設定が英語かどうかを返す
   * @returns {boolean} 英語の場合 true
   */
  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },

  ...createMenuNavigationMixin('tframe_accounting'),
};
