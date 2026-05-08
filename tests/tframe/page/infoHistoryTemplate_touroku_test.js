/**
 * @fileoverview 対応履歴テンプレート登録テスト
 *
 * **テスト内容**
 * - テンプレート名・内容を入力して保存 → 保存後に名前が表示されることを確認
 *
 * **データソース**
 * - `data/tframe/infoHistoryTemplate_touroku_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - menuModule: student または teacher
 * - name: テンプレート名
 * - description: テンプレート内容
 * - expectedName: 保存後の確認テキスト
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('infoHistoryTemplate_touroku_data', 'tframe'),
  (row) => row.scenario
);

Feature('対応履歴テンプレート登録');

Data(csvData).Scenario('対応履歴テンプレートを登録できる @admin', async ({ infoHistoryPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  infoHistoryPage.navigateToTemplateRegisterPage(current.menuModule);
  infoHistoryPage.fillTemplateRegistrationForm(current);
  await infoHistoryPage.submitAndVerifyTemplateRegistration(current.expectedName);
});
