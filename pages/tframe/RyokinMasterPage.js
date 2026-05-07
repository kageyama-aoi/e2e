/**
 * @fileoverview tframe 料金マスタ作成画面 Page Object
 * URL: index.php?r=smsFeeMaster%2Few%2F_default
 * ※ juku_test 環境のみ対応（culture_beta では未提供）
 */

const { I } = inject();
const { fillTextFields, submitTframeFormAndVerify, isEnglish } = require('../../support/utils');

module.exports = {

  /**
   * 料金マスタ作成画面へ遷移する
   */
  navigateToRegisterPage() {
    I.say('【料金マスタ作成】登録画面へ遷移');
    if (process.env.USE_MENU_NAV === 'true') {
      I.click(`a:has-text("${isEnglish() ? 'Accounting' : '経理'}")`);
      I.waitForElement('a[href*="smsFeeMaster%2Few"]', 10);
      I.click('a[href*="smsFeeMaster%2Few"]');
    } else {
      I.amOnPage(process.env.BASE_URL + 'index.php?r=smsFeeMaster%2Few%2F_default');
    }
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * 登録フォームの全セクションを入力する
   * @param {object} data - ryokin_master_touroku_data.csv の1行分
   */
  fillRegistrationForm(data) {
    this.fillFeeInfo(data);
    this.fillMemoInfo(data);
  },

  /**
   * 料金情報を入力する（料金名・区分・金額・締切日等）
   * @param {object} data
   */
  fillFeeInfo(data) {
    I.say('【料金マスタ作成】料金情報 を入力');
    fillTextFields(I, {
      name:     data.name,
      amountNotax: data.amountNotax,
      dueDay:   data.dueDay,
    });
    if (data.feeSubcategory)    I.selectOption('#feeSubcategory', data.feeSubcategory);
    if (data.gesshaKubun)       I.selectOption('#gesshaKubun', data.gesshaKubun);
    if (data.dueType)           I.selectOption('#dueType', data.dueType);
    if (data.targetMonth)       I.selectOption('#targetMonth', data.targetMonth);
    if (data.nextGesshaApplied) I.selectOption('#nextGesshaApplied', data.nextGesshaApplied);
  },

  /**
   * メモ情報を入力する
   * @param {object} data
   */
  fillMemoInfo(data) {
    if (!data.description) return;
    I.say('【料金マスタ作成】メモ情報 を入力');
    fillTextFields(I, { description: data.description });
  },

  /**
   * 保存して料金名が表示されることを確認する
   * @param {string} expectedName - 保存後の確認に使用する料金名
   */
  async submitAndVerifyRegistration(expectedName) {
    I.say('【料金マスタ作成】保存ボタンをクリック');
    await submitTframeFormAndVerify(I, expectedName);
  },
};
