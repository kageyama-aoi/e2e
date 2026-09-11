/**
 * @fileoverview お知らせ編集（新規登録）テスト
 *
 * **テスト内容**
 * - 管理者ログイン後、お知らせ編集画面でフォームを入力して新規登録
 *
 * **データソース**
 * - `data/tframe/announcement_touroku_data.csv`
 *
 * **CSV カラム一覧**
 * - 必須: title, postStart（掲載開始日）, postEnd（掲載終了日）
 * - 任意: smsgroup（対象区分。既定=受講生）, grade（学年）,
 *         branchId_area_id, branchId_branch_id, description
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('announcement_touroku_data', 'tframe'),
  (row) => row.title
);

Feature('お知らせ編集');

Data(csvData).Scenario('管理者ログイン後にお知らせを新規登録できる @admin', async ({ I, loginKannrisyaPage, emailTourokuPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  emailTourokuPage.navigateToAnnouncementRegisterPage();
  emailTourokuPage.fillAnnouncementForm(current);
  I.saveScreenshotWithTimestamp('announcement_touroku_input', true);

  await emailTourokuPage.submitAnnouncementForm(current.title);
  I.saveScreenshotWithTimestamp('announcement_touroku_saved', true);
});
