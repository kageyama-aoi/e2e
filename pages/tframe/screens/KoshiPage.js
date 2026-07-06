/**
 * @fileoverview tframe 講師画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');
const createIchiranMixin = require('../_common/IchiranMixin');
const { fillTextFields } = require('../../../support/utils');
const { isEnglish, submitTframeFormAndVerify, selectAreaThenBranch } = require('../../../support/tframe/utils');

module.exports = {
  /** 講師アイコンのセレクタ（日英） */
  locators: {
    teacherIconJa: 'a:has-text("講師")',
    teacherIconEn: 'a:has-text("Teacher")',
  },

  /**
   * メインメニューの講師アイコンをクリックする
   */
  clickKoshiIcon() {
    I.say('【メインメニュー】講師アイコンをクリック');
    I.waitForElement(this.teacherIconLocator(), 10);
    I.click(this.teacherIconLocator());
  },

  /**
   * 現在の言語設定に合わせた講師アイコンのロケーターを返す
   * @returns {string} セレクタ文字列
   */
  teacherIconLocator() {
    return isEnglish() ? this.locators.teacherIconEn : this.locators.teacherIconJa;
  },

  /**
   * 講師登録画面に直接遷移する
   */
  navigateToRegisterPage() {
    I.say('【講師登録】登録画面へ遷移');
    if (process.env.USE_MENU_NAV === 'true') {
      // 講師メニュー → 講師登録（href で判別するため言語不変）
      const teacherText = isEnglish() ? 'Teacher' : '講師';
      I.click('a:has-text("' + teacherText + '")');
      I.waitForElement('a[href*="teacher%2Few"]', 10);
      I.click('a[href*="teacher%2Few"]');
    } else {
      I.amOnPage(process.env.BASE_URL + 'index.php?r=teacher%2Few%2F_default');
    }
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * 講師登録フォームの全セクションを入力する
   * @param {object} data - 講師登録フォームの入力データ
   */
  fillRegistrationForm(data) {
    this.fillPersonalInfo1(data);
    this.fillPersonalInfo2(data);
    this.fillPaymentInfo(data);
    this.fillAddressInfo(data);
    this.fillMemoInfo(data);
  },

  /**
   * 個人情報 1 を入力する（姓・名・ふりがな・電話・性別・生年月日・メール）
   * @param {object} data
   */
  fillPersonalInfo1(data) {
    I.say('【講師登録】個人情報1 を入力');
    fillTextFields(I, {
      lastName:          data.lastName,
      firstName:         data.firstName,
      lastNameFurigana:  data.lastNameFurigana,
      firstNameFurigana: data.firstNameFurigana,
      phone1Number:      data.phone1Number,
      phone2Number:      data.phone2Number,
      email1:            data.email1,
      email2:            data.email2,
    });
    // ドロップダウンは個別処理
    if (data.gender)        I.selectOption('#gender', data.gender);
    if (data.birthdateYear)  I.selectOption('#birthdateYear', data.birthdateYear);
    if (data.birthdateMonth) I.selectOption('#birthdateMonth', data.birthdateMonth);
    if (data.birthdateDay)   I.selectOption('#birthdateDay', data.birthdateDay);
  },

  /**
   * 個人情報 2 を入力する（ID番号・ステイタス・校舎・入社日）
   * @param {object} data
   */
  fillPersonalInfo2(data) {
    I.say('【講師登録】個人情報2 を入力');
    fillTextFields(I, {
      idnumber:   data.idnumber,
      enrollDate: data.enrollDate,
      leaveDate:  data.leaveDate,
    });
    // ドロップダウン・AJAX連動フィールドは個別処理
    if (data.personStatus) I.selectOption('#personStatus', data.personStatus);
    selectAreaThenBranch(I, { area: data.schoolAreaId, branch: data.schoolBranchId });
  },

  /**
   * 支払規定等を入力する（契約形態・支払方法・口座情報）
   * @param {object} data
   */
  fillPaymentInfo(data) {
    I.say('【講師登録】支払規定等 を入力');
    // ドロップダウンは個別処理
    if (data.zeiKubun)        I.selectOption('#zeiKubun', data.zeiKubun);
    if (data.bankPaymentType) I.selectOption('#bankPaymentType', data.bankPaymentType);
    if (data.bankAccountType) I.selectOption('#bankAccountType', data.bankAccountType);
    // AJAX補完フィールドは wait が必要なため個別処理
    if (data.bankCode) {
      I.fillField('#bankCode', data.bankCode);
      I.wait(1);
    }
    if (data.bankBranchCode) {
      I.fillField('#bankBranchCode', data.bankBranchCode);
      I.wait(1);
    }
    fillTextFields(I, {
      bankAccountNo:   data.bankAccountNo,
      bankName:        data.bankName,
      bankBranchName:  data.bankBranchName,
      bankAccountName: data.bankAccountName,
    });
  },

  /**
   * 住所情報を入力する（郵便番号・都道府県・市区町村・番地・住所カナ）
   * @param {object} data
   */
  fillAddressInfo(data) {
    I.say('【講師登録】住所情報 を入力');
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
    I.say('【講師登録】メモ情報 を入力');
    fillTextFields(I, { description: data.description });
  },

  /**
   * 保存ボタンをクリックして登録を実行し、保存後の画面に講師名が表示されることを確認する
   * @param {string} expectedName - 保存後の確認に使用する講師名（姓）
   */
  async submitAndVerifyRegistration(expectedName) {
    I.say('【講師登録】保存ボタンをクリック');
    await submitTframeFormAndVerify(I, expectedName);
  },

  // ----------------------------------------------------------------
  //  講師一覧（SW）
  // ----------------------------------------------------------------

  /**
   * 講師一覧画面へ遷移する
   */
  navigateToListPage() {
    I.say('【講師一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=teacher%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 検索条件を入力する（空フィールドはスキップ）
   * @param {object} data - koshi_ichiran_search_data.csv の1行分
   */
  fillSearchConditions(data) {
    I.say('【講師一覧】検索条件を入力');
    if (data.lastName)     I.fillField('#lastName', data.lastName);
    if (data.firstName)    I.fillField('#firstName', data.firstName);
    if (data.idnumber)     I.fillField('#idnumber', data.idnumber);
    if (data.personStatus) I.selectOption('#personStatus', data.personStatus);
    selectAreaThenBranch(I, { area: data.school_area_id, branch: data.school_branch_id });
  },

  ...createIchiranMixin('講師一覧'),

  // ----------------------------------------------------------------
  //  講師別受講生一覧（SW: teacher/sw/teByStudent）
  // ----------------------------------------------------------------

  /**
   * 講師別受講生一覧画面へ遷移する
   */
  navigateToTeByStudentListPage() {
    I.say('【講師別受講生一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=teacher%2Fsw%2FteByStudent');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 講師別受講生一覧の検索条件を入力する（空フィールドはスキップ）
   * @param {object} data - teByStudent_ichiran_search_data.csv の1行分
   */
  fillTeByStudentSearchConditions(data) {
    I.say('【講師別受講生一覧】検索条件を入力');
    if (data.lastName)  I.fillField('#lastName', data.lastName);
    if (data.firstName) I.fillField('#firstName', data.firstName);
  },

  ...createMenuNavigationMixin('tframe_teacher'),
};
