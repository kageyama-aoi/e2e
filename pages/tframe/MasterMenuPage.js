const { I } = inject();
const createMenuNavigationMixin = require('./MenuNavigationMixin');

module.exports = {
  locators: {
    masterIconJa: 'a:has-text("マスター")',
    masterIconEn: 'a:has-text("Master")',
  },

  clickMasterIcon() {
    I.say('【メインメニュー】マスターアイコンをクリック');
    I.waitForElement(this.masterIconLocator(), 10);
    I.click(this.masterIconLocator());
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

  masterIconLocator() {
    return this.isEnglish() ? this.locators.masterIconEn : this.locators.masterIconJa;
  },

  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },

  ...createMenuNavigationMixin('tframe_master'),
};








