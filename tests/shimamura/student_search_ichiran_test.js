/**
 * @fileoverview shimamura 受講生検索（一覧）E2E テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果に1件以上表示される
 * - 姓で絞り込み → 結果に1件以上表示される
 *
 * **データソース**
 * - `data/shimamura/student_search_ichiran_search_data.csv`
 */
const { loadCsvWithProfile, withScenarioLabel } = require('../../support/utils');
const { validateShimamuraEnv } = require('../../support/shimamura/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('student_search_ichiran_search_data'),
  (row) => row.scenario
);

Feature('受講生検索');

Before(async ({ login, loginPageShimamura }) => {
  const tantousyaNumber = validateShimamuraEnv();
  await login('user');
  await loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);
});

Data(csvData).Scenario('受講生を検索できる @dev', async ({ I, classMemberPageShimamura, current }) => {
  classMemberPageShimamura.navigateToStudentSearchPage();

  const hasCondition = current.last_name || current.first_name;
  if (hasCondition) classMemberPageShimamura.fillStudentSearchConditions(current);

  classMemberPageShimamura.clickStudentSearchAndWait();
  I.saveScreenshotWithTimestamp('student_search_ichiran', true);

  if (current.expectedName) {
    classMemberPageShimamura.verifyStudentRecordInResults(current.expectedName);
  } else {
    classMemberPageShimamura.verifyStudentResultsExist();
  }
});
