const { I } = inject();

module.exports = {
  locators: {
    emailIcon: 'a:has-text("Eメール")',
  },

  clickEmailIcon() {
    I.say('【メインメニュー】Eメールアイコンをクリック');
    I.waitForElement(this.locators.emailIcon, 10);
    I.click(this.locators.emailIcon);
  },

  // TODO: サブメニュー・操作メソッドをここに追加
};
