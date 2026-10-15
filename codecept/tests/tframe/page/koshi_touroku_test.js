/**
 * @fileoverview 講師登録テスト
 *
 * **テスト内容**
 * - 管理者ログイン後、講師登録画面でフォームを入力して新規登録
 *
 * **データソース**
 * - `data/tframe/koshi_touroku_data.csv`
 * - プロファイル別CSV（例: koshi_touroku_data_tframe.culture_beta.csv）があれば優先使用
 *
 * **CSV カラム一覧**
 * - 必須: lastName, firstName
 * - 任意: lastNameFurigana, firstNameFurigana, phone1Number, gender,
 *         birthdateYear, birthdateMonth, birthdateDay, email1,
 *         idnumber, personStatus, enrollDate,
 *         zeiKubun, bankPaymentType, bankAccountType,
 *         bankAccountNo, bankName, bankBranchName, bankAccountName,
 *         primaryAddressPostalcode, primaryAddressState, primaryAddressCity,
 *         primaryAddressStreet, primaryAddressKana, description
 *
 * **最終更新日**
 * - 2026-04-22
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('koshi_touroku_data', 'tframe'),
  (row) => `${row.lastName} ${row.firstName}`
);

Feature('講師登録');

Data(csvData).Scenario('管理者ログイン後に講師を新規登録できる @admin', async ({ I, loginKannrisyaPage, koshiPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  koshiPage.navigateToRegisterPage();
  koshiPage.fillRegistrationForm(current);
  I.saveScreenshotWithTimestamp('koshi_touroku_input', true);

  await koshiPage.submitAndVerifyRegistration(current.lastName);
  I.saveScreenshotWithTimestamp('koshi_touroku_saved', true);
});
