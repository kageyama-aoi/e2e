/**
 * @fileoverview shimamura 講師一覧 E2E テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果に1件以上表示される
 *
 * **データソース**
 * - `data/shimamura/teacher_list_ichiran_search_data.csv`
 */
const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('teacher_list_ichiran_search_data'),
  (row) => row.scenario
);

Feature('講師一覧検索');

Before(beforeShimamura);

Data(csvData).Scenario('講師一覧で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToTeacherListPage();

  const hasCondition = current.last_name || current.first_name;
  if (hasCondition) ichiranPageShimamura.fillTeacherListSearchConditions(current);

  ichiranPageShimamura.clickTeacherListSearchAndWait();
  I.saveScreenshotWithTimestamp('teacher_list_ichiran', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyTeacherListRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyTeacherListResultsExist();
  }
});
