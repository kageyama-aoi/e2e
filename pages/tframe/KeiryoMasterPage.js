const { I } = inject();
const createMenuNavigationMixin = require('./MenuNavigationMixin');

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
    I.saveScreenshotWithTimestamp(this.buildScreenshotName(itemName), true);
    await this.clickSearchIfPresentAndCapture(itemName);
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

  ...createMenuNavigationMixin('tframe_accounting'),
};








