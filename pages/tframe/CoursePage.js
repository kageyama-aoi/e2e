const { I } = inject();

module.exports = {
  locators: {
    courseIcon: 'a:has-text("コース")',
  },

  clickCourseIcon() {
    I.say('【メインメニュー】コースアイコンをクリック');
    I.waitForElement(this.locators.courseIcon, 10);
    I.click(this.locators.courseIcon);
  },

  // TODO: サブメニュー・操作メソッドをここに追加
};
