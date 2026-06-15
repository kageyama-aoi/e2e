/**
 * @fileoverview tframe Eメール画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');
const { isEnglish } = require('../../../support/tframe/utils');

module.exports = {
  /** Eメールアイコンのセレクタ（日英） */
  locators: {
    emailIconJa: 'a:has-text("Eメール")',
    emailIconEn: 'a:has-text("Email")',
  },

  /**
   * メインメニューのEメールアイコンをクリックする
   */
  clickEmailIcon() {
    I.say('【メインメニュー】Eメールアイコンをクリック');
    I.waitForElement(this.emailIconLocator(), 10);
    I.click(this.emailIconLocator());
  },

  /**
   * メニュー定義に従いグループ・項目の表示を検証する（任意グループはスキップ可）
   * @param {{groups: Array.<{name: string, optional: boolean, items: Array.<{name: string}>}>}} menuDefinition - メニュー定義
   * @returns {Promise.<void>}
   */
  async verifyMenuStructure(menuDefinition) {
    for (const group of menuDefinition.groups) {
      if (group.optional && !(await this.isGroupVisible(group.name))) {
        I.say(`【任意グループスキップ】${group.name}`);
        continue;
      }
      this.seeGroup(group.name);
      for (const item of group.items) {
        this.seeMenuItem(item.name);
      }
    }
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
   * 指定グループが画面上に表示されているかを確認する
   * @param {string} groupName - グループ名
   * @returns {Promise.<boolean>} 表示されている場合 true
   */
  async isGroupVisible(groupName) {
    this.scrollMenuToText(groupName);
    const visibleCount = await I.grabNumberOfVisibleElements(this.linkByText(groupName));
    return visibleCount > 0;
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
   * 現在の言語設定に合わせたEメールアイコンのロケーターを返す
   * @returns {string} セレクタ文字列
   */
  emailIconLocator() {
    return isEnglish() ? this.locators.emailIconEn : this.locators.emailIconJa;
  },

  ...createMenuNavigationMixin('tframe_email'),
};
