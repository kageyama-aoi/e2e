/**
 * @fileoverview 講師スケジュールレポート 一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 全期間・空条件で検索 → スケジュール明細に実データ行が1件以上表示される
 * - C パターン: キャンセルを除外して検索 → 実データ行が1件以上表示される
 *
 * **対象画面**: `report/sw/teScheduleReport`
 * **プロファイル**: culture_beta 主対象（Issue #212。juku_beta でも可）
 * **データソース**: `data/tframe/report_teschedule_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - dateFrom / dateTo: スケジュール開始日レンジ（既定が当月のため広げる。YYYY-MM-DD）
 * - cancelStatus: キャンセル表示（任意・select value。1=キャンセルのみ / 2=キャンセル除外）
 * - attendanceStatus: 出席情報（任意・select value。notSet=未入力 / 2=出席 / 1=欠席）
 * - expectedName: 結果確認用テキスト（空の場合は「実データ行あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('report_teschedule_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('講師スケジュールレポート一覧検索');

Data(csvData).Scenario('講師スケジュールレポートで検索できる @admin', async ({ I, reportIchiranPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  reportIchiranPage.navigateToTeScheduleListPage();
  reportIchiranPage.fillTeScheduleSearchConditions(current);
  reportIchiranPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('report_teschedule_ichiran_search', true);

  await reportIchiranPage.verifyResultRowsExist();
  if (current.expectedName) {
    reportIchiranPage.verifyRecordInResults(current.expectedName);
  }
});
