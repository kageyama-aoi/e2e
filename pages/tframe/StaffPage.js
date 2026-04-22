/**
 * @fileoverview tframe スタッフ登録画面 Page Object
 */

const { I } = inject();
const { fillTextFields } = require('../../support/utils');

module.exports = {

  /**
   * スタッフ登録画面に直接遷移する
   */
  navigateToRegisterPage() {
    I.say('【スタッフ登録】登録画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=staff%2Few%2F_default');
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * 登録フォームの全セクションを入力する
   * @param {object} data - staff_touroku_data.csv の1行分
   */
  fillRegistrationForm(data) {
    this.fillPersonalInfo(data);
    this.fillStaffInfo(data);
    this.fillAddressInfo(data);
    this.fillMemoInfo(data);
  },

  /**
   * 個人情報を入力する（姓・名・ふりがな・電話・性別・生年月日・メール）
   * @param {object} data
   */
  fillPersonalInfo(data) {
    I.say('【スタッフ登録】個人情報 を入力');
    fillTextFields(I, {
      lastName:          data.lastName,
      firstName:         data.firstName,
      lastNameFurigana:  data.lastNameFurigana,
      firstNameFurigana: data.firstNameFurigana,
      phone1Number:      data.phone1Number,
      phone2Number:      data.phone2Number,
      phone3Number:      data.phone3Number,
      email1:            data.email1,
      email2:            data.email2,
    });
    // ドロップダウンは個別処理
    if (data.gender)         I.selectOption('#gender', data.gender);
    if (data.birthdateYear)  I.selectOption('#birthdateYear', data.birthdateYear);
    if (data.birthdateMonth) I.selectOption('#birthdateMonth', data.birthdateMonth);
    if (data.birthdateDay)   I.selectOption('#birthdateDay', data.birthdateDay);
  },

  /**
   * スタッフ情報を入力する（ID番号・ステイタス・校舎・職位・部署）
   * @param {object} data
   */
  fillStaffInfo(data) {
    I.say('【スタッフ登録】スタッフ情報 を入力');
    fillTextFields(I, {
      idnumber:   data.idnumber,
      title:      data.title,
      department: data.department,
    });
    // ドロップダウン・AJAX連動フィールドは個別処理
    if (data.personStatus) I.selectOption('#personStatus', data.personStatus);
    if (data.branchId_area_id) {
      I.selectOption('#branchId_area_id', data.branchId_area_id);
      I.wait(1);
    }
    if (data.branchId_branch_id) I.selectOption('#branchId_branch_id', data.branchId_branch_id);
  },

  /**
   * 住所情報を入力する
   * @param {object} data
   */
  fillAddressInfo(data) {
    I.say('【スタッフ登録】住所情報 を入力');
    fillTextFields(I, {
      primaryAddressPostalcode: data.primaryAddressPostalcode,
      primaryAddressState:      data.primaryAddressState,
      primaryAddressCity:       data.primaryAddressCity,
      primaryAddressStreet:     data.primaryAddressStreet,
      primaryAddressKana:       data.primaryAddressKana,
    });
    if (data.sendDocumentHome === 'true') I.checkOption('#sendDocumentHome');
  },

  /**
   * メモ情報を入力する
   * @param {object} data
   */
  fillMemoInfo(data) {
    if (!data.description) return;
    I.say('【スタッフ登録】メモ情報 を入力');
    fillTextFields(I, { description: data.description });
  },

  /**
   * 保存ボタンをクリックして登録を実行し、保存後の画面にスタッフ名が表示されることを確認する
   * @param {string} expectedName - 保存後の確認に使用するスタッフ名（姓）
   */
  async submitAndVerifyRegistration(expectedName) {
    I.say('【スタッフ登録】保存ボタンをクリック');
    I.click('#ewSaveButton');
    I.waitForText(expectedName, 10);
  },
};
