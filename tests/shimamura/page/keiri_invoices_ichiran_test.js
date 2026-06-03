/**
 * @fileoverview shimamura 受注・売上（経理）E2E テスト
 *
 * **テスト内容**
 * - デフォルト（現在年月）で表示 → フォームが再表示される
 * - 別月を指定して表示 → フォームが再表示される
 *
 * **注意**
 * - 検索ボタンは `input[name="button"][value="表示"]`（POST submit）
 * - 日付は keiri_month_year / keiri_month_month / keiri_month_day の3セレクト
 * - 結果行に a.listViewTdLinkS1 は存在しないため、フォーム再表示を確認に使う
 *
 * **データソース**
 * - `data/shimamura/keiri_invoices_ichiran_search_data.csv`
 */
const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('keiri_invoices_ichiran_search_data'),
  (row) => row.scenario
);

Feature('受注・売上（経理）表示');

Before(beforeShimamura);

Data(csvData).Scenario('受注・売上を表示できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToKeiriInvoicesPage();

  const hasCondition = current.keiri_year || current.keiri_month || current.keiri_day;
  if (hasCondition) ichiranPageShimamura.fillKeiriInvoicesSearchConditions(current);

  ichiranPageShimamura.clickKeiriInvoicesDisplayAndWait();
  I.saveScreenshotWithTimestamp('keiri_invoices_ichiran', true);
  ichiranPageShimamura.verifyKeiriInvoicesPageLoaded();
});
