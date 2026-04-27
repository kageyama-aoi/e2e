/**
 * @fileoverview 商品登録テスト
 *
 * **テスト内容**
 * - 管理者ログイン後、商品登録画面でフォームを入力して新規登録
 *
 * **データソース**
 * - `data/tframe/shohin_touroku_data.csv`
 *
 * **CSV カラム一覧**
 * - 必須: name
 * - 任意: productCode, branchId_area_id, branchId_branch_id, productCategory,
 *         courseValid, courseCount, courseTime,
 *         name1, feeSubcategory1, amountNotax1, dueType1, dueDay1, targetMonth1,
 *         description
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('shohin_touroku_data', 'tframe'),
  (row) => row.name
);

Feature('商品登録');

Data(csvData).Scenario('管理者ログイン後に商品を新規登録できる @admin', async ({ I, loginKannrisyaPage, shohinPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  shohinPage.navigateToRegisterPage();
  shohinPage.fillRegistrationForm(current);
  I.saveScreenshotWithTimestamp('shohin_touroku_input', true);

  await shohinPage.submitAndVerifyRegistration(current.name);
  I.saveScreenshotWithTimestamp('shohin_touroku_saved', true);
});
