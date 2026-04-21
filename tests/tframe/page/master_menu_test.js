/**
 * @fileoverview マスターメニューテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、マスター配下のサブメニューを押下して遷移確認
 *
 * **最終更新日**
 * - 2026-04-01
 */

const masterSideMenu = require('../../data/tframe/masterSideMenu');

Feature('マスターメニュー');

Scenario('管理者ログイン後にマスターメニュー配下を押下確認できる @admin', async ({ loginKannrisyaPage, masterMenuPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  masterMenuPage.clickMasterIcon();
  await masterMenuPage.verifyMenuNavigation(masterSideMenu);
});
