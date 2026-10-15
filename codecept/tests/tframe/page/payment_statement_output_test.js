/**
 * @fileoverview 支払調書 出力テスト
 *
 * **テスト内容**
 * - 出力対象年（既定=当年）で支払調書を出力し、成功メッセージ（「〜出力が完了しました」）を確認する。
 *   出力ボタンは同画面を isExportType=output 付きで再読込する流れでファイルダウンロードが発生するが、
 *   ダウンロードしたファイルの中身までは検証しない（menu_coverage.md バケットC の当面の妥協方針）。
 *
 * **対象画面**: `shareiTotal/sw/paymentStatement`（culture のみ）
 * **プロファイル**: culture_beta 専用（Issue #217）
 * **データソース**: `data/tframe/payment_statement_output_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - targetYear: 出力対象年（任意・select value。空なら既定の当年のまま）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('payment_statement_output_data', 'tframe'),
  (row) => row.scenario
);

Feature('支払調書出力');

Data(csvData).Scenario('支払調書を出力できる @admin', async ({ I, keiriIchiranPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  keiriIchiranPage.navigateToPaymentStatementPage();
  keiriIchiranPage.fillPaymentStatementConditions(current);
  keiriIchiranPage.clickPaymentStatementOutputAndVerify();
  I.saveScreenshotWithTimestamp('payment_statement_output', true);
});
