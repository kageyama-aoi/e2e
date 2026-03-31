const { I } = inject();

module.exports = {
  locators: {
    jukuseiIcon: 'a:has-text("受講生")',
  },

  clickJukuseiIcon() {
    I.say('【メインメニュー】受講生アイコンをクリック');
    I.waitForElement(this.locators.jukuseiIcon, 10);
    I.click(this.locators.jukuseiIcon);
  },

  // TODO: サブメニュー・操作メソッドをここに追加
};
