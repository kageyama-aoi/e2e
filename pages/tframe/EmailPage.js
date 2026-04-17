/**
 * @fileoverview tframe Eメール画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('./MenuNavigationMixin');

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
      const itemLink = this.itemLinkLocator(item);
      this.scrollToItem(item);
      I.waitForElement(itemLink, 10);
      I.click(itemLink);
    } else {
      this.clickLinkByTexts([item.name, item.altName].filter(Boolean));
    }

    I.wait(1);
    const currentUrl = await I.grabCurrentUrl();
    this.assertCurrentUrlMatches(currentUrl, resolvedHref);
    I.saveScreenshotWithTimestamp(this.buildScreenshotName(itemName), true);
    await this.clickSearchIfPresentAndCapture(itemName);
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
   * メニュー項目に合わせたスクロール処理を行う（href 優先、なければテキスト）
   * @param {{name: string, href: string, altName: string}} item - メニュー項目
   */
  scrollToItem(item) {
    const itemName = item.name;
    const expectedHref = item.href;
    if (expectedHref) {
      this.scrollToHref(expectedHref);
      return;
    }
    this.scrollMenuToTexts([itemName, item.altName].filter(Boolean));
  },

  /**
   * メニュー項目に対応するリンクロケーターを返す（href 優先、なければテキスト）
   * @param {{name: string, href: string, altName: string}} item - メニュー項目
   * @returns {CodeceptJS.Locator} ロケーター
   */
  itemLinkLocator(item) {
    const itemName = item.name;
    const expectedHref = item.href;
    if (expectedHref) {
      return locate(`a[href="${expectedHref}"]`);
    }
    return this.linkByTexts([itemName, item.altName].filter(Boolean));
  },

  /**
   * 現在の言語設定に合わせたEメールアイコンのロケーターを返す
   * @returns {string} セレクタ文字列
   */
  emailIconLocator() {
    return this.isEnglish() ? this.locators.emailIconEn : this.locators.emailIconJa;
  },

  /**
   * 言語設定が英語かどうかを返す
   * @returns {boolean} 英語の場合 true
   */
  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },

  /**
   * 複数テキストのいずれかに一致するリンクの XPath ロケーターを返す
   * @param {Array.<string>} texts - 候補テキストの配列
   * @returns {CodeceptJS.Locator} XPath ロケーター
   */
  linkByTexts(texts) {
    const xpath = texts.map((text) => `contains(., '${text}')`).join(' or ');
    return locate({ xpath: `.//a[${xpath}]` });
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

  ...createMenuNavigationMixin('tframe_email'),
};
