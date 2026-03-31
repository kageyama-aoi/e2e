const { I } = inject();

module.exports = {
  locators: {
    reportIcon: 'a:has-text("レポート")',
  },

  clickReportIcon() {
    I.say('【メインメニュー】レポートアイコンをクリック');
    I.waitForElement(this.locators.reportIcon, 10);
    I.click(this.locators.reportIcon);
  },

  // TODO: サブメニュー・操作メソッドをここに追加
};
