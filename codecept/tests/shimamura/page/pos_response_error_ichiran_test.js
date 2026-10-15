/**
 * @fileoverview shimamura POSレスポンスエラー一覧検索テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果エリアに1件以上表示される
 * - エラー発生店舗で絞り込み → その店舗のエラーが結果の行に表示される（結果はリンクではなく行）
 *
 * **データソース**
 * - `data/shimamura/pos_response_error_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario         : シナリオラベル（必須）
 * - error_resource_id: エラー発生店舗（select の表示名）（任意）
 * - expectedName     : 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('pos_response_error_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('POSレスポンスエラー一覧検索');

Before(beforeShimamura);

Data(csvData).Scenario('POSレスポンスエラー一覧で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToPosResponseErrorPage();

  const hasCondition = current.error_resource_id;
  if (hasCondition) ichiranPageShimamura.fillPosResponseErrorSearchConditions(current);

  ichiranPageShimamura.clickPosResponseErrorSearchAndWait();
  I.saveScreenshotWithTimestamp('pos_response_error_ichiran_search', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyPosResponseErrorRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyPosResponseErrorResultsExist();
  }
});
