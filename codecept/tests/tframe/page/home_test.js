/**
 * @fileoverview ホームメニューテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、ホームアイコンをクリックしてホーム画面へ遷移確認
 *
 * **最終更新日**
 * - 2026-04-17
 */

Feature('ホームメニュー');

Scenario('管理者ログイン後にホームアイコンを開ける @admin', ({ I, loginKannrisyaPage, homePage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  homePage.clickHomeIcon();
  homePage.verifyHomeLoaded();
});
