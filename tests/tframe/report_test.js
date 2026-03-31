/**
 * @fileoverview レポートメニューテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、レポートアイコンをクリック
 *
 * **最終更新日**
 * - 2026-03-31
 */

Feature('レポートメニュー');

Scenario('管理者ログイン後にレポートアイコンを開ける @admin', ({ I, loginKannrisyaPage, reportPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  reportPage.clickReportIcon();

  pause();

  // TODO: サブメニュー選択・画面検証を追加
});
