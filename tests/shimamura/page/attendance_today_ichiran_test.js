/**
 * @fileoverview shimamura 出席表検索 E2E テスト
 *
 * **テスト内容**
 * - デフォルト日付（今日）で「出席表表示」→ ページが正常にロードされる
 * - 日付範囲を指定して「出席表表示」→ ページが正常にロードされる
 *
 * **注意**
 * - 検索ボタンは `input[name="button"][value="出席表表示"]`（POST submit）
 * - `edit_button`（出席表編集）は絶対クリックしないこと
 * - 結果確認は `.listViewPaginationTdS1`（件数0でも存在する）
 *
 * **データソース**
 * - `data/shimamura/attendance_today_ichiran_search_data.csv`
 */
const { loadCsvWithProfile, withScenarioLabel } = require('../../support/utils');
const { beforeShimamura } = require('../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('attendance_today_ichiran_search_data'),
  (row) => row.scenario
);

Feature('出席表検索');

Before(beforeShimamura);

Data(csvData).Scenario('出席表を表示できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToAttendanceTodayPage();

  const hasCondition = current.start_date || current.end_date;
  if (hasCondition) ichiranPageShimamura.fillAttendanceTodaySearchConditions(current);

  ichiranPageShimamura.clickAttendanceTodayDisplayAndWait();
  I.saveScreenshotWithTimestamp('attendance_today_ichiran', true);
  ichiranPageShimamura.verifyAttendanceTodayPageLoaded();
});
