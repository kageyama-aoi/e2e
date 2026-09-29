/**
 * @fileoverview shimamura 料金一覧(共通)検索テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果エリアに1件以上表示される
 * - 料金名で絞り込み → 該当料金が結果に表示される（testgcp はテスト用共通料金を1件登録済み）
 *
 * **データソース**
 * - `data/shimamura/fee_common_list_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario       : シナリオラベル（必須）
 * - fee_name       : 料金名（任意）
 * - fee_subcategory: 料金サブ区分（select の表示名）（任意）
 * - expectedName   : 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('fee_common_list_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('料金一覧(共通)検索');

Before(beforeShimamura);

Data(csvData).Scenario('料金一覧(共通)で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToFeeCommonListPage();

  const hasCondition = current.fee_name || current.fee_subcategory;
  if (hasCondition) ichiranPageShimamura.fillFeeCommonListSearchConditions(current);

  ichiranPageShimamura.clickFeeCommonListSearchAndWait();
  I.saveScreenshotWithTimestamp('fee_common_list_ichiran_search', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyFeeCommonListRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyFeeCommonListResultsExist();
  }
});
