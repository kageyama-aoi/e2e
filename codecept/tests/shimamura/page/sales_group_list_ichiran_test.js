/**
 * @fileoverview shimamura 料金パッケージ一覧検索テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果に1件以上表示される
 * - パッケージ名で絞り込み → 該当パッケージが結果に表示される
 *
 * **データソース**
 * - `data/shimamura/sales_group_list_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario    : シナリオラベル（必須）
 * - name        : 料金パッケージ名（任意・前方一致）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('sales_group_list_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('料金パッケージ一覧検索');

Before(beforeShimamura);

Data(csvData).Scenario('料金パッケージ一覧で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToSalesGroupListPage();

  const hasCondition = current.name;
  if (hasCondition) ichiranPageShimamura.fillSalesGroupListSearchConditions(current);

  ichiranPageShimamura.clickSalesGroupListSearchAndWait();
  I.saveScreenshotWithTimestamp('sales_group_list_ichiran_search', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifySalesGroupListRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifySalesGroupListResultsExist();
  }
});
