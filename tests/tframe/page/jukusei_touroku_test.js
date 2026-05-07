/**
 * @fileoverview 受講生登録テスト
 *
 * **テスト内容**
 * - 管理者ログイン後、受講生登録画面でフォームを入力して新規登録
 *
 * **データソース**
 * - `data/tframe/jukusei_touroku_data.csv`
 *
 * **CSV カラム一覧**
 * - 必須: lastName, firstName
 * - 任意: lastNameFurigana, firstNameFurigana, phone1Number, gender,
 *         birthdateYear, birthdateMonth, birthdateDay, email1,
 *         idnumber, personStatus, school_area_id, school_branch_id, enrollDate,
 *         primaryAddressPostalcode, primaryAddressStreet, primaryAddressKana, description
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('jukusei_touroku_data', 'tframe'),
  (row) => `${row.lastName} ${row.firstName}`
);

Feature('受講生登録');

Data(csvData).Scenario('管理者ログイン後に受講生を新規登録できる @admin', async ({ I, jukuseiPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  jukuseiPage.navigateToRegisterPage();
  jukuseiPage.fillRegistrationForm(current);
  I.saveScreenshotWithTimestamp('jukusei_touroku_input', true);

  await jukuseiPage.submitAndVerifyRegistration(current.lastName);
  I.saveScreenshotWithTimestamp('jukusei_touroku_saved', true);
});
