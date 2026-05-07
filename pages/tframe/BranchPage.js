/**
 * @fileoverview tframe 校舎登録画面 Page Object
 * URL: index.php?r=branch%2Few%2F_default
 */

const { I } = inject();
const { fillTextFields, submitTframeFormAndVerify, isEnglish } = require('../../support/utils');

module.exports = {

  /**
   * 校舎登録画面へ遷移する
   */
  navigateToRegisterPage() {
    I.say('【校舎登録】登録画面へ遷移');
    if (process.env.USE_MENU_NAV === 'true') {
      I.click(`a:has-text("${isEnglish() ? 'Master' : 'マスター'}")`);
      I.waitForElement('a[href*="branch%2Few"]', 10);
      I.click('a[href*="branch%2Few"]');
    } else {
      I.amOnPage(process.env.BASE_URL + 'index.php?r=branch%2Few%2F_default');
    }
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * 登録フォームの全セクションを入力する
   * @param {object} data - branch_touroku_data.csv の1行分
   */
  fillRegistrationForm(data) {
    this.fillGeneralInfo(data);
    this.fillAddressInfo(data);
    this.fillMemoInfo(data);
  },

  /**
   * 全体設定を入力する（校舎名・エリア・校舎コード・電話等）
   * @param {object} data
   */
  fillGeneralInfo(data) {
    I.say('【校舎登録】全体設定 を入力');
    fillTextFields(I, {
      schoolName:        data.schoolName,
      schoolCode:        data.schoolCode,
      schoolPhoneNumber: data.schoolPhoneNumber,
      faxNumber:         data.faxNumber,
    });
    if (data.area_area_id) I.selectOption('#area_area_id', data.area_area_id);
  },

  /**
   * 住所情報を入力する（郵便番号ボタンで都道府県・市区町村を自動入力）
   * @param {object} data
   */
  fillAddressInfo(data) {
    if (!data.primaryAddressPostalcode && !data.primaryAddressStreet) return;
    I.say('【校舎登録】住所情報 を入力');
    if (data.primaryAddressPostalcode) {
      I.fillField('#primaryAddressPostalcode', data.primaryAddressPostalcode);
      I.click('#zipCodeBtn');
      I.wait(1); // AJAX: 郵便番号から都道府県・市区町村を自動入力
    }
    fillTextFields(I, {
      primaryAddressStreet: data.primaryAddressStreet,
      primaryAddressKana:   data.primaryAddressKana,
    });
  },

  /**
   * メモ情報を入力する
   * @param {object} data
   */
  fillMemoInfo(data) {
    if (!data.description) return;
    I.say('【校舎登録】メモ情報 を入力');
    fillTextFields(I, { description: data.description });
  },

  /**
   * 保存して校舎名が表示されることを確認する
   * @param {string} expectedName - 保存後の確認に使用する校舎名
   */
  async submitAndVerifyRegistration(expectedName) {
    I.say('【校舎登録】保存ボタンをクリック');
    await submitTframeFormAndVerify(I, expectedName);
  },
};
