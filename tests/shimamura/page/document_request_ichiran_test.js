/**
 * @fileoverview shimamura 資料請求一覧検索テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果エリアに1件以上表示される
 * - 姓で絞り込み → 該当者が結果に表示される
 *
 * **データソース**
 * - `data/shimamura/document_request_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario    : シナリオラベル（必須）
 * - last_name   : 姓（任意）
 * - first_name  : 名（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('document_request_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('資料請求一覧検索');

Before(beforeShimamura);

Data(csvData).Scenario('資料請求一覧で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToDocumentRequestListPage();

  const hasCondition = current.last_name || current.first_name;
  if (hasCondition) ichiranPageShimamura.fillDocumentRequestSearchConditions(current);

  ichiranPageShimamura.clickDocumentRequestSearchAndWait();
  I.saveScreenshotWithTimestamp('document_request_ichiran_search', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyDocumentRequestRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyDocumentRequestResultsExist();
  }
});
