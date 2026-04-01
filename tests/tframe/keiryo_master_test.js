/**
 * @fileoverview 経理メニューテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、経理配下のサブメニューを押下して遷移確認
 *
 * **前提条件**
 * - 環境変数 LOGIN_TFRAME_URL / ADMIN_USER / ADMIN_PASSWORD が設定されていること
 *
 * **最終更新日**
 * - 2026-04-01
 */

const accountingSideMenu = require('../../data/tframe/accountingSideMenu');

Feature('経理メニュー');

Scenario('管理者ログイン後に経理メニュー配下を押下確認できる @admin', async ({ loginKannrisyaPage, keiryoMasterPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  keiryoMasterPage.clickKeiryoIcon();
  await keiryoMasterPage.verifyMenuNavigation(accountingSideMenu);
});
