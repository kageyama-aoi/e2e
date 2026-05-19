/**
 * @fileoverview shimamura コース一覧（管理）E2E テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果に1件以上表示される
 * - コース名で絞り込み → 結果に1件以上表示される
 *
 * **データソース**
 * - `data/shimamura/course_ichiran_search_data.csv`
 */
const { loadCsvWithProfile, withScenarioLabel } = require('../../support/utils');
const { beforeShimamura } = require('../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('course_ichiran_search_data'),
  (row) => row.scenario
);

Feature('コース一覧検索');

Before(beforeShimamura);

Data(csvData).Scenario('コース一覧で検索できる @dev', async ({ I, classMemberPageShimamura, current }) => {
  classMemberPageShimamura.navigateToCourseIchiranPage();

  const hasCondition = current.name;
  if (hasCondition) classMemberPageShimamura.fillCourseIchiranSearchConditions(current);

  classMemberPageShimamura.clickCourseIchiranSearchAndWait();
  I.saveScreenshotWithTimestamp('course_ichiran', true);

  if (current.expectedName) {
    classMemberPageShimamura.verifyCourseIchiranRecordInResults(current.expectedName);
  } else {
    classMemberPageShimamura.verifyCourseIchiranResultsExist();
  }
});
