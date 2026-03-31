/**
 * @fileoverview カレンダーメニューテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、カレンダーアイコンをクリック
 *
 * **最終更新日**
 * - 2026-03-31
 */

Feature('カレンダーメニュー');

Scenario('管理者ログイン後にカレンダーアイコンを開ける @admin', ({ I, loginKannrisyaPage, calendarPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  calendarPage.clickCalendarIcon();

  pause();

  // TODO: サブメニュー選択・画面検証を追加
});
