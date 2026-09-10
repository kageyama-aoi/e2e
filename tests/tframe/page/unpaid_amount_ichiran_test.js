/**
 * @fileoverview 未収金一覧検索テスト（経理）
 *
 * **テスト内容**
 * - B パターン: 全期間・空条件で検索 → 結果エリアに1件以上表示される
 * - C パターン: 受講生姓で絞り込み → 特定レコードが結果に表示される
 *
 * **対象画面**
 * - `smsTransaction/sw/unpaidAmountList`
 *
 * **プロファイル**
 * - juku_beta 主対象（Issue #198）
 *
 * **データソース**
 * - `data/tframe/unpaid_amount_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - dateFrom / dateTo: 契約日レンジ（欄が無い場合はスキップされる）
 * - lastName: 受講生姓での絞り込み（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('unpaid_amount_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('未収金一覧検索');

Data(csvData).Scenario('未収金一覧で検索できる @admin', async ({ I, keiriIchiranPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  keiriIchiranPage.navigateToUnpaidAmountListPage();
  keiriIchiranPage.fillUnpaidAmountSearchConditions(current);
  keiriIchiranPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('unpaid_amount_ichiran_search', true);

  await keiriIchiranPage.verifyResultRowsExist();
  if (current.expectedName) {
    keiriIchiranPage.verifyRecordInResults(current.expectedName);
  }
});
