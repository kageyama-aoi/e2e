/**
 * @fileoverview shimamura 法人/団体一覧検索テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果エリアに1件以上表示される
 * - 法人/団体名で絞り込み → 該当法人が結果に表示される（testgcp はテスト用法人を1件登録済み）
 *
 * **データソース**
 * - `data/shimamura/account_list_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario             : シナリオラベル（必須）
 * - name                 : 法人/団体名（任意）
 * - billing_address_state: 都道府県（任意）
 * - expectedName         : 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('account_list_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('法人/団体一覧検索');

Before(beforeShimamura);

Data(csvData).Scenario('法人/団体一覧で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToAccountListPage();

  const hasCondition = current.name || current.billing_address_state;
  if (hasCondition) ichiranPageShimamura.fillAccountListSearchConditions(current);

  ichiranPageShimamura.clickAccountListSearchAndWait();
  I.saveScreenshotWithTimestamp('account_list_ichiran_search', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyAccountListRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyAccountListResultsExist();
  }
});
