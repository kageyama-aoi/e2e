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
 * - 講師謝礼合計一覧 `shareiTotal/sw/_default`（culture のみ。#214）
 * - 支払調書 `shareiTotal/sw/paymentStatement`（culture のみ・帳票出力系。#217）
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
  //  講師謝礼合計一覧（SW: shareiTotal/sw/_default）culture のみ
  // ----------------------------------------------------------------

  /**
   * 講師謝礼合計一覧画面へ遷移する
   */
  navigateToShareiTotalListPage() {
    I.say('【講師謝礼合計一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=shareiTotal%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 講師謝礼合計一覧の検索条件を入力する（空フィールドはスキップ）
   * 計上月（`keijouMonthMonth`）が特定月にセッション記憶されデータ0件になることがあるため、
   * 検索前に必ず「すべて」へリセットする（経理・Eメール系と同じセッション記憶のクセ。#214）。
   * @param {object} data - sharei_total_ichiran_search_data.csv の1行分
   *                        （keijouMonthYear / shareiKomoku / calType）
   */
  fillShareiTotalSearchConditions(data) {
    I.say('【講師謝礼合計一覧】検索条件を入力');
    resetSelects(['keijouMonthMonth']);
    if (data.keijouMonthYear) I.selectOption('#keijouMonthYear', data.keijouMonthYear);
    if (data.shareiKomoku) I.selectOption('#shareiKomoku', data.shareiKomoku);
    if (data.calType) I.selectOption('#calType', data.calType);
  },

  // ----------------------------------------------------------------
  //  支払調書（SW: shareiTotal/sw/paymentStatement）culture のみ・帳票出力系
  // ----------------------------------------------------------------
  // 出力ボタンは「同画面に isExportType=output を付けて再読込 → ファイルダウンロード + #tf-message-summary
  // に結果メッセージ表示」という一覧検索系と違う流れになる（#217）。ダウンロードしたファイルの中身までは
  // 検証せず、`#tf-message-summary` の成功メッセージ（「〜出力が完了しました」）の有無で確認する。

  /**
   * 支払調書画面へ遷移する
   */
  navigateToPaymentStatementPage() {
    I.say('【支払調書】画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=shareiTotal%2Fsw%2FpaymentStatement');
    I.waitForElement('#paymentStatementOutput', 10);
  },

  /**
   * 支払調書の出力条件を入力する（空フィールドはスキップ。既定=当年ですでに出力可能）
   * @param {object} data - payment_statement_output_data.csv の1行分（targetYear）
   */
  fillPaymentStatementConditions(data) {
    I.say('【支払調書】出力条件を入力');
    if (data.targetYear) I.selectOption('#targetYear', data.targetYear);
  },

  /**
   * 出力ボタンをクリックし、成功メッセージが表示されることを確認する
   */
  clickPaymentStatementOutputAndVerify() {
    I.say('【支払調書】出力ボタンをクリック');
    I.click('#paymentStatementOutput');
    I.waitForElement('#tf-message-summary', 10);
    I.see('完了しました', '#tf-message-summary');
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
