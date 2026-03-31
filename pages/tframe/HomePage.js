const { I } = inject();

module.exports = {
  locators: {
    homeIcon: 'a:has-text("ホーム")',
  },

  clickHomeIcon() {
    I.say('【メインメニュー】ホームアイコンをクリック');
    I.waitForElement(this.locators.homeIcon, 10);
    I.click(this.locators.homeIcon);
  },

  // TODO: サブメニュー・操作メソッドをここに追加
};
