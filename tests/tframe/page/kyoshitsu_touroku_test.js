/**
 * @fileoverview 教室登録テスト
 *
 * **テスト内容**
 * - 管理者ログイン後、教室登録画面でフォームを入力して新規登録
 *
 * **データソース**
 * - `data/tframe/kyoshitsu_touroku_data.csv`
 *
 * **CSV カラム一覧**
 * - 必須: name
 * - 任意: school_area_id, school_branch_id, shortname, capacity, description
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('kyoshitsu_touroku_data', 'tframe'),
  (row) => row.name
);

Feature('教室登録');

Data(csvData).Scenario('管理者ログイン後に教室を新規登録できる @admin', async ({ I, classroomPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  classroomPage.navigateToRegisterPage();
  classroomPage.fillRegistrationForm(current);
  I.saveScreenshotWithTimestamp('kyoshitsu_touroku_input', true);

  await classroomPage.submitAndVerifyRegistration(current.name);
  I.saveScreenshotWithTimestamp('kyoshitsu_touroku_saved', true);
});
