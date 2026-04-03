const { I } = inject();
const createMenuNavigationMixin = require('./MenuNavigationMixin');

module.exports = {
  locators: {
    helpIconJa: 'a:has-text("ヘルプ")',
    helpIconEn: 'a:has-text("Help")',
  },

  clickHelpIcon() {
    I.say('【メインメニュー】ヘルプアイコンをクリック');
    I.waitForElement(this.helpIconLocator(), 10);
    I.click(this.helpIconLocator());
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
    I.amOnPage(item.href);
    const currentUrl = await this.waitForCurrentUrlMatch(item.href, 10);
    this.assertCurrentUrlMatches(currentUrl, item.href);
    I.saveScreenshotWithTimestamp(this.buildScreenshotName(item.name), true);
    await this.clickSearchIfPresentAndCapture(item.name);
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

  helpIconLocator() {
    return this.isEnglish() ? this.locators.helpIconEn : this.locators.helpIconJa;
  },

  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },

  ...createMenuNavigationMixin('tframe_help'),
};








