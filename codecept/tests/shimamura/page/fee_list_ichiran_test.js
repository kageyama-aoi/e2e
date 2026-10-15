/**
 * @fileoverview shimamura 料金一覧検索テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果エリアに1件以上表示される
 * - コース名で絞り込み → 該当コースが結果に表示される
 *
 * **データソース**
 * - `data/shimamura/fee_list_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario    : シナリオラベル（必須）
 * - fee_name    : 料金名（任意）
 * - course_name : コース名（任意）
 * - last_name   : 姓（任意）
 * - school_id   : 店舗（select の表示名）（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('fee_list_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('料金一覧検索');

Before(beforeShimamura);

Data(csvData).Scenario('料金一覧で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToFeeListPage();

  const hasCondition = current.fee_name || current.course_name || current.last_name || current.school_id;
  if (hasCondition) ichiranPageShimamura.fillFeeListSearchConditions(current);

  ichiranPageShimamura.clickFeeListSearchAndWait();
  I.saveScreenshotWithTimestamp('fee_list_ichiran_search', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyFeeListRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyFeeListResultsExist();
  }
});
