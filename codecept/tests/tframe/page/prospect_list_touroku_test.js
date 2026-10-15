/**
 * @fileoverview 名簿リスト編集（新規登録）テスト
 *
 * **テスト内容**
 * - 管理者ログイン後、名簿リスト編集画面でフォームを入力して新規登録
 *
 * **データソース**
 * - `data/tframe/prospect_list_touroku_data.csv`
 *
 * **CSV カラム一覧**
 * - 必須: name
 * - 任意: school_area_id, school_branch_id, description
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('prospect_list_touroku_data', 'tframe'),
  (row) => row.name
);

Feature('名簿リスト編集');

Data(csvData).Scenario('管理者ログイン後に名簿リストを新規登録できる @admin', async ({ I, loginKannrisyaPage, emailTourokuPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  emailTourokuPage.navigateToProspectListRegisterPage();
  emailTourokuPage.fillProspectListForm(current);
  I.saveScreenshotWithTimestamp('prospect_list_touroku_input', true);

  await emailTourokuPage.submitProspectListForm(current.name);
  I.saveScreenshotWithTimestamp('prospect_list_touroku_saved', true);
});
