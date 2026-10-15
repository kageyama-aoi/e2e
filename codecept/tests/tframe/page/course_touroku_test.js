/**
 * @fileoverview コース登録テスト
 *
 * **テスト内容**
 * - 管理者ログイン後、コース登録画面でフォームを入力して新規登録
 *
 * **データソース**
 * - `data/tframe/course_touroku_data.csv`
 *
 * **CSV カラム一覧**
 * - 必須: name
 * - 任意: school_area_id, school_branch_id, shortname, courseCategory, description
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('course_touroku_data', 'tframe'),
  (row) => row.name
);

Feature('コース登録');

Data(csvData).Scenario('管理者ログイン後にコースを新規登録できる @admin', async ({ I, coursePage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  coursePage.navigateToRegisterPage();
  coursePage.fillRegistrationForm(current);
  I.saveScreenshotWithTimestamp('course_touroku_input', true);

  await coursePage.submitAndVerifyRegistration(current.name);
  I.saveScreenshotWithTimestamp('course_touroku_saved', true);
});
