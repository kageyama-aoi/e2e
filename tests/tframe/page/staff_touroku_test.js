/**
 * @fileoverview スタッフ登録テスト
 *
 * **テスト内容**
 * - 管理者ログイン後、スタッフ登録画面でフォームを入力して新規登録
 *
 * **データソース**
 * - `data/tframe/staff_touroku_data.csv`
 * - プロファイル別CSV（例: staff_touroku_data_tframe.culture_beta.csv）があれば優先使用
 *
 * **CSV カラム一覧**
 * - 必須: lastName
 * - 任意: firstName, lastNameFurigana, firstNameFurigana,
 *         phone1Number, phone2Number, phone3Number,
 *         gender, birthdateYear, birthdateMonth, birthdateDay,
 *         email1, email2,
 *         idnumber, personStatus, branchId_area_id, branchId_branch_id,
 *         title, department,
 *         primaryAddressPostalcode, primaryAddressState, primaryAddressCity,
 *         primaryAddressStreet, primaryAddressKana, sendDocumentHome,
 *         description
 *
 * **最終更新日**
 * - 2026-04-22
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('staff_touroku_data', 'tframe'),
  (row) => `${row.lastName} ${row.firstName}`
);

Feature('スタッフ登録');

Data(csvData).Scenario('管理者ログイン後にスタッフを新規登録できる @admin', async ({ I, loginKannrisyaPage, staffPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  staffPage.navigateToRegisterPage();
  staffPage.fillRegistrationForm(current);
  I.saveScreenshotWithTimestamp('staff_touroku_input', true);

  await staffPage.submitAndVerifyRegistration(current.lastName);
  I.saveScreenshotWithTimestamp('staff_touroku_saved', true);
});
