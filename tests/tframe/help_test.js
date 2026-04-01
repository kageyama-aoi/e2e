/**
 * @fileoverview ヘルプメニューテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、ヘルプ配下のサブメニューを押下して遷移確認
 *
 * **最終更新日**
 * - 2026-04-01
 */

const helpSideMenu = require('../../data/tframe/helpSideMenu');

Feature('ヘルプメニュー');

Scenario('管理者ログイン後にヘルプメニュー配下を押下確認できる @admin', async ({ loginKannrisyaPage, helpPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  helpPage.clickHelpIcon();
  await helpPage.verifyMenuNavigation(helpSideMenu);
});
