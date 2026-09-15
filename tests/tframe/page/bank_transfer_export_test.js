/**
 * @fileoverview 口座振替請求データ作成 一括処理テスト
 *
 * **テスト内容**
 * - 作成ボタンを実行し、結果メッセージが許容範囲内であることを確認する。
 *   校舎・請求データ作成月は画面側で固定（select disabled・表示のみ）のため入力フィールドは無い。
 *   実機で2回連続実行しても同一件数（正常N件・異常M件）を返すことを確認済みで、実行のたびに
 *   新規請求データを積み増す処理ではなく当該請求月の対象を都度再集計する処理と判明している。
 *
 * **対象画面**: `bankTransfer/ew/bankTransferExport`
 * **プロファイル**: culture_beta / juku_beta 両対応（Issue #219）
 * **データソース**: `data/tframe/bank_transfer_export_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須。入力フィールドが無いためこれのみ）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('bank_transfer_export_data', 'tframe'),
  (row) => row.scenario
);

Feature('口座振替請求データ作成');

Data(csvData).Scenario('口座振替請求データ作成を実行できる @admin', async ({ I, keiriIchiranPage, loginKannrisyaPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  keiriIchiranPage.navigateToBankTransferExportPage();
  await keiriIchiranPage.clickBankTransferExportAndVerify();
  I.saveScreenshotWithTimestamp('bank_transfer_export', true);
});
