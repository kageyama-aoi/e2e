/**
 * @fileoverview shimamura 口座振替請求データ履歴検索テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果に1件以上表示される
 * - 種類（作成／読込）で絞り込み → 結果のリンク（種類）に該当の種類が表示される
 *
 * **データソース**
 * - `data/shimamura/account_debit_bill_history_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario    : シナリオラベル（必須）
 * - input_type  : 種類（select の表示名: 作成／読込）（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('account_debit_bill_history_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('口座振替請求データ履歴検索');

Before(beforeShimamura);

Data(csvData).Scenario('口座振替請求データ履歴で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToAccountDebitBillHistoryPage();

  const hasCondition = current.input_type;
  if (hasCondition) ichiranPageShimamura.fillAccountDebitBillHistorySearchConditions(current);

  ichiranPageShimamura.clickAccountDebitBillHistorySearchAndWait();
  I.saveScreenshotWithTimestamp('account_debit_bill_history_ichiran_search', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyAccountDebitBillHistoryRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyAccountDebitBillHistoryResultsExist();
  }
});
