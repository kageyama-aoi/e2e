/**
 * @fileoverview レポートメニューテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、レポート配下のサブメニューを押下して遷移確認
 *
 * **最終更新日**
 * - 2026-04-01
 */

const reportSideMenu = require('../../data/tframe/reportSideMenu');

Feature('レポートメニュー');

Scenario('管理者ログイン後にレポートメニュー配下を押下確認できる @admin', async ({ loginKannrisyaPage, reportPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  reportPage.clickReportIcon();
  await reportPage.verifyMenuNavigation(reportSideMenu);
});
