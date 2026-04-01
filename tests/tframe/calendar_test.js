/**
 * @fileoverview カレンダーメニューテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、カレンダー配下のサブメニューを押下して遷移確認
 *
 * **最終更新日**
 * - 2026-04-01
 */

const calendarSideMenu = require('../../data/tframe/calendarSideMenu');

Feature('カレンダーメニュー');

Scenario('管理者ログイン後にカレンダーメニュー配下を押下確認できる @admin', async ({ loginKannrisyaPage, calendarPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  calendarPage.clickCalendarIcon();
  await calendarPage.verifyMenuNavigation(calendarSideMenu);
  pause();
});
