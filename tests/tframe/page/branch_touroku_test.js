/**
 * @fileoverview 校舎登録テスト
 *
 * **テスト内容**
 * - 管理者ログイン後、校舎登録画面でフォームを入力して新規登録
 *
 * **データソース**
 * - `data/tframe/branch_touroku_data.csv`
 *
 * **CSV カラム一覧**
 * - 必須: schoolName
 * - 任意: area_area_id, schoolCode, schoolPhoneNumber,
 *         primaryAddressPostalcode, primaryAddressStreet, primaryAddressKana,
 *         description
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('branch_touroku_data', 'tframe'),
  (row) => row.schoolName
);

Feature('校舎登録');

Data(csvData).Scenario('管理者ログイン後に校舎を新規登録できる @admin', async ({ I, branchPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  branchPage.navigateToRegisterPage();
  branchPage.fillRegistrationForm(current);
  I.saveScreenshotWithTimestamp('branch_touroku_input', true);

  await branchPage.submitAndVerifyRegistration(current.schoolName);
  I.saveScreenshotWithTimestamp('branch_touroku_saved', true);
});
