const { I } = inject();
const createMenuNavigationMixin = require('./MenuNavigationMixin');

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

  ...createMenuNavigationMixin('tframe_calendar'),
};








