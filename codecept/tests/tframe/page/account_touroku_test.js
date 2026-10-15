/**
 * @fileoverview 法人・団体登録テスト
 *
 * **テスト内容**
 * - 管理者ログイン後、法人・団体登録画面でフォームを入力して新規登録
 *
 * **データソース**
 * - `data/tframe/account_touroku_data.csv`
 * - プロファイル別CSV（例: account_touroku_data_tframe.culture_beta.csv）があれば優先使用
 *
 * **CSV カラム一覧**
 * - 必須: name, nameFurigana
 * - 任意: idnumber, branchId_area_id, branchId_branch_id,
 *         phone1Number, houjinTantosha, shareiMeisaiNo,
 *         primaryAddressPostalcode, primaryAddressState, primaryAddressCity,
 *         primaryAddressStreet, primaryAddressKana, description
 *
 * **最終更新日**
 * - 2026-04-22
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('account_touroku_data', 'tframe'),
  (row) => row.name
);

Feature('法人・団体登録');

Data(csvData).Scenario('管理者ログイン後に法人・団体を新規登録できる @admin', async ({ I, loginKannrisyaPage, accountPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  accountPage.navigateToRegisterPage();
  accountPage.fillRegistrationForm(current);
  I.saveScreenshotWithTimestamp('account_touroku_input', true);

  await accountPage.submitAndVerifyRegistration(current.name);
  I.saveScreenshotWithTimestamp('account_touroku_saved', true);
});
