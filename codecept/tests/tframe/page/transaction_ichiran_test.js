/**
 * @fileoverview 入出金一覧検索テスト（経理）
 *
 * **テスト内容**
 * - B パターン: 全期間・空条件で検索 → 結果エリアに実データ行が1件以上表示される
 * - C パターン: 受講生姓で絞り込み → 特定レコードが結果に表示される
 *
 * **対象画面**
 * - `smsTransaction/sw/_default`
 *
 * **プロファイル**
 * - juku_beta 主対象（Issue #198）
 *
 * **データソース**
 * - `data/tframe/transaction_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - dateFrom / dateTo: 日付レンジ（既定が当月のため広げる）
 * - lastName: 受講生姓での絞り込み（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('transaction_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('入出金一覧検索');

Data(csvData).Scenario('入出金一覧で検索できる @admin', async ({ I, keiriIchiranPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  keiriIchiranPage.navigateToTransactionListPage();
  keiriIchiranPage.fillTransactionSearchConditions(current);
  keiriIchiranPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('transaction_ichiran_search', true);

  await keiriIchiranPage.verifyResultRowsExist();
  if (current.expectedName) {
    keiriIchiranPage.verifyRecordInResults(current.expectedName);
  }
});
