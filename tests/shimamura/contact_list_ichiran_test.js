/**
 * @fileoverview shimamura 問合せ一覧（候補生）E2E テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果に1件以上表示される
 * - 姓で絞り込み → 結果に1件以上表示される
 *
 * **データソース**
 * - `data/shimamura/contact_list_ichiran_search_data.csv`
 */
const { loadCsvWithProfile, withScenarioLabel } = require('../../support/utils');
const { validateShimamuraEnv } = require('../../support/shimamura/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('contact_list_ichiran_search_data'),
  (row) => row.scenario
);

Feature('問合せ一覧（候補生）検索');

Before(async ({ login, loginPageShimamura }) => {
  const tantousyaNumber = validateShimamuraEnv();
  await login('user');
  await loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);
});

Data(csvData).Scenario('問合せ一覧で検索できる @dev', async ({ I, classMemberPageShimamura, current }) => {
  classMemberPageShimamura.navigateToContactListPage();

  const hasCondition = current.last_name || current.first_name;
  if (hasCondition) classMemberPageShimamura.fillContactListSearchConditions(current);

  classMemberPageShimamura.clickContactListSearchAndWait();
  I.saveScreenshotWithTimestamp('contact_list_ichiran', true);

  if (current.expectedName) {
    classMemberPageShimamura.verifyContactListRecordInResults(current.expectedName);
  } else {
    classMemberPageShimamura.verifyContactListResultsExist();
  }
});
