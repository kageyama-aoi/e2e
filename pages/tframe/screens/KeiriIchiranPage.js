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
 * - 翌月月謝一括作成 `smsFee/ew/tuitionFeeBulkCreate`（両対応・一括処理系。#219）
 * - 講師謝礼合計計算 `shareiTotal/sw/teRewardTotalCalc`（culture のみ・一括処理系。#219）
 * - 口座振替請求データ作成 `bankTransfer/ew/bankTransferExport`（両対応・一括処理系。#219）
 * - 一括入金処理 `smsPayment/sw/batchPayment`（両対応・一括処理系。実データを変更しない
 *   ガード確認のみ実施。#219）
 * - 口座振替請求データ読込 `bankTransfer/ew/bankTransferImport`（両対応・インポート系。
 *   実データを変更しないガード確認のみ実施。#220）
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
const { verifyBulkActionResult, selectAreaThenBranch, isEnglish } = require('../../../support/tframe/utils');
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
  //  翌月月謝一括作成（EW: smsFee/ew/tuitionFeeBulkCreate）両対応・一括処理系
  // ----------------------------------------------------------------
  // 「あらかじめ翌月の月謝が作成されている場合、二重で作成されることはありません」（画面ツールチップより）
  // ＝冪等。初回実行は「〜作成しました」、対象が尽きた再実行は「処理対象の月謝情報がありません。」
  // （`tf-message-error` クラスだが実際は正常系）を返す。#219

  /**
   * 翌月月謝一括作成画面へ遷移する
   */
  navigateToTuitionFeeBulkCreatePage() {
    I.say('【翌月月謝一括作成】画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=smsFee%2Few%2FtuitionFeeBulkCreate');
    I.waitForElement('#ewCreateBulkTuitionFee', 10);
  },

  /**
   * 対象年月・校舎を入力する（空フィールドはスキップ＝既定値のまま）
   * @param {object} data - tuition_fee_bulk_create_data.csv の1行分
   *                        （targetYearMonth / school_area_id / school_branch_id）
   */
  fillTuitionFeeBulkCreateConditions(data) {
    I.say('【翌月月謝一括作成】対象年月・校舎を入力');
    if (data.targetYearMonth) I.selectOption('#targetYearMonth', data.targetYearMonth);
    selectAreaThenBranch(I, { area: data.school_area_id, branch: data.school_branch_id });
  },

  /**
   * 一括作成ボタンをクリックし、結果メッセージを確認する（成功 or 対象なしのどちらも正常）
   */
  async clickTuitionFeeBulkCreateAndVerify() {
    I.say('【翌月月謝一括作成】一括作成ボタンをクリック');
    await verifyBulkActionResult(I, '#ewCreateBulkTuitionFee');
  },

  // ----------------------------------------------------------------
  //  講師謝礼合計計算（SW: shareiTotal/sw/teRewardTotalCalc）culture のみ・一括処理系
  // ----------------------------------------------------------------
  // 対象の計上年月に「講師謝礼計算」（ChosekinPage.calculateTeRewardAndVerify）済みのデータが
  // 無いと「処理対象の講師謝礼情報がありません。」になる（正常系）。#219

  /**
   * 講師謝礼合計計算画面へ遷移する
   */
  navigateToTeRewardTotalCalcPage() {
    I.say('【講師謝礼合計計算】画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=shareiTotal%2Fsw%2FteRewardTotalCalc');
    I.waitForElement('#calculate', 10);
  },

  /**
   * 計上年月を入力する（空ならスキップ＝既定値のまま）
   * @param {object} data - te_reward_total_calc_data.csv の1行分（postingYearMonth）
   */
  fillTeRewardTotalCalcConditions(data) {
    I.say('【講師謝礼合計計算】計上年月を入力');
    if (data.postingYearMonth) I.selectOption('#postingYearMonth', data.postingYearMonth);
  },

  /**
   * 計算ボタンをクリックし、結果メッセージを確認する（成功 or 対象なしのどちらも正常）
   */
  async clickTeRewardTotalCalcAndVerify() {
    I.say('【講師謝礼合計計算】計算ボタンをクリック');
    await verifyBulkActionResult(I, '#calculate');
  },

  // ----------------------------------------------------------------
  //  口座振替請求データ作成（EW: bankTransfer/ew/bankTransferExport）両対応・一括処理系
  // ----------------------------------------------------------------
  // 校舎（branchId）はログイン中の管理者に固定（select disabled）、請求データ作成月（billingMonth）も
  // 画面表示のみで選択不可のため、入力フィールドは無い。実機で2回連続実行しても同一件数
  // （正常N件・異常M件）を返す＝実行のたびに新規請求データを積み増す一括処理ではなく、
  // 当該請求月の対象を都度再集計する処理と判明（#219）。

  /**
   * 口座振替請求データ作成画面へ遷移する
   */
  navigateToBankTransferExportPage() {
    I.say('【口座振替請求データ作成】画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=bankTransfer%2Few%2FbankTransferExport');
    I.waitForElement('#createBtn', 10);
  },

  /**
   * 作成ボタンをクリックし、結果メッセージを確認する（成功 or 対象なしのどちらも正常）
   */
  async clickBankTransferExportAndVerify() {
    I.say('【口座振替請求データ作成】作成ボタンをクリック');
    await verifyBulkActionResult(I, '#createBtn');
  },

  // ----------------------------------------------------------------
  //  口座振替請求データ読込（EW: bankTransfer/ew/bankTransferImport）両対応・インポート系
  // ----------------------------------------------------------------
  // 取込ファイル・トランザクションIDが必須で、正しい組み合わせは #219 の
  // 口座振替請求データ作成で生成された実際のトランザクションID・振替結果ファイルが必要
  // （銀行フォーマット依存のため未調査）。本テストは**ガードメッセージの確認のみ**とし、
  // 実際の読込（実データ更新）はテスト対象外とする（#220）。

  /**
   * 口座振替請求データ読込画面へ遷移する
   */
  navigateToBankTransferImportPage() {
    I.say('【口座振替請求データ読込】画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=bankTransfer%2Few%2FbankTransferImport');
    I.waitForElement('#readBtn', 10);
  },

  /**
   * ファイル・トランザクションIDを入力する（空フィールドはスキップ＝未入力のまま）
   * @param {object} data - bank_transfer_import_data.csv の1行分（filePath / transactionId）
   */
  fillBankTransferImportConditions(data) {
    if (data.filePath) {
      I.say(`【口座振替請求データ読込】ファイル選択: ${data.filePath}`);
      I.attachFile('#readFile', data.filePath);
    } else {
      I.say('【口座振替請求データ読込】ファイル選択スキップ（未選択ケース）');
    }
    if (data.transactionId) I.fillField('#transactionId', data.transactionId);
  },

  /**
   * 読込ボタンをクリックし、期待するガードメッセージを確認する（日英とも許容）
   * @param {string} expectedKey - 'noInput'（ファイル・トランザクションID未入力）
   *                               | 'invalidFormat'（不正フォーマットのファイル）
   */
  clickBankTransferImportAndVerify(expectedKey) {
    I.say('【口座振替請求データ読込】読込ボタンをクリック');
    I.click('#readBtn');
    I.waitForElement('#tf-message-summary', 10);
    const messages = {
      noInput: isEnglish() ? 'Import file cannot be blank' : '取込ファイル をご入力ください',
      invalidFormat: isEnglish() ? 'The specified file is not eligible' : '対象ファイルではありません',
    };
    I.see(messages[expectedKey], '#tf-message-summary');
  },

  // ----------------------------------------------------------------
  //  一括入金処理（SW: smsPayment/sw/batchPayment）両対応・一括処理系
  // ----------------------------------------------------------------
  // 実行すると検索結果一覧から選択した対象へ実際に入金確定処理を行う（他画面の未収金/入金データに
  // 影響する副作用）。そのため本テストは**実データを一切変更しない安全な経路のみ**を検証する方針とする：
  // 存在しない受講生ID番号で検索して結果0件にし、何も選択できない状態で実行ボタンを押して
  // 「一括入金の処理対象を一覧より選択してください。」というガード文言が出ることだけを確認する
  // （実際の入金確定フローはこのテストの対象外・#219）。

  /**
   * 一括入金処理画面へ遷移する
   */
  navigateToBatchPaymentPage() {
    I.say('【一括入金処理】画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=smsPayment%2Fsw%2FbatchPayment');
    I.waitForElement('#createBatchPayment', 10);
  },

  /**
   * 実データに影響しない検索条件（存在しないID番号）で検索し、結果0件を確認する
   * @param {object} data - batch_payment_data.csv の1行分（idnumber: 実在しない受講生ID番号）
   */
  searchBatchPaymentWithNoMatch(data) {
    I.say('【一括入金処理】実データに影響しないID番号で検索');
    fillTextFields(I, { idnumber: data.idnumber });
    I.click('#swSearchButton');
    I.wait(2); // AJAX描画待ち
    I.dontSeeElement('#searchResult .tf-data-table-table tbody tr');
  },

  /**
   * 入金方法を入力し、一括入金処理実行ボタンをクリックして
   * 「対象を一覧より選択してください」ガード文言を確認する（実データは変更されない）
   * @param {object} data - batch_payment_data.csv の1行分（paymentType）
   */
  clickCreateBatchPaymentAndVerifyNoTarget(data) {
    I.say('【一括入金処理】入金方法を入力し実行ボタンをクリック（対象0件のガード確認）');
    if (data.paymentType) I.selectOption('#paymentType', data.paymentType);
    I.click('#createBatchPayment');
    I.waitForElement('#tf-message-summary', 10);
    const guardText = isEnglish()
      ? 'Please select the batch deposit to be processed from the list'
      : '一括入金の処理対象を一覧より選択してください';
    I.see(guardText, '#tf-message-summary');
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
