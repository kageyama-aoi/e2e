/**
 * @fileoverview tframe コース画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('./MenuNavigationMixin');

module.exports = {
  /** コースアイコンのセレクタ（日英） */
  locators: {
    courseIconJa: 'a:has-text("コース")',
    courseIconEn: 'a:has-text("Course")',
  },

  /**
   * メインメニューのコースアイコンをクリックする
   */
  clickCourseIcon() {
    I.say('【メインメニュー】コースアイコンをクリック');
    I.waitForElement(this.courseIconLocator(), 10);
    I.click(this.courseIconLocator());
  },

  /**
   * 指定グループ名のリンクが表示されていることを確認する
   * @param {string} groupName - グループ名
   */
  seeGroup(groupName) {
    I.say(`【グループ確認】${groupName}`);
    this.scrollMenuToText(groupName);
    I.waitForElement(this.linkByText(groupName), 10);
    I.see(groupName);
  },

  /**
   * 指定メニュー項目のリンクが表示されていることを確認する
   * @param {string} itemName - メニュー項目名
   */
  seeMenuItem(itemName) {
    I.say(`【子メニュー確認】${itemName}`);
    this.scrollMenuToText(itemName);
    I.waitForElement(this.linkByText(itemName), 10);
    I.see(itemName);
  },

  /**
   * テキストに一致するリンクのロケーターを返す
   * @param {string} text - リンクテキスト
   * @returns {CodeceptJS.Locator} ロケーター
   */
  linkByText(text) {
    return locate('a').withText(text);
  },

  /**
   * テキストに一致するリンクが画面内に表示されるようスクロールする
   * @param {string} text - スクロール先リンクのテキスト
   */
  scrollMenuToText(text) {
    I.executeScript(
      ({ targetText }) => {
        const links = Array.from(document.querySelectorAll('a'));
        const target = links.find((link) => link.textContent && link.textContent.includes(targetText));
        if (!target) return false;

        target.scrollIntoView({ block: 'center', inline: 'nearest' });
        return true;
      },
      { targetText: text }
    );
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
   * メニュー項目に合わせたスクロール処理を行う（href 優先、なければテキスト）
   * @param {{name: string, href: string}} item - メニュー項目
   */
  scrollToItem(item) {
    const itemName = item.name;
    const expectedHref = item.href;
    if (expectedHref) {
      this.scrollToHref(expectedHref);
      return;
    }
    this.scrollMenuToText(itemName);
  },

  /**
   * メニュー項目に対応するリンクロケーターを返す（href 優先、なければテキスト）
   * @param {{name: string, href: string}} item - メニュー項目
   * @returns {CodeceptJS.Locator} ロケーター
   */
  itemLinkLocator(item) {
    const itemName = item.name;
    const expectedHref = item.href;
    if (expectedHref) {
      return locate(`a[href="${expectedHref}"]`);
    }
    return this.linkByText(itemName);
  },

  /**
   * 現在の言語設定に合わせたコースアイコンのロケーターを返す
   * @returns {string} セレクタ文字列
   */
  courseIconLocator() {
    return this.isEnglish() ? this.locators.courseIconEn : this.locators.courseIconJa;
  },

  /**
   * 言語設定が英語かどうかを返す
   * @returns {boolean} 英語の場合 true
   */
  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },

  ...createMenuNavigationMixin('tframe_course'),
};
