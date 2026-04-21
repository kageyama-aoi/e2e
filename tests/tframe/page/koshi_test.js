/**
 * @fileoverview 講師メニューテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、講師配下のサブメニューを押下して遷移確認
 *
 * **最終更新日**
 * - 2026-04-01
 */

const teacherSideMenu = require('../../data/tframe/teacherSideMenu');

Feature('講師メニュー');

Scenario('管理者ログイン後に講師メニュー配下を押下確認できる @admin', async ({ loginKannrisyaPage, koshiPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  koshiPage.clickKoshiIcon();
  await koshiPage.verifyMenuNavigation(teacherSideMenu);
});
