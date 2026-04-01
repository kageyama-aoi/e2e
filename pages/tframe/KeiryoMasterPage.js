const { I } = inject();
const assert = require('assert');

module.exports = {
  locators: {
    accountingIconJa: 'a:has-text("経理")',
    accountingIconEn: 'a:has-text("Accounting")',
  },

  clickKeiryoIcon() {
    I.say('【メインメニュー】経理アイコンをクリック');
    I.waitForElement(this.accountingIconLocator(), 10);
    I.click(this.accountingIconLocator());
  },

  async verifyMenuNavigation(menuDefinition) {
    for (const group of menuDefinition.groups) {
      for (const item of group.items) {
        await this.clickMenuItemAndVerify(item);
      }
    }
  },

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
    I.saveScreenshot(this.buildScreenshotName(itemName), true);
    await this.clickSearchIfPresentAndCapture(itemName);
  },

  buildScreenshotName(itemName) {
    const safeName = itemName.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
    return `tframe_accounting_${safeName}.png`;
  },

  buildSearchScreenshotName(itemName) {
    const safeName = itemName.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
    return `tframe_accounting_${safeName}_search.png`;
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

  accountingIconLocator() {
    return this.isEnglish() ? this.locators.accountingIconEn : this.locators.accountingIconJa;
  },

  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },

  buttonByTexts(texts) {
    const xpath = texts.map((text) => `contains(., '${text}')`).join(' or ');
    return locate({ xpath: `.//button[${xpath}]` });
  },
};
