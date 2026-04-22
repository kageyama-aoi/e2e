/**
 * @fileoverview 講師登録テスト
 *
 * **テスト内容**
 * - 管理者ログイン後、講師登録画面でフォームを入力して新規登録
 *
 * **最終更新日**
 * - 2026-04-22
 */

const { generateTestTeacher } = require('../../data/tframe/teacherRegisterData');

Feature('講師登録');

Scenario('管理者ログイン後に講師を新規登録できる @admin', async ({ I, loginKannrisyaPage, koshiPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  const teacherData = generateTestTeacher();

  koshiPage.navigateToRegisterPage();
  koshiPage.fillRegistrationForm(teacherData);
  I.saveScreenshotWithTimestamp('koshi_touroku_input', true);

  await koshiPage.submitAndVerifyRegistration(teacherData.lastName);
  I.saveScreenshotWithTimestamp('koshi_touroku_saved', true);
});
