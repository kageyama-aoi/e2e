/**
 * @fileoverview 口座振替請求データ読込 ガード確認テスト
 *
 * **テスト内容**
 * - ファイル・トランザクションID未入力、および不正フォーマットのファイルを投入したときの
 *   ガードメッセージを確認する。正しい組み合わせ（#219の口座振替請求データ作成で生成される
 *   実際のトランザクションID・銀行フォーマット依存の振替結果ファイル）は未調査のため、
 *   実際の読込（実データ更新）はテスト対象外とする（Issue #220）。
 *
 * **対象画面**: `bankTransfer/ew/bankTransferImport`
 * **プロファイル**: culture_beta / juku_beta 両対応
 * **データソース**: `data/tframe/bank_transfer_import_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - filePath: 取込ファイルのパス（空なら未選択のまま実行）
 * - transactionId: トランザクションID（空なら未入力のまま実行）
 * - expectedKey: 期待するガードメッセージの種類（'noInput' | 'invalidFormat'）。
 *   実際のメッセージ文言は `KeiriIchiranPage.clickBankTransferImportAndVerify` が
 *   `isEnglish()` で日英を切り替えて判定する
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('bank_transfer_import_data', 'tframe'),
  (row) => row.scenario
);

Feature('口座振替請求データ読込');

Data(csvData).Scenario('口座振替請求データ読込のガードメッセージを確認できる @admin', ({ I, keiriIchiranPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  keiriIchiranPage.navigateToBankTransferImportPage();
  keiriIchiranPage.fillBankTransferImportConditions(current);
  keiriIchiranPage.clickBankTransferImportAndVerify(current.expectedKey);
  I.saveScreenshotWithTimestamp('bank_transfer_import', true);
});
