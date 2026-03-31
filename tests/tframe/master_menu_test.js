/**
 * @fileoverview マスターメニューテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、マスターアイコンをクリック
 *
 * **最終更新日**
 * - 2026-03-31
 */

Feature('マスターメニュー');

Scenario('管理者ログイン後にマスターアイコンを開ける @admin', ({ I, loginKannrisyaPage, masterMenuPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  masterMenuPage.clickMasterIcon();

  pause();

  // TODO: サブメニュー選択・画面検証を追加
});
