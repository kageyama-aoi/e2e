/**
 * @fileoverview 講師メニューテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、講師アイコンをクリック
 *
 * **最終更新日**
 * - 2026-03-31
 */

Feature('講師メニュー');

Scenario('管理者ログイン後に講師アイコンを開ける @admin', ({ I, loginKannrisyaPage, koshiPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  koshiPage.clickKoshiIcon();

  pause();

  // TODO: サブメニュー選択・画面検証を追加
});
