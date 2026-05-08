/**
 * @fileoverview tframe 教室登録画面 Page Object
 * URL: index.php?r=classroom%2Few%2F_default
 */

const { I } = inject();
const { fillTextFields, submitTframeFormAndVerify, isEnglish } = require('../../../support/utils');

module.exports = {

  /**
   * 教室登録画面へ遷移する
   */
  navigateToRegisterPage() {
    I.say('【教室登録】登録画面へ遷移');
    if (process.env.USE_MENU_NAV === 'true') {
      I.click(`a:has-text("${isEnglish() ? 'Master' : 'マスター'}")`);
      I.waitForElement('a[href*="classroom%2Few"]', 10);
      I.click('a[href*="classroom%2Few"]');
    } else {
      I.amOnPage(process.env.BASE_URL + 'index.php?r=classroom%2Few%2F_default');
    }
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * 登録フォームの全セクションを入力する
   * @param {object} data - kyoshitsu_touroku_data.csv の1行分
   */
  fillRegistrationForm(data) {
    this.fillClassroomInfo(data);
    this.fillMemoInfo(data);
  },

  /**
   * 基本情報を入力する（教室名・校舎・略称・定員）
   * @param {object} data
   */
  fillClassroomInfo(data) {
    I.say('【教室登録】基本情報 を入力');
    fillTextFields(I, {
      name:      data.name,
      shortname: data.shortname,
      capacity:  data.capacity,
    });
    if (data.school_area_id) {
      I.selectOption('#school_area_id', data.school_area_id);
      I.wait(1); // AJAX: エリア選択後に校舎ドロップダウンを更新
    }
    if (data.school_branch_id) I.selectOption('#school_branch_id', data.school_branch_id);
  },

  /**
   * メモ情報を入力する
   * @param {object} data
   */
  fillMemoInfo(data) {
    if (!data.description) return;
    I.say('【教室登録】メモ情報 を入力');
    fillTextFields(I, { description: data.description });
  },

  /**
   * 保存して教室名が表示されることを確認する
   * @param {string} expectedName - 保存後の確認に使用する教室名
   */
  async submitAndVerifyRegistration(expectedName) {
    I.say('【教室登録】保存ボタンをクリック');
    await submitTframeFormAndVerify(I, expectedName);
  },

  // ----------------------------------------------------------------
  //  教室一覧（SW）
  // ----------------------------------------------------------------

  /**
   * 教室一覧画面へ遷移する
   */
  navigateToListPage() {
    I.say('【教室一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=classroom%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 検索条件を入力する（空フィールドはスキップ）
   * @param {object} data - kyoshitsu_ichiran_search_data.csv の1行分
   */
  fillSearchConditions(data) {
    I.say('【教室一覧】検索条件を入力');
    if (data.name) I.fillField('#name', data.name);
    if (data.school_area_id) {
      I.selectOption('#school_area_id', data.school_area_id);
      I.wait(1); // AJAX: エリア選択後に校舎ドロップダウンを更新
    }
    if (data.school_branch_id) I.selectOption('#school_branch_id', data.school_branch_id);
  },

  /**
   * 検索ボタンをクリックし、結果行が表示されるまで待つ
   */
  clickSearchAndWait() {
    I.say('【教室一覧】検索ボタンをクリック');
    I.click('#swSearchButton');
    I.waitForElement('.tf-group-body-search-result tr', 15);
  },

  /**
   * 検索結果エリアに1件以上の行があることを確認する
   */
  verifyResultsExist() {
    I.say('【教室一覧】検索結果が表示されることを確認');
    I.seeElement('.tf-group-body-search-result tr');
  },

  /**
   * 検索結果エリアに指定テキストが表示されることを確認する
   * @param {string} expectedName - 結果一覧に表示されるべき文字列
   */
  verifyRecordInResults(expectedName) {
    I.say(`【教室一覧】"${expectedName}" が結果に表示されることを確認`);
    I.see(expectedName, '.tf-group-body-search-result');
  },
};
