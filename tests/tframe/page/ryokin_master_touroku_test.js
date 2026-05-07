/**
 * @fileoverview 料金マスタ作成テスト
 *
 * **テスト内容**
 * - 管理者ログイン後、料金マスタ作成画面でフォームを入力して新規登録
 *
 * **対応環境**
 * - tframe.juku_test のみ（culture_beta では料金マスタ機能が未提供）
 *
 * **データソース**
 * - `data/tframe/ryokin_master_touroku_data.csv`
 *
 * **CSV カラム一覧**
 * - 必須: name, feeSubcategory, gesshaKubun, amountNotax, dueType, dueDay
 * - 任意: targetMonth, nextGesshaApplied, description
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('ryokin_master_touroku_data', 'tframe'),
  (row) => row.name
);

Feature('料金マスタ作成');

Data(csvData).Scenario('管理者ログイン後に料金マスタを新規作成できる @admin', async ({ I, ryokinMasterPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  ryokinMasterPage.navigateToRegisterPage();
  ryokinMasterPage.fillRegistrationForm(current);
  I.saveScreenshotWithTimestamp('ryokin_master_touroku_input', true);

  await ryokinMasterPage.submitAndVerifyRegistration(current.name);
  I.saveScreenshotWithTimestamp('ryokin_master_touroku_saved', true);
});
