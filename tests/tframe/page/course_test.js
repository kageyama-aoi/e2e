/**
 * @fileoverview コースメニューテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、コース配下のサブメニューを押下して遷移確認
 *
 * **最終更新日**
 * - 2026-04-01
 */

const courseSideMenu = require('../../data/tframe/courseSideMenu');

Feature('コースメニュー');

Scenario('管理者ログイン後にコースメニュー配下を押下確認できる @admin', async ({ loginKannrisyaPage, coursePage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  coursePage.clickCourseIcon();
  await coursePage.verifyMenuNavigation(courseSideMenu);
});
