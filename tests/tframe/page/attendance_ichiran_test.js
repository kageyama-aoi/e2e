/**
 * @fileoverview 本日の出席表一覧 一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 全期間・空条件で検索 → 出席表明細に実データ行が1件以上表示される
 * - C パターン: コースカテゴリ「通常授業」で絞り込み → 実データ行が1件以上表示される
 *
 * **対象画面**: `attendance/sw/_default`
 * **プロファイル**: culture_beta 主対象（Issue #213）
 * **データソース**: `data/tframe/attendance_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - dateFrom / dateTo: スケジュール開始日レンジ（既定が「本日」のみのため広げる。YYYY-MM-DD）
 * - branchValue: 校舎の select value。校舎ごとの出席データ在庫差が大きく、既定の東京(b1)は
 *   0件になりやすいため、データが安定して存在する「営業」校舎を指定する
 * - courseCategory: コースカテゴリ（任意・select value。通常授業/単発授業/発表会/その他）
 * - courseSubtype: タイプ（任意・select value。1=グループ / 2=プライベート）
 * - expectedName: 結果確認用テキスト（空の場合は「実データ行あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('attendance_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('本日の出席表一覧検索');

Data(csvData).Scenario('出席表一覧で検索できる @admin', async ({ I, coursePage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  coursePage.navigateToAttendanceListPage();
  coursePage.fillAttendanceSearchConditions(current);
  coursePage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('attendance_ichiran_search', true);

  await coursePage.verifyAttendanceResultRowsExist();
  if (current.expectedName) {
    coursePage.verifyRecordInResults(current.expectedName);
  }
});
