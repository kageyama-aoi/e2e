/**
 * @fileoverview Eメールメニューテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、Eメールアイコンをクリック
 *
 * **最終更新日**
 * - 2026-03-31
 */

Feature('Eメールメニュー');

Scenario('管理者ログイン後にEメールアイコンを開ける @admin', ({ I, loginKannrisyaPage, emailPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  emailPage.clickEmailIcon();

  pause();

  // TODO: サブメニュー選択・画面検証を追加
});
