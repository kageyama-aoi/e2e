const { I } = inject();

module.exports = {
  locators: {
    calendarIcon: 'a:has-text("カレンダー")',
  },

  clickCalendarIcon() {
    I.say('【メインメニュー】カレンダーアイコンをクリック');
    I.waitForElement(this.locators.calendarIcon, 10);
    I.click(this.locators.calendarIcon);
  },

  // TODO: サブメニュー・操作メソッドをここに追加
};
