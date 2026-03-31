/**
 * @fileoverview ホームメニューテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、ホームアイコンをクリック
 *
 * **最終更新日**
 * - 2026-03-31
 */

Feature('ホームメニュー');

Scenario('管理者ログイン後にホームアイコンを開ける @admin', ({ I, loginKannrisyaPage, homePage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  homePage.clickHomeIcon();

  pause();

  // TODO: サブメニュー選択・画面検証を追加
});
