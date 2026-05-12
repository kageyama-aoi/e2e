/**
 * @fileoverview shimamura クラス一覧 E2E テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果に1件以上表示される
 * - クラス名で絞り込み → 結果に1件以上表示される
 *
 * **データソース**
 * - `data/shimamura/class_list_ichiran_search_data.csv`
 */
const { loadCsvWithProfile, withScenarioLabel } = require('../../support/utils');
const { validateShimamuraEnv } = require('../../support/shimamura/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('class_list_ichiran_search_data'),
  (row) => row.scenario
);

Feature('クラス一覧検索');

Before(async ({ login, loginPageShimamura }) => {
  const tantousyaNumber = validateShimamuraEnv();
  await login('user');
  await loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);
});

Data(csvData).Scenario('クラス一覧で検索できる @dev', async ({ I, classMemberPageShimamura, current }) => {
  classMemberPageShimamura.navigateToClassListPage();

  const hasCondition = current.name;
  if (hasCondition) classMemberPageShimamura.fillClassListSearchConditions(current);

  classMemberPageShimamura.clickClassListSearchAndWait();
  I.saveScreenshotWithTimestamp('class_list_ichiran', true);

  if (current.expectedName) {
    classMemberPageShimamura.verifyClassListRecordInResults(current.expectedName);
  } else {
    classMemberPageShimamura.verifyClassListResultsExist();
  }
});
