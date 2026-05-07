/**
 * @fileoverview tframe 料金パッケージ作成画面 Page Object
 * URL: index.php?r=smsFeeMasterPackage%2Few%2F_default
 * ※ juku_test 環境のみ対応（culture_beta では未提供）
 */

const { I } = inject();
const { fillTextFields, submitTframeFormAndVerify, isEnglish } = require('../../support/utils');

module.exports = {

  /**
   * 料金パッケージ作成画面へ遷移する
   */
  navigateToRegisterPage() {
    I.say('【料金パッケージ作成】登録画面へ遷移');
    if (process.env.USE_MENU_NAV === 'true') {
      I.click(`a:has-text("${isEnglish() ? 'Accounting' : '経理'}")`);
      I.waitForElement('a[href*="smsFeeMasterPackage%2Few"]', 10);
      I.click('a[href*="smsFeeMasterPackage%2Few"]');
    } else {
      I.amOnPage(process.env.BASE_URL + 'index.php?r=smsFeeMasterPackage%2Few%2F_default');
    }
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * 登録フォームの全セクションを入力する
   * @param {object} data - ryokin_package_touroku_data.csv の1行分
   */
  fillRegistrationForm(data) {
    this.fillPackageInfo(data);
    this.fillMemoInfo(data);
  },

  /**
   * 料金パッケージ情報を入力する（パッケージ名・有効/無効）
   * @param {object} data
   */
  fillPackageInfo(data) {
    I.say('【料金パッケージ作成】パッケージ情報 を入力');
    fillTextFields(I, { name: data.name });
    if (data.valid) I.selectOption('#valid', data.valid);
  },

  /**
   * メモ情報を入力する
   * @param {object} data
   */
  fillMemoInfo(data) {
    if (!data.description) return;
    I.say('【料金パッケージ作成】メモ情報 を入力');
    fillTextFields(I, { description: data.description });
  },

  /**
   * 保存してパッケージ名が表示されることを確認する
   * @param {string} expectedName - 保存後の確認に使用するパッケージ名
   */
  async submitAndVerifyRegistration(expectedName) {
    I.say('【料金パッケージ作成】保存ボタンをクリック');
    await submitTframeFormAndVerify(I, expectedName);
  },
};
