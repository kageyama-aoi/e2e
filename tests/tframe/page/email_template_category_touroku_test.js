/**
 * @fileoverview Eメールテンプレートカテゴリ編集（新規登録）テスト
 *
 * **テスト内容**
 * - 管理者ログイン後、Eメールテンプレートカテゴリ編集画面でフォームを入力して新規登録
 *
 * **データソース**
 * - `data/tframe/email_template_category_touroku_data.csv`
 *
 * **CSV カラム一覧**
 * - 必須: name
 * - 任意: template_category_status（既定=Active）, description
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('email_template_category_touroku_data', 'tframe'),
  (row) => row.name
);

Feature('Eメールテンプレートカテゴリ編集');

Data(csvData).Scenario('管理者ログイン後にEメールテンプレートカテゴリを新規登録できる @admin', async ({ I, loginKannrisyaPage, emailTourokuPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  emailTourokuPage.navigateToEmailTemplateCategoryRegisterPage();
  emailTourokuPage.fillEmailTemplateCategoryForm(current);
  I.saveScreenshotWithTimestamp('email_template_category_touroku_input', true);

  await emailTourokuPage.submitEmailTemplateCategoryForm(current.name);
  I.saveScreenshotWithTimestamp('email_template_category_touroku_saved', true);
});
