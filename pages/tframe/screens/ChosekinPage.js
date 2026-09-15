/**
 * @fileoverview tframe 調整金登録・講師謝礼一覧・講師謝礼計算 Page Object
 * URL: index.php?r=shareiDetail%2Few%2F_default（登録）/ shareiDetail%2Fsw%2F_default（一覧）/
 *      shareiDetail%2Fsw%2FteRewardCalc（計算・culture のみ・一括処理系。#219）
 */

const { I } = inject();
const { fillTextFields } = require('../../../support/utils');
const { isEnglish, submitTframeFormAndVerify, selectAreaThenBranch, verifyBulkActionResult } = require('../../../support/tframe/utils');
const createIchiranMixin = require('../_common/IchiranMixin');

module.exports = {

  /**
   * 調整金登録画面へ遷移する
   */
  navigateToRegisterPage() {
    I.say('【調整金登録】登録画面へ遷移');
    if (process.env.USE_MENU_NAV === 'true') {
      I.click(`a:has-text("${isEnglish() ? 'Accounting' : '経理'}")`);
      I.waitForElement('a[href*="shareiDetail%2Few"]', 10);
      I.click('a[href*="shareiDetail%2Few"]');
    } else {
      I.amOnPage(process.env.BASE_URL + 'index.php?r=shareiDetail%2Few%2F_default');
    }
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * 登録フォームの全セクションを入力する
   * @param {object} data - chosekin_touroku_data.csv の1行分
   */
  fillRegistrationForm(data) {
    this.fillChosekinInfo(data);
  },

  /**
   * 調整金設定を入力する（校舎・対象日・計上日・謝礼項目・金額）
   * すべて必須フィールド
   * @param {object} data
   */
  fillChosekinInfo(data) {
    I.say('【調整金登録】調整金設定 を入力');

    // 講師はポップアップピッカー: CSV に personId があれば JS で直接設定、なければ一覧から先頭を選択
    if (data.personId) {
      I.executeScript((id) => { document.getElementById('personId').value = id; }, data.personId);
    } else {
      I.click('#personId_start');
      // ポップアップ内の tf-radio span（カスタム radio）が表示されるまで待つ
      I.waitForVisible('.tf-radio.tf-radio-primary', 10);
      I.click(locate('.tf-radio.tf-radio-primary').first());
      I.waitForInvisible('.tf-radio.tf-radio-primary', 10);
      I.wait(0.5);
    }

    // 校舎はAJAX連動ドロップダウン（エリア→校舎）
    selectAreaThenBranch(I, { area: data.school_area_id, branch: data.school_branch_id });

    fillTextFields(I, {
      fromDatetime: data.fromDatetime,
      keijoubi:     data.keijoubi,
      houshugaku:   data.houshugaku,
    });
    if (data.shareiKomoku) I.selectOption('#shareiKomoku', data.shareiKomoku);
  },

  /**
   * 保存して調整金詳細ページへ遷移したことを確認する
   * @param {string} expectedValue - 保存後の確認テキスト（通常は "調整金詳細"）
   */
  async submitAndVerifyRegistration(expectedValue) {
    I.say('【調整金登録】保存ボタンをクリック');
    await submitTframeFormAndVerify(I, expectedValue);
  },

  // ----------------------------------------------------------------
  //  調整金一覧（SW）
  // ----------------------------------------------------------------

  /**
   * 調整金一覧画面へ遷移する
   */
  navigateToListPage() {
    I.say('【調整金一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=shareiDetail%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 検索条件を入力する（空フィールドはスキップ）
   * @param {object} data - chosekin_ichiran_search_data.csv の1行分
   */
  fillSearchConditions(data) {
    I.say('【調整金一覧】検索条件を入力');
    if (data.keijouMonthYear)  I.selectOption('#keijouMonthYear', data.keijouMonthYear);
    if (data.keijouMonthMonth) I.selectOption('#keijouMonthMonth', data.keijouMonthMonth);
    selectAreaThenBranch(I, { area: data.school_area_id, branch: data.school_branch_id });
    if (data.rewardItem) I.selectOption('#rewardItem', data.rewardItem);
    if (data.calType)    I.selectOption('#calType', data.calType);
  },

  ...createIchiranMixin('調整金一覧'),

  // ----------------------------------------------------------------
  //  講師謝礼計算（SW: shareiDetail/sw/teRewardCalc）culture のみ・一括処理系
  // ----------------------------------------------------------------
  // 対象年月・校舎の講師謝礼を再計算する。既存データがあっても上書き成功する（重複エラーにならない）ため、
  // 何度実行しても「講師謝礼計算処理が正常に完了しました。N人の講師の謝礼情報を作成しました。」を返す
  // （実機確認済み・#219）。KeiriIchiranPage.clickTeRewardTotalCalcAndVerify の前段として使う。

  /**
   * 講師謝礼計算画面へ遷移する
   */
  navigateToTeRewardCalcPage() {
    I.say('【講師謝礼計算】画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=shareiDetail%2Fsw%2FteRewardCalc');
    I.waitForElement('#calculate', 10);
  },

  /**
   * 対象年月・校舎を入力する（空フィールドはスキップ＝既定値のまま）
   * @param {object} data - te_reward_calc_data.csv の1行分（targetYM / school_area_id / school_branch_id）
   */
  fillTeRewardCalcConditions(data) {
    I.say('【講師謝礼計算】対象年月・校舎を入力');
    if (data.targetYM) I.selectOption('#targetYM', data.targetYM);
    selectAreaThenBranch(I, {
      areaSelector: '#branchId_area_id', branchSelector: '#branchId_branch_id',
      area: data.school_area_id, branch: data.school_branch_id,
    });
  },

  /**
   * 計算ボタンをクリックし、結果メッセージを確認する（成功 or 対象なしのどちらも正常）
   */
  async clickTeRewardCalcAndVerify() {
    I.say('【講師謝礼計算】計算ボタンをクリック');
    await verifyBulkActionResult(I, '#calculate');
  },
};
