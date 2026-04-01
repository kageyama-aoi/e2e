const { I } = inject();
const assert = require('assert');

module.exports = {
  locators: {
    emailIconJa: 'a:has-text("Eメール")',
    emailIconEn: 'a:has-text("Email")',
  },

  clickEmailIcon() {
    I.say('【メインメニュー】Eメールアイコンをクリック');
    I.waitForElement(this.emailIconLocator(), 10);
    I.click(this.emailIconLocator());
  },

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

  async verifyMenuNavigation(menuDefinition) {
    for (const group of menuDefinition.groups) {
      for (const item of group.items) {
        await this.clickMenuItemAndVerify(item);
      }
    }
  },

  seeGroup(groupName) {
    I.say(`【グループ確認】${groupName}`);
    this.scrollMenuToText(groupName);
    I.waitForElement(this.linkByText(groupName), 10);
    I.see(groupName);
  },

  async isGroupVisible(groupName) {
    this.scrollMenuToText(groupName);
    const visibleCount = await I.grabNumberOfVisibleElements(this.linkByText(groupName));
    return visibleCount > 0;
  },

  seeMenuItem(itemName) {
    I.say(`【子メニュー確認】${itemName}`);
    this.scrollMenuToText(itemName);
    I.waitForElement(this.linkByText(itemName), 10);
    I.see(itemName);
  },

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
    I.saveScreenshot(this.buildScreenshotName(itemName), true);
    await this.clickSearchIfPresentAndCapture(itemName);
  },

  buildScreenshotName(itemName) {
    const safeName = itemName.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
    return `tframe_email_${safeName}.png`;
  },

  buildSearchScreenshotName(itemName) {
    const safeName = itemName.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
    return `tframe_email_${safeName}_search.png`;
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

  linkByText(text) {
    return locate('a').withText(text);
  },

  searchButton() {
    return this.buttonByTexts(['検索', 'Search']);
  },

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

  scrollToItem(item) {
    const itemName = item.name;
    const expectedHref = item.href;
    if (expectedHref) {
      this.scrollToHref(expectedHref);
      return;
    }
    this.scrollMenuToTexts([itemName, item.altName].filter(Boolean));
  },

  itemLinkLocator(item) {
    const itemName = item.name;
    const expectedHref = item.href;
    if (expectedHref) {
      return locate(`a[href="${expectedHref}"]`);
    }
    return this.linkByTexts([itemName, item.altName].filter(Boolean));
  },

  emailIconLocator() {
    return this.isEnglish() ? this.locators.emailIconEn : this.locators.emailIconJa;
  },

  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },

  linkByTexts(texts) {
    const xpath = texts.map((text) => `contains(., '${text}')`).join(' or ');
    return locate({ xpath: `.//a[${xpath}]` });
  },

  buttonByTexts(texts) {
    const xpath = texts.map((text) => `contains(., '${text}')`).join(' or ');
    return locate({ xpath: `.//button[${xpath}]` });
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
};
