/**
 * @fileoverview tframe 対応履歴 Page Object
 *
 * 対応履歴一覧・対応履歴テンプレート登録/一覧を扱う。
 * menuModule パラメータで受講生('student') / 講師('teacher') を切り替える。
 */

const { I } = inject();
const { fillTextFields, submitTframeFormAndVerify } = require('../../../support/utils');

module.exports = {

  // ----------------------------------------------------------------
  //  対応履歴一覧（SW）
  // ----------------------------------------------------------------

  /**
   * 対応履歴一覧画面へ遷移する
   * @param {'student'|'teacher'} menuModule - 受講生または講師
   */
  navigateToListPage(menuModule = 'student') {
    I.say(`【対応履歴一覧】一覧画面へ遷移 (${menuModule})`);
    I.amOnPage(process.env.BASE_URL + `index.php?r=infoHistory%2Fsw%2F_default&menuModule=${menuModule}`);
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 対応履歴一覧の検索条件を入力する（空フィールドはスキップ）
   * @param {object} data - infoHistory_ichiran_search_data.csv の1行分
   */
  fillSearchConditions(data) {
    I.say('【対応履歴一覧】検索条件を入力');
    if (data.name)         I.fillField('#name', data.name);
    if (data.categoryMain) I.selectOption('#categoryMain', data.categoryMain);
  },

  /**
   * 検索ボタンをクリックし、結果行が表示されるまで待つ
   */
  clickSearchAndWait() {
    I.say('【対応履歴一覧】検索ボタンをクリック');
    I.click('#swSearchButton');
    I.waitForElement('.tf-group-body-search-result tr', 15);
  },

  /**
   * 検索結果エリアに1件以上の行があることを確認する
   */
  verifyResultsExist() {
    I.say('【対応履歴一覧】検索結果が表示されることを確認');
    I.seeElement('.tf-group-body-search-result tr');
  },

  /**
   * 検索結果エリアに指定テキストが表示されることを確認する
   * @param {string} expectedName
   */
  verifyRecordInResults(expectedName) {
    I.say(`【対応履歴一覧】"${expectedName}" が結果に表示されることを確認`);
    I.see(expectedName, '.tf-group-body-search-result');
  },

  // ----------------------------------------------------------------
  //  対応履歴テンプレート一覧（SW）
  // ----------------------------------------------------------------

  /**
   * 対応履歴テンプレート一覧画面へ遷移する
   * @param {'student'|'teacher'} menuModule
   */
  navigateToTemplateListPage(menuModule = 'student') {
    I.say(`【対応履歴テンプレート一覧】一覧画面へ遷移 (${menuModule})`);
    I.amOnPage(process.env.BASE_URL + `index.php?r=infoHistoryTemplate%2Fsw%2F_default&menuModule=${menuModule}`);
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * テンプレート一覧の検索条件を入力する
   * @param {object} data - infoHistoryTemplate_ichiran_search_data.csv の1行分
   */
  fillTemplateSearchConditions(data) {
    I.say('【対応履歴テンプレート一覧】検索条件を入力');
    if (data.name) I.fillField('#name', data.name);
  },

  // ----------------------------------------------------------------
  //  対応履歴テンプレート登録（EW）
  // ----------------------------------------------------------------

  /**
   * 対応履歴テンプレート登録画面へ遷移する
   * @param {'student'|'teacher'} menuModule
   */
  navigateToTemplateRegisterPage(menuModule = 'student') {
    I.say(`【対応履歴テンプレート登録】登録画面へ遷移 (${menuModule})`);
    I.amOnPage(process.env.BASE_URL + `index.php?r=infoHistoryTemplate%2Few%2F_default&menuModule=${menuModule}`);
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * テンプレート登録フォームを入力する
   * @param {object} data - infoHistoryTemplate_touroku_data.csv の1行分
   */
  fillTemplateRegistrationForm(data) {
    I.say('【対応履歴テンプレート登録】フォームを入力');
    fillTextFields(I, {
      name:        data.name,
      description: data.description,
    });
    if (data.categoryMain) I.selectOption('#categoryMain', data.categoryMain);
    if (data.categorySub)  I.selectOption('#categorySub', data.categorySub);
    if (data.eventType)    I.selectOption('#eventType', data.eventType);
  },

  /**
   * 保存してテンプレート名が表示されることを確認する
   * @param {string} expectedName
   */
  async submitAndVerifyTemplateRegistration(expectedName) {
    I.say('【対応履歴テンプレート登録】保存ボタンをクリック');
    await submitTframeFormAndVerify(I, expectedName);
  },
};
