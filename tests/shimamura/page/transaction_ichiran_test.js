/**
 * @fileoverview shimamura 入出金一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 空条件で検索 → 結果エリアに1件以上表示される
 * - C パターン: 姓で絞り込み → 結果エリアに1件以上表示される
 *
 * **データソース**
 * - `data/shimamura/transaction_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario    : シナリオラベル（必須）
 * - last_name   : 姓（任意）
 * - course_name : コース名（任意）
 * - smsgroup    : 種別 student/teacher（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../support/utils');
const { beforeShimamura } = require('../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('transaction_ichiran_search_data'),
  (row) => row.scenario
);

Feature('入出金一覧検索');

Before(beforeShimamura);

Data(csvData).Scenario('入出金一覧で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToTransactionListPage();

  const hasCondition = current.last_name || current.course_name || current.smsgroup;
  if (hasCondition) ichiranPageShimamura.fillTransactionSearchConditions(current);

  ichiranPageShimamura.clickTransactionSearchAndWait();
  I.saveScreenshotWithTimestamp('transaction_ichiran_search', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyTransactionRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyTransactionResultsExist();
  }
});
