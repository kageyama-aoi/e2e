const { I } = inject();
const createMenuNavigationMixin = require('./MenuNavigationMixin');

module.exports = {
  locators: {
    studentIconJa: 'a:has-text("受講生")',
    studentIconEn: 'a:has-text("Student")',
  },

  clickJukuseiIcon() {
    I.say('【メインメニュー】受講生アイコンをクリック');
    I.waitForElement(this.studentIconLocator(), 10);
    I.click(this.studentIconLocator());
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

  studentIconLocator() {
    return this.isEnglish() ? this.locators.studentIconEn : this.locators.studentIconJa;
  },

  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },

  ...createMenuNavigationMixin('tframe_student'),
};








