/**
 * @fileoverview Eメールメニューテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、Eメール配下のサブメニューを押下して遷移確認
 *
 * **最終更新日**
 * - 2026-04-01
 */

const emailSideMenu = require('../../data/tframe/emailSideMenu');

Feature('Eメールメニュー');

Scenario('管理者ログイン後にEメールメニュー配下を押下確認できる @admin', async ({ loginKannrisyaPage, emailPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  emailPage.clickEmailIcon();
  await emailPage.verifyMenuNavigation(emailSideMenu);
});
