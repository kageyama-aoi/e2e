const { I } = inject();

module.exports = {
  locators: {
    masterIcon: 'a:has-text("マスター")',
  },

  clickMasterIcon() {
    I.say('【メインメニュー】マスターアイコンをクリック');
    I.waitForElement(this.locators.masterIcon, 10);
    I.click(this.locators.masterIcon);
  },

  // TODO: サブメニュー・操作メソッドをここに追加
};
