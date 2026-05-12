/**
 * @fileoverview shimamura 未収金一覧 E2E テスト
 *
 * **テスト内容**
 * - 今日基準で検索 → 結果テーブルが表示される（0件でも可）
 * - 全期間で検索（query_date=2099-12-31）→ 結果テーブルが表示される
 *
 * **注意**
 * - 未収金一覧の結果行は a.listViewTdLinkS1 ではなく専用テーブル形式。
 *   .listViewPaginationTdS1（ページネーション）を結果表示確認に使う。
 *
 * **データソース**
 * - `data/shimamura/mishukin_list_ichiran_search_data.csv`
 */
const { loadCsvWithProfile, withScenarioLabel } = require('../../support/utils');
const { validateShimamuraEnv } = require('../../support/shimamura/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('mishukin_list_ichiran_search_data'),
  (row) => row.scenario
);

Feature('未収金一覧検索');

Before(async ({ login, loginPageShimamura }) => {
  const tantousyaNumber = validateShimamuraEnv();
  await login('user');
  await loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);
});

Data(csvData).Scenario('未収金一覧で検索できる @dev', async ({ I, classMemberPageShimamura, current }) => {
  classMemberPageShimamura.navigateToMishukinListPage();

  const hasCondition = current.last_name || current.query_date;
  if (hasCondition) classMemberPageShimamura.fillMishukinSearchConditions(current);

  classMemberPageShimamura.clickMishukinSearchAndWait();
  I.saveScreenshotWithTimestamp('mishukin_list_ichiran', true);
  classMemberPageShimamura.verifyMishukinTableVisible();
});
