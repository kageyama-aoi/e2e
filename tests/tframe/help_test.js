/**
 * @fileoverview ヘルプメニューテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、ヘルプアイコンをクリック
 *
 * **最終更新日**
 * - 2026-03-31
 */

Feature('ヘルプメニュー');

Scenario('管理者ログイン後にヘルプアイコンを開ける @admin', ({ I, loginKannrisyaPage, helpPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  helpPage.clickHelpIcon();

  pause();

  // TODO: サブメニュー選択・画面検証を追加
});
