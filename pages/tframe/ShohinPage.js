/**
 * @fileoverview tframe 商品登録画面 Page Object
 * URL: index.php?r=product%2Few%2F_default
 */

const { I } = inject();
const { fillTextFields, submitTframeFormAndVerify, isEnglish } = require('../../support/utils');

module.exports = {

  /**
   * 商品登録画面へ遷移する
   */
  navigateToRegisterPage() {
    I.say('【商品登録】登録画面へ遷移');
    if (process.env.USE_MENU_NAV === 'true') {
      I.click(`a:has-text("${isEnglish() ? 'Accounting' : '経理'}")`);
      I.waitForElement('a[href*="product%2Few"]', 10);
      I.click('a[href*="product%2Few"]');
    } else {
      I.amOnPage(process.env.BASE_URL + 'index.php?r=product%2Few%2F_default');
    }
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * 登録フォームの全セクションを入力する
   * @param {object} data - shohin_touroku_data.csv の1行分
   */
  fillRegistrationForm(data) {
    this.fillGeneralInfo(data);
    this.fillCourseInfo(data);
    this.fillFee1Info(data);
    this.fillMemoInfo(data);
  },

  /**
   * 全体設定を入力する（商品名・校舎・商品コード・カテゴリ）
   * @param {object} data
   */
  fillGeneralInfo(data) {
    I.say('【商品登録】全体設定 を入力');
    fillTextFields(I, {
      name:        data.name,
      productCode: data.productCode,
    });
    if (data.branchId_area_id) {
      I.selectOption('#branchId_area_id', data.branchId_area_id);
      I.wait(1); // AJAX: エリア選択後に校舎ドロップダウンを更新
    }
    if (data.branchId_branch_id) I.selectOption('#branchId_branch_id', data.branchId_branch_id);
    if (data.productCategory)    I.selectOption('#productCategory', data.productCategory);
  },

  /**
   * コース関連設定を入力する（コース使用・カレンダー色・回数・分数）
   * @param {object} data
   */
  fillCourseInfo(data) {
    if (!data.courseValid && !data.courseCount && !data.courseTime) return;
    I.say('【商品登録】コース関連設定 を入力');
    if (data.courseValid)          I.selectOption('#courseValid', data.courseValid);
    if (data.calendarColorSetting) I.selectOption('#calendarColorSetting', data.calendarColorSetting);
    fillTextFields(I, {
      courseCount: data.courseCount,
      courseTime:  data.courseTime,
    });
  },

  /**
   * 料金設定1（月謝）を入力する
   * 料金設定2〜4 も同じ構造（フィールド名の末尾数字を変えるだけ）
   * @param {object} data
   */
  fillFee1Info(data) {
    if (!data.name1 && !data.amountNotax1) return;
    I.say('【商品登録】料金設定1 を入力');
    fillTextFields(I, {
      name1:        data.name1,
      amountNotax1: data.amountNotax1,
      dueDay1:      data.dueDay1,
    });
    if (data.feeSubcategory1) I.selectOption('#feeSubcategory1', data.feeSubcategory1);
    if (data.dueType1)        I.selectOption('#dueType1', data.dueType1);
    if (data.targetMonth1)    I.selectOption('#targetMonth1', data.targetMonth1);
  },

  /**
   * メモ情報を入力する
   * @param {object} data
   */
  fillMemoInfo(data) {
    if (!data.description) return;
    I.say('【商品登録】メモ情報 を入力');
    fillTextFields(I, { description: data.description });
  },

  /**
   * 保存して商品名が表示されることを確認する
   * @param {string} expectedName - 保存後の確認に使用する商品名
   */
  async submitAndVerifyRegistration(expectedName) {
    I.say('【商品登録】保存ボタンをクリック');
    await submitTframeFormAndVerify(I, expectedName);
  },

  // ----------------------------------------------------------------
  //  商品一覧（SW）
  // ----------------------------------------------------------------

  /**
   * 商品一覧画面へ遷移する
   */
  navigateToListPage() {
    I.say('【商品一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=product%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 検索条件を入力する（空フィールドはスキップ）
   * @param {object} data - shohin_ichiran_search_data.csv の1行分
   */
  fillSearchConditions(data) {
    I.say('【商品一覧】検索条件を入力');
    if (data.name) I.fillField('#name', data.name);
    if (data.branchId_area_id) {
      I.selectOption('#branchId_area_id', data.branchId_area_id);
      I.wait(1); // AJAX: エリア選択後に校舎ドロップダウンを更新
    }
    if (data.branchId_branch_id) I.selectOption('#branchId_branch_id', data.branchId_branch_id);
    if (data.productCategory) I.selectOption('#productCategory', data.productCategory);
    if (data.courseValid)     I.selectOption('#courseValid', data.courseValid);
  },

  /**
   * 検索ボタンをクリックし、結果行が表示されるまで待つ
   */
  clickSearchAndWait() {
    I.say('【商品一覧】検索ボタンをクリック');
    I.click('#swSearchButton');
    I.waitForElement('.tf-group-body-search-result tr', 15);
  },

  /**
   * 検索結果エリアに1件以上の行があることを確認する
   */
  verifyResultsExist() {
    I.say('【商品一覧】検索結果が表示されることを確認');
    I.seeElement('.tf-group-body-search-result tr');
  },

  /**
   * 検索結果エリアに指定テキストが表示されることを確認する
   * @param {string} expectedName - 結果一覧に表示されるべき文字列
   */
  verifyRecordInResults(expectedName) {
    I.say(`【商品一覧】"${expectedName}" が結果に表示されることを確認`);
    I.see(expectedName, '.tf-group-body-search-result');
  },
};
