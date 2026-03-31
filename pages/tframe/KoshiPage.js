const { I } = inject();

module.exports = {
  locators: {
    koshiIcon: 'a:has-text("講師")',
  },

  clickKoshiIcon() {
    I.say('【メインメニュー】講師アイコンをクリック');
    I.waitForElement(this.locators.koshiIcon, 10);
    I.click(this.locators.koshiIcon);
  },

  // TODO: サブメニュー・操作メソッドをここに追加
};
