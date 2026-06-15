/**
 * @fileoverview tframe 法人・団体登録画面 Page Object
 */

const { I } = inject();
const { fillTextFields } = require('../../../support/utils');
const { isEnglish, submitTframeFormAndVerify } = require('../../../support/tframe/utils');
const createIchiranMixin = require('../_common/IchiranMixin');

module.exports = {

  /**
   * 法人・団体登録画面に直接遷移する
   */
  navigateToRegisterPage() {
    I.say('【法人・団体登録】登録画面へ遷移');
    if (process.env.USE_MENU_NAV === 'true') {
      // マスターメニュー → 法人・団体登録（サイドバーリンクは href で判別するため言語不変）
      I.click(`a:has-text("${isEnglish() ? 'Master' : 'マスター'}")`);
      I.waitForElement('a[href*="account%2Few"]', 10);
      I.click('a[href*="account%2Few"]');
    } else {
      I.amOnPage(process.env.BASE_URL + 'index.php?r=account%2Few%2F_default');
    }
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * 登録フォームの全セクションを入力する
   * @param {object} data - account_touroku_data.csv の1行分
   */
  fillRegistrationForm(data) {
    this.fillGeneralInfo(data);
    this.fillAddressInfo(data);
    this.fillMemoInfo(data);
  },

  /**
   * 全体設定を入力する（法人コード・校舎・法人名・電話番号など）
   * @param {object} data
   */
  fillGeneralInfo(data) {
    I.say('【法人・団体登録】全体設定 を入力');
    fillTextFields(I, {
      idnumber:       data.idnumber,
      name:           data.name,
      nameFurigana:   data.nameFurigana,
      phone1Number:   data.phone1Number,
      houjinTantosha: data.houjinTantosha,
    });
    // ドロップダウンはAJAX連動があるため個別処理
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
    I.say('【法人・団体登録】住所情報 を入力');
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
    I.say('【法人・団体登録】メモ情報 を入力');
    fillTextFields(I, { description: data.description });
  },

  /**
   * 保存ボタンをクリックして登録を実行し、保存後の画面に法人名が表示されることを確認する
   * @param {string} expectedName - 保存後の確認に使用する法人・団体名
   */
  async submitAndVerifyRegistration(expectedName) {
    I.say('【法人・団体登録】保存ボタンをクリック');
    await submitTframeFormAndVerify(I, expectedName);
  },

  // ----------------------------------------------------------------
  //  アカウント一覧（SW）
  // ----------------------------------------------------------------

  /**
   * アカウント一覧画面へ遷移する
   */
  navigateToListPage() {
    I.say('【アカウント一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=account%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 検索条件を入力する（空フィールドはスキップ）
   * @param {object} data - account_ichiran_search_data.csv の1行分
   */
  fillSearchConditions(data) {
    I.say('【アカウント一覧】検索条件を入力');
    if (data.name)     I.fillField('#name', data.name);
    if (data.idnumber) I.fillField('#idnumber', data.idnumber);
  },

  ...createIchiranMixin('アカウント一覧'),
};
