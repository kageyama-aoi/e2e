const { I } = inject();
const createMenuNavigationMixin = require('./MenuNavigationMixin');

module.exports = {
  locators: {
    homeIconJa: 'a:has-text("ホーム")',
    homeIconEn: 'a:has-text("Home")',
  },

  clickHomeIcon() {
    I.say('【メインメニュー】ホームアイコンをクリック');
    I.waitForElement(this.homeIconLocator(), 10);
    I.click(this.homeIconLocator());
  },

  verifyHomeLoaded() {
    I.say('【ホーム画面確認】ホーム画面が表示されていることを確認');
    I.waitForElement(this.homeIconLocator(), 10);
    I.saveScreenshotWithTimestamp('tframe_home.png', true);
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

  homeIconLocator() {
    return this.isEnglish() ? this.locators.homeIconEn : this.locators.homeIconJa;
  },

  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },

  ...createMenuNavigationMixin('tframe_home'),
};
