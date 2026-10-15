/**
 * @fileoverview tframe レポートアイコン配下の一覧検索 Page Object
 *
 * 対象（culture / juku 両方に存在）:
 * - 問合せ・入学・退学レポート   `report/sw/inquiryEnrollCancelReport`（年月別の集計表）
 * - 受講生データ組合せレポート   `report/sw/stDataCombinedReport`（組合せ集計表・select 多め）
 * - 受講生スケジュールレポート   `report/sw/stScheduleReport`（受講生別スケジュール明細）
 * - 講師スケジュールレポート     `report/sw/teScheduleReport`（講師別スケジュール明細）
 *
 * 既存の `ReportPage.js` はメニューナビ検証専用のため、一覧検索は本 PO に分ける
 * （`EmailPage`（menu-nav）と `EmailIchiranPage`（一覧検索）の関係と同じ）。
 *
 * いずれの画面も検索結果は `.tf-group-body-search-result table.tf-data-table-table` に
 * 行描画されるため、`IchiranSearchMixin.verifyResultRowsExist` がそのまま使える。
 *
 * クセ:
 * - スケジュール系2画面は日付レンジ `rangeFrom` / `rangeTo` の既定値が「当月」→ 検索前に広げる。
 * - エリア/対象区分/ステイタス等がサーバー側にセッション記憶されるため、
 *   空値（「すべて」）を持つセレクトは検索前にリセットする。
 *   （`searchItems` / `personStatus`（組合せレポート）は空選択肢が無いので既定のまま使う）
 *
 * テストは culture_beta を主対象とする（Issue #212。juku_beta でも可）。
 */

const { I } = inject();
const createIchiranMixin = require('../_common/IchiranMixin');
const { setDateField, resetSelects, verifyResultRowsExist } = require('../_common/IchiranSearchMixin');

module.exports = {
  // ----------------------------------------------------------------
  //  問合せ・入学・退学レポート（SW: report/sw/inquiryEnrollCancelReport）
  // ----------------------------------------------------------------

  /**
   * 問合せ・入学・退学レポート画面へ遷移する
   */
  navigateToInquiryListPage() {
    I.say('【問合せ・入学・退学レポート】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=report%2Fsw%2FinquiryEnrollCancelReport');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 問合せ・入学・退学レポートの検索条件を入力する
   * @param {object} data - report_inquiry_ichiran_search_data.csv の1行分（targetYear / personStatus）
   */
  fillInquirySearchConditions(data) {
    I.say('【問合せ・入学・退学レポート】検索条件を入力');
    resetSelects(['school_area_id', 'school_branch_id', 'personStatus']);
    if (data.targetYear) I.selectOption('#targetYearYear', data.targetYear);
    if (data.personStatus) I.selectOption('#personStatus', data.personStatus);
  },

  // ----------------------------------------------------------------
  //  受講生データ組合せレポート（SW: report/sw/stDataCombinedReport）
  // ----------------------------------------------------------------

  /**
   * 受講生データ組合せレポート画面へ遷移する
   */
  navigateToStDataCombinedListPage() {
    I.say('【受講生データ組合せレポート】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=report%2Fsw%2FstDataCombinedReport');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 受講生データ組合せレポートの検索条件を入力する
   * @param {object} data - report_stdata_ichiran_search_data.csv の1行分（searchItems / personStatus）
   */
  fillStDataCombinedSearchConditions(data) {
    I.say('【受講生データ組合せレポート】検索条件を入力');
    resetSelects(['school_area_id', 'school_branch_id']);
    if (data.searchItems) I.selectOption('#searchItems', data.searchItems);
    if (data.personStatus) I.selectOption('#personStatus', data.personStatus);
  },

  // ----------------------------------------------------------------
  //  受講生スケジュールレポート（SW: report/sw/stScheduleReport）
  // ----------------------------------------------------------------

  /**
   * 受講生スケジュールレポート画面へ遷移する
   */
  navigateToStScheduleListPage() {
    I.say('【受講生スケジュールレポート】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=report%2Fsw%2FstScheduleReport');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 受講生スケジュールレポートの検索条件を入力する
   * @param {object} data - report_stschedule_ichiran_search_data.csv の1行分
   *                        （dateFrom / dateTo / cancelStatus / attendanceStatus）
   */
  fillStScheduleSearchConditions(data) {
    I.say('【受講生スケジュールレポート】検索条件を入力');
    resetSelects(['cancelStatus', 'attendanceStatus']);
    setDateField('rangeFrom', data.dateFrom);
    setDateField('rangeTo', data.dateTo);
    if (data.cancelStatus) I.selectOption('#cancelStatus', data.cancelStatus);
    if (data.attendanceStatus) I.selectOption('#attendanceStatus', data.attendanceStatus);
  },

  // ----------------------------------------------------------------
  //  講師スケジュールレポート（SW: report/sw/teScheduleReport）
  // ----------------------------------------------------------------

  /**
   * 講師スケジュールレポート画面へ遷移する
   */
  navigateToTeScheduleListPage() {
    I.say('【講師スケジュールレポート】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=report%2Fsw%2FteScheduleReport');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 講師スケジュールレポートの検索条件を入力する
   * @param {object} data - report_teschedule_ichiran_search_data.csv の1行分
   *                        （dateFrom / dateTo / cancelStatus / attendanceStatus）
   */
  fillTeScheduleSearchConditions(data) {
    I.say('【講師スケジュールレポート】検索条件を入力');
    resetSelects(['cancelStatus', 'attendanceStatus']);
    setDateField('rangeFrom', data.dateFrom);
    setDateField('rangeTo', data.dateTo);
    if (data.cancelStatus) I.selectOption('#cancelStatus', data.cancelStatus);
    if (data.attendanceStatus) I.selectOption('#attendanceStatus', data.attendanceStatus);
  },

  // ----------------------------------------------------------------
  //  共通の結果確認
  // ----------------------------------------------------------------

  /**
   * 検索結果テーブルに実データ行が1件以上あることを確認する（`IchiranSearchMixin` へ委譲）。
   */
  async verifyResultRowsExist() {
    await verifyResultRowsExist('レポート一覧');
  },

  ...createIchiranMixin('レポート一覧'),
};
