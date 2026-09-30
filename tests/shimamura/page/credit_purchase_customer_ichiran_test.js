/**
 * @fileoverview shimamura 債権買取顧客情報一覧検索テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果エリアに1件以上表示される
 * - 会員番号で絞り込み → 該当会員番号が結果に表示される
 *
 * **データソース**
 * - `data/shimamura/credit_purchase_customer_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario    : シナリオラベル（必須）
 * - idnumber    : 会員番号（任意）
 * - last_name   : 姓（任意）
 * - first_name  : 名（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('credit_purchase_customer_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('債権買取顧客情報一覧検索');

Before(beforeShimamura);

Data(csvData).Scenario('債権買取顧客情報一覧で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToCreditPurchaseCustomerPage();

  const hasCondition = current.idnumber || current.last_name || current.first_name;
  if (hasCondition) ichiranPageShimamura.fillCreditPurchaseCustomerSearchConditions(current);

  ichiranPageShimamura.clickCreditPurchaseCustomerSearchAndWait();
  I.saveScreenshotWithTimestamp('credit_purchase_customer_ichiran_search', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyCreditPurchaseCustomerRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyCreditPurchaseCustomerResultsExist();
  }
});
