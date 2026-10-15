/**
 * @fileoverview Eメールテンプレート編集（新規登録）テスト
 *
 * **テスト内容**
 * - 管理者ログイン後、Eメールテンプレート編集画面でフォームを入力して新規登録
 *
 * **データソース**
 * - `data/tframe/email_template_touroku_data.csv`
 * - プロファイル別CSV（`email_template_touroku_data_tframe.juku_beta.csv`）で categoryId を環境ごとに切替
 *   （既存カテゴリの record ID は環境ごとに異なるため）
 *
 * **CSV カラム一覧**
 * - 必須: name, categoryId（既存のEメールテンプレートカテゴリの record ID。
 *   未指定=「設定なし」は保存時バリデーションエラーになる）
 * - 任意: subject, body, description
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('email_template_touroku_data', 'tframe'),
  (row) => row.name
);

Feature('Eメールテンプレート編集');

Data(csvData).Scenario('管理者ログイン後にEメールテンプレートを新規登録できる @admin', async ({ I, loginKannrisyaPage, emailTourokuPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  emailTourokuPage.navigateToEmailTemplateRegisterPage();
  emailTourokuPage.fillEmailTemplateForm(current);
  I.saveScreenshotWithTimestamp('email_template_touroku_input', true);

  await emailTourokuPage.submitEmailTemplateForm(current.name);
  I.saveScreenshotWithTimestamp('email_template_touroku_saved', true);
});
