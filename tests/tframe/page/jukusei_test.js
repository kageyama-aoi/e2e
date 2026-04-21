/**
 * @fileoverview 受講生メニューテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、受講生配下のサブメニューを押下して遷移確認
 *
 * **最終更新日**
 * - 2026-04-01
 */

const studentSideMenu = require('../../data/tframe/studentSideMenu');

Feature('受講生メニュー');

Scenario('管理者ログイン後に受講生メニュー配下を押下確認できる @admin', async ({ loginKannrisyaPage, jukuseiPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  jukuseiPage.clickJukuseiIcon();
  await jukuseiPage.verifyMenuNavigation(studentSideMenu);
});
