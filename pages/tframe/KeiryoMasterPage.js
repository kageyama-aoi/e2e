const { I } = inject();

module.exports = {

  locators: {
    keiryoIcon:      'a:has-text("経理")',
    ryokinMasterLink: 'a:has-text("料金マスタ一覧")',
  },

  /**
   * 経理アイコンをクリックしてサブメニューを開く
   */
  clickKeiryoIcon() {
    I.say('【メインメニュー】経理アイコンをクリック');
    I.waitForElement(this.locators.keiryoIcon, 10);
    I.click(this.locators.keiryoIcon);
  },

  /**
   * 料金マスタ一覧を開く
   */
  openRyokinMasterList() {
    I.say('【サブメニュー】料金マスタ一覧をクリック');
    I.waitForElement(this.locators.ryokinMasterLink, 10);
    I.click(this.locators.ryokinMasterLink);
  },

  /**
   * 料金マスタ一覧が表示されていることを確認する
   */
  seeRyokinMasterList() {
    I.waitForText('料金マスタ一覧', 10);
    I.see('料金マスタ一覧');
  },
};
