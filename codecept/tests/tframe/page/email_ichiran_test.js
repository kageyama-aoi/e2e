/**
 * @fileoverview Eメール一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 全期間・空条件で検索 → 結果エリアに実データ行が1件以上表示される
 * - C パターン: 受講生姓で絞り込み → 特定レコードが結果に表示される
 *
 * **対象画面**: `email/sw/_default`
 * **プロファイル**: juku_beta 主対象（Issue #199）
 * **データソース**: `data/tframe/email_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - dateFrom / dateTo: 送信日レンジ（既定が当月のため広げる）
 * - lastName: 受講生姓での絞り込み（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('email_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('Eメール一覧検索');

Data(csvData).Scenario('Eメール一覧で検索できる @admin', async ({ I, emailIchiranPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  emailIchiranPage.navigateToEmailListPage();
  emailIchiranPage.fillEmailSearchConditions(current);
  emailIchiranPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('email_ichiran_search', true);

  await emailIchiranPage.verifyResultRowsExist();
  if (current.expectedName) {
    emailIchiranPage.verifyRecordInResults(current.expectedName);
  }
});
