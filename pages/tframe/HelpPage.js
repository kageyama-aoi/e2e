const { I } = inject();

module.exports = {
  locators: {
    helpIcon: 'a:has-text("ヘルプ")',
  },

  clickHelpIcon() {
    I.say('【メインメニュー】ヘルプアイコンをクリック');
    I.waitForElement(this.locators.helpIcon, 10);
    I.click(this.locators.helpIcon);
  },

  // TODO: サブメニュー・操作メソッドをここに追加
};
