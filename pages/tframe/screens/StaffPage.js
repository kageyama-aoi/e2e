/**
 * @fileoverview tframe スタッフ登録画面 Page Object
 */

const { I } = inject();
const { fillTextFields } = require('../../../support/utils');
const { isEnglish, submitTframeFormAndVerify } = require('../../../support/tframe/utils');
const createIchiranMixin = require('../_common/IchiranMixin');

module.exports = {

  /**
   * スタッフ登録画面に直接遷移する
   */
  navigateToRegisterPage() {
    I.say('【スタッフ登録】登録画面へ遷移');
    if (process.env.USE_MENU_NAV === 'true') {
      // マスターメニュー → スタッフ登録（サイドバーリンクは href で判別するため言語不変）
      I.click(`a:has-text("${isEnglish() ? 'Master' : 'マスター'}")`);
      I.waitForElement('a[href*="staff%2Few"]', 10);
      I.click('a[href*="staff%2Few"]');
    } else {
      I.amOnPage(process.env.BASE_URL + 'index.php?r=staff%2Few%2F_default');
    }
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
    if (data.primaryAddressPostalcode) {
      I.fillField('#primaryAddressPostalcode', data.primaryAddressPostalcode);
      I.click('#zipCodeBtn'); // 〒ボタンで都道府県・市区町村を自動入力
      I.wait(1);
    }
    // 番地・住所カナは自動入力されないため個別入力
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
    I.say('【スタッフ登録】メモ情報 を入力');
    fillTextFields(I, { description: data.description });
  },

  /**
   * 保存ボタンをクリックして登録を実行し、保存後の画面にスタッフ名が表示されることを確認する
   * @param {string} expectedName - 保存後の確認に使用するスタッフ名（姓）
   */
  async submitAndVerifyRegistration(expectedName) {
    I.say('【スタッフ登録】保存ボタンをクリック');
    await submitTframeFormAndVerify(I, expectedName);
  },

  // ----------------------------------------------------------------
  //  スタッフ一覧（SW）
  // ----------------------------------------------------------------

  /**
   * スタッフ一覧画面へ遷移する
   */
  navigateToListPage() {
    I.say('【スタッフ一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=staff%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 検索条件を入力する（空フィールドはスキップ）
   * @param {object} data - staff_ichiran_search_data.csv の1行分
   */
  fillSearchConditions(data) {
    I.say('【スタッフ一覧】検索条件を入力');
    if (data.lastName)     I.fillField('#lastName', data.lastName);
    if (data.firstName)    I.fillField('#firstName', data.firstName);
    if (data.idnumber)     I.fillField('#idnumber', data.idnumber);
    if (data.personStatus) I.selectOption('#personStatus', data.personStatus);
    if (data.school_area_id) {
      I.selectOption('#school_area_id', data.school_area_id);
      I.wait(1); // AJAX: エリア選択後に校舎ドロップダウンを更新
    }
    if (data.school_branch_id) I.selectOption('#school_branch_id', data.school_branch_id);
  },

  ...createIchiranMixin('スタッフ一覧'),
};
