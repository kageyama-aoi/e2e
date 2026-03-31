/**
 * @fileoverview コースメニューテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、コースアイコンをクリック
 *
 * **最終更新日**
 * - 2026-03-31
 */

Feature('コースメニュー');

Scenario('管理者ログイン後にコースアイコンを開ける @admin', ({ I, loginKannrisyaPage, coursePage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  coursePage.clickCourseIcon();

  pause();

  // TODO: サブメニュー選択・画面検証を追加
});
