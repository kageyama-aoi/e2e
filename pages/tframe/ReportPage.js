const { I } = inject();
const createMenuNavigationMixin = require('./MenuNavigationMixin');

module.exports = {
  locators: {
    reportIconJa: 'a:has-text("レポート")',
    reportIconEn: 'a:has-text("Report")',
  },

  clickReportIcon() {
    I.say('【メインメニュー】レポートアイコンをクリック');
    I.waitForElement(this.reportIconLocator(), 10);
    I.click(this.reportIconLocator());
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

  reportIconLocator() {
    return this.isEnglish() ? this.locators.reportIconEn : this.locators.reportIconJa;
  },

  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },

  ...createMenuNavigationMixin('tframe_report'),
};
