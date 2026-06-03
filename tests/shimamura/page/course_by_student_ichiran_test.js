/**
 * @fileoverview shimamura コース別受講生一覧 E2E テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果に1件以上表示される
 * - コース名で絞り込み → 結果に1件以上表示される
 *
 * **データソース**
 * - `data/shimamura/course_by_student_ichiran_search_data.csv`
 */
const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('course_by_student_ichiran_search_data'),
  (row) => row.scenario
);

Feature('コース別受講生一覧検索');

Before(beforeShimamura);

Data(csvData).Scenario('コース別受講生一覧で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToCourseByStudentPage();

  const hasCondition = current.course_name;
  if (hasCondition) ichiranPageShimamura.fillCourseByStudentSearchConditions(current);

  ichiranPageShimamura.clickCourseByStudentSearchAndWait();
  I.saveScreenshotWithTimestamp('course_by_student_ichiran', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyCourseByStudentRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyCourseByStudentResultsExist();
  }
});
