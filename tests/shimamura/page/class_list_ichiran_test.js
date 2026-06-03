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
const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('class_list_ichiran_search_data'),
  (row) => row.scenario
);

Feature('クラス一覧検索');

Before(beforeShimamura);

Data(csvData).Scenario('クラス一覧で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToClassListPage();

  const hasCondition = current.name;
  if (hasCondition) ichiranPageShimamura.fillClassListSearchConditions(current);

  ichiranPageShimamura.clickClassListSearchAndWait();
  I.saveScreenshotWithTimestamp('class_list_ichiran', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyClassListRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyClassListResultsExist();
  }
});
