/**
 * @fileoverview shimamura コンタクト一覧 E2E テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果に1件以上表示される
 *
 * **データソース**
 * - `data/shimamura/contact_module_list_ichiran_search_data.csv`
 */
const { loadCsvWithProfile, withScenarioLabel } = require('../../support/utils');
const { validateShimamuraEnv } = require('../../support/shimamura/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('contact_module_list_ichiran_search_data'),
  (row) => row.scenario
);

Feature('コンタクト一覧検索');

Before(async ({ login, loginPageShimamura }) => {
  const tantousyaNumber = validateShimamuraEnv();
  await login('user');
  await loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);
});

Data(csvData).Scenario('コンタクト一覧で検索できる @dev', async ({ I, classMemberPageShimamura, current }) => {
  classMemberPageShimamura.navigateToContactModuleListPage();

  const hasCondition = current.last_name || current.company_name;
  if (hasCondition) classMemberPageShimamura.fillContactModuleListSearchConditions(current);

  classMemberPageShimamura.clickContactModuleListSearchAndWait();
  I.saveScreenshotWithTimestamp('contact_module_list_ichiran', true);

  if (current.expectedName) {
    classMemberPageShimamura.verifyContactModuleListRecordInResults(current.expectedName);
  } else {
    classMemberPageShimamura.verifyContactModuleListResultsExist();
  }
});
