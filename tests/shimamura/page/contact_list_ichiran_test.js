/**
 * @fileoverview shimamura 候補生一覧 E2E テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果に1件以上表示される
 * - 姓で絞り込み → 結果に1件以上表示される
 *
 * **データソース**
 * - `data/shimamura/contact_list_ichiran_search_data.csv`
 */
const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('contact_list_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('候補生一覧検索');

Before(beforeShimamura);

Data(csvData).Scenario('候補生一覧で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToContactListPage();

  const hasCondition = current.last_name || current.first_name;
  if (hasCondition) ichiranPageShimamura.fillContactListSearchConditions(current);

  ichiranPageShimamura.clickContactListSearchAndWait();
  I.saveScreenshotWithTimestamp('contact_list_ichiran', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyContactListRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyContactListResultsExist();
  }
});
