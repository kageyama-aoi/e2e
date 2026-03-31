/**
 * @fileoverview 受講生メニューテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、受講生アイコンをクリック
 *
 * **最終更新日**
 * - 2026-03-31
 */

Feature('受講生メニュー');

Scenario('管理者ログイン後に受講生アイコンを開ける @admin', ({ I, loginKannrisyaPage, jukuseiPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  jukuseiPage.clickJukuseiIcon();

  pause();

  // TODO: サブメニュー選択・画面検証を追加
});
