/**
 * @fileoverview 一括入金処理 ガード確認テスト
 *
 * **テスト内容**
 * - 一括入金処理を実行すると検索結果一覧から選択した対象へ実際に入金確定処理を行うため、
 *   他画面（未収金一覧・入金一覧等）のデータに影響する副作用がある。
 *   本テストは**実データを一切変更しない安全な経路のみ**を検証する：
 *   存在しない受講生ID番号で検索して結果0件にし、何も選択できない状態で実行ボタンを押して
 *   「一括入金の処理対象を一覧より選択してください。」というガード文言が出ることだけを確認する。
 *   実際の入金確定フローはこのテストの対象外（Issue #219 コメント参照）。
 *
 * **対象画面**: `smsPayment/sw/batchPayment`
 * **プロファイル**: culture_beta / juku_beta 両対応（Issue #219）
 * **データソース**: `data/tframe/batch_payment_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - idnumber: 実在しない受講生ID番号（必須。検索結果が確実に0件になる値を指定）
 * - paymentType: 入金方法（任意・select value。実行フィールドの入力確認用）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('batch_payment_data', 'tframe'),
  (row) => row.scenario
);

Feature('一括入金処理');

Data(csvData).Scenario('一括入金処理の対象0件ガードを確認できる @admin', async ({ I, keiriIchiranPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  keiriIchiranPage.navigateToBatchPaymentPage();
  keiriIchiranPage.searchBatchPaymentWithNoMatch(current);
  keiriIchiranPage.clickCreateBatchPaymentAndVerifyNoTarget(current);
  I.saveScreenshotWithTimestamp('batch_payment', true);
});
