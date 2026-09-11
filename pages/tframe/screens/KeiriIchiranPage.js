/**
 * @fileoverview tframe 経理一覧系 Page Object
 *
 * 経理アイコン配下の一覧検索画面を扱う:
 * - 料金一覧   `smsFee/sw/_default`
 * - 契約一覧   `smsContract/sw/_default`
 * - 入金一覧   `smsPayment/sw/_default`
 * - 未収金一覧 `smsTransaction/sw/unpaidAmountList`
 * - 入出金一覧 `smsTransaction/sw/_default`
 * - 口座振替データ履歴 `bankActionsHistory/sw/_default`（フィルタは `inputType` のみ・セッション記憶なし。#213）
 *
 * マスター系一覧（KoshiPage 等）との違い:
 * 1. 日付レンジの既定値が「当月」のため、検索前にレンジを広げないと結果が0件になる。
 *    → 各 `fill*SearchConditions` は CSV の `dateFrom` / `dateTo` を日付欄へ直接セットする
 *      （datepicker / readonly 対策で `executeScript` 経由）。
 * 2. エリア・ステイタス等の絞り込みがサーバー側にセッション記憶される。
 *    → `resetStickyFilters()` で検索前に「すべて」へ戻し、結果を決定的にする。
 *
 * テストは juku_beta を主対象とする（Issue #198）。上記2点を踏まえれば culture_beta でも通る。
 */

const { I } = inject();
const { fillTextFields } = require('../../../support/utils');
const createIchiranMixin = require('../_common/IchiranMixin');
const { setDateField, resetSelects, verifyResultRowsExist } = require('../_common/IchiranSearchMixin');

/**
 * 経理系一覧でセッション記憶される主要な絞り込みセレクトを「すべて」へ戻す。
 * エリアを変えると校舎ドロップダウンが AJAX で再構築されるため、
 * エリア → 待機 → 校舎 の順にリセットする。
 */
function resetStickyFilters() {
  resetSelects(['branchId_area_id', 'personStatus', 'paymentType', 'claimType', 'feeSubcategory']);
  I.wait(1);
  resetSelects(['branchId_branch_id']);
}

module.exports = {
  // ----------------------------------------------------------------
  //  料金一覧（SW: smsFee/sw/_default）
  // ----------------------------------------------------------------

  /**
   * 料金一覧画面へ遷移する
   */
  navigateToFeeListPage() {
    I.say('【料金一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=smsFee%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 料金一覧の検索条件を入力する
   * @param {object} data - fee_ichiran_search_data.csv の1行分（dateFrom / dateTo / lastName）
   */
  fillFeeSearchConditions(data) {
    I.say('【料金一覧】検索条件を入力');
    resetStickyFilters();
    setDateField('rangeFromDate', data.dateFrom);
    setDateField('rangeToDate', data.dateTo);
    fillTextFields(I, { lastName: data.lastName });
  },

  // ----------------------------------------------------------------
  //  契約一覧（SW: smsContract/sw/_default）
  // ----------------------------------------------------------------

  /**
   * 契約一覧画面へ遷移する
   */
  navigateToContractListPage() {
    I.say('【契約一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=smsContract%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 契約一覧の検索条件を入力する（姓フィールドは `#last_name`）
   * @param {object} data - contract_ichiran_search_data.csv の1行分
   */
  fillContractSearchConditions(data) {
    I.say('【契約一覧】検索条件を入力');
    resetStickyFilters();
    setDateField('rangeFromField', data.dateFrom);
    setDateField('rangeToField', data.dateTo);
    fillTextFields(I, { last_name: data.lastName });
  },

  // ----------------------------------------------------------------
  //  入金一覧（SW: smsPayment/sw/_default）
  // ----------------------------------------------------------------

  /**
   * 入金一覧画面へ遷移する
   */
  navigateToPaymentListPage() {
    I.say('【入金一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=smsPayment%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 入金一覧の検索条件を入力する
   * @param {object} data - payment_ichiran_search_data.csv の1行分
   */
  fillPaymentSearchConditions(data) {
    I.say('【入金一覧】検索条件を入力');
    resetStickyFilters();
    setDateField('rangeFromDate', data.dateFrom);
    setDateField('rangeToDate', data.dateTo);
    fillTextFields(I, { lastName: data.lastName });
  },

  // ----------------------------------------------------------------
  //  未収金一覧（SW: smsTransaction/sw/unpaidAmountList）
  // ----------------------------------------------------------------

  /**
   * 未収金一覧画面へ遷移する
   */
  navigateToUnpaidAmountListPage() {
    I.say('【未収金一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=smsTransaction%2Fsw%2FunpaidAmountList');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 未収金一覧の検索条件を入力する
   * @param {object} data - unpaid_amount_ichiran_search_data.csv の1行分
   */
  fillUnpaidAmountSearchConditions(data) {
    I.say('【未収金一覧】検索条件を入力');
    resetStickyFilters();
    setDateField('rangeFromDate', data.dateFrom);
    setDateField('rangeToDate', data.dateTo);
    fillTextFields(I, { lastName: data.lastName });
  },

  // ----------------------------------------------------------------
  //  入出金一覧（SW: smsTransaction/sw/_default）
  // ----------------------------------------------------------------

  /**
   * 入出金一覧画面へ遷移する
   */
  navigateToTransactionListPage() {
    I.say('【入出金一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=smsTransaction%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 入出金一覧の検索条件を入力する
   * @param {object} data - transaction_ichiran_search_data.csv の1行分
   */
  fillTransactionSearchConditions(data) {
    I.say('【入出金一覧】検索条件を入力');
    resetStickyFilters();
    setDateField('rangeFromDate', data.dateFrom);
    setDateField('rangeToDate', data.dateTo);
    fillTextFields(I, { lastName: data.lastName });
  },

  // ----------------------------------------------------------------
  //  口座振替データ履歴（SW: bankActionsHistory/sw/_default）
  // ----------------------------------------------------------------

  /**
   * 口座振替データ履歴画面へ遷移する
   */
  navigateToBankActionsHistoryListPage() {
    I.say('【口座振替データ履歴】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=bankActionsHistory%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 口座振替データ履歴の検索条件を入力する（`inputType` 以外にフィルタなし。セッション記憶なし）
   * @param {object} data - bank_actions_history_ichiran_search_data.csv の1行分（inputType）
   */
  fillBankActionsHistorySearchConditions(data) {
    I.say('【口座振替データ履歴】検索条件を入力');
    if (data.inputType) I.selectOption('#inputType', data.inputType);
  },

  // ----------------------------------------------------------------
  //  共通の結果確認
  // ----------------------------------------------------------------

  /**
   * 検索結果テーブルに実データ行が1件以上あることを確認する（`IchiranSearchMixin` へ委譲）。
   */
  async verifyResultRowsExist() {
    await verifyResultRowsExist('経理一覧');
  },

  ...createIchiranMixin('経理一覧'),
};
