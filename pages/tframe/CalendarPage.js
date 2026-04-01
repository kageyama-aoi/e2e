const { I } = inject();
const assert = require('assert');

module.exports = {
  locators: {
    calendarIconJa: 'a:has-text("カレンダー")',
    calendarIconEn: 'a:has-text("Calendar")',
  },

  clickCalendarIcon() {
    I.say('【メインメニュー】カレンダーアイコンをクリック');
    I.waitForElement(this.calendarIconLocator(), 10);
    I.click(this.calendarIconLocator());
  },

  async verifyMenuNavigation(menuDefinition) {
    for (const group of menuDefinition.groups) {
      for (const item of group.items) {
        await this.clickMenuItemAndVerify(item);
      }
    }
  },

  async clickMenuItemAndVerify(item) {
    I.say(`【子メニュー押下】${item.name}`);
    this.scrollToHref(item.href);
    I.waitForElement(locate(`a[href="${item.href}"]`), 10);
    this.clickLinkByHref(item.href);
    const currentUrl = await this.waitForCurrentUrlMatch(item.href, 10);
    this.assertCurrentUrlMatches(currentUrl, item.href);
    I.saveScreenshot(this.buildScreenshotName(item.name), true);
    await this.clickSearchIfPresentAndCapture(item.name);
  },

  buildScreenshotName(itemName) {
    const safeName = itemName.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
    return `tframe_calendar_${safeName}.png`;
  },

  buildSearchScreenshotName(itemName) {
    const safeName = itemName.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
    return `tframe_calendar_${safeName}_search.png`;
  },

  assertCurrentUrlMatches(currentUrl, expectedHref) {
    const normalizedCurrentUrl = decodeURIComponent(currentUrl);
    const normalizedExpectedHref = decodeURIComponent(expectedHref);
    assert(
      normalizedCurrentUrl.includes(normalizedExpectedHref),
      `expected current url to include ${normalizedExpectedHref}, but found ${normalizedCurrentUrl}`
    );
  },

  async clickSearchIfPresentAndCapture(itemName) {
    const searchButton = this.searchButton();
    const visibleCount = await I.grabNumberOfVisibleElements(searchButton);
    if (visibleCount === 0) {
      I.say(`【検索スキップ】${itemName} に検索ボタンなし`);
      return;
    }

    I.say(`【検索押下】${itemName}`);
    const beforeSource = await I.grabSource();
    I.click(searchButton);
    const changed = await this.waitForPageChange(beforeSource, 5);
    if (!changed) {
      I.say(`【検索後変化なし】${itemName}`);
      return;
    }
    I.saveScreenshot(this.buildSearchScreenshotName(itemName), true);
  },

  async waitForPageChange(beforeSource, maxSeconds) {
    for (let index = 0; index < maxSeconds; index += 1) {
      I.wait(1);
      const afterSource = await I.grabSource();
      if (afterSource !== beforeSource) {
        return true;
      }
    }
    return false;
  },

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

  searchButton() {
    return this.buttonByTexts(['検索', 'Search']);
  },

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

  calendarIconLocator() {
    return this.isEnglish() ? this.locators.calendarIconEn : this.locators.calendarIconJa;
  },

  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },

  buttonByTexts(texts) {
    const xpath = texts.map((text) => `contains(., '${text}')`).join(' or ');
    return locate({ xpath: `.//button[${xpath}]` });
  },
};
