/**
 * @fileoverview 経理メニュー - 料金マスタ一覧テスト
 *
 * **テスト内容**
 * - 管理者ログイン後、経理アイコンをクリック
 * - 料金マスタ一覧を開き、一覧が表示されることを確認
 *
 * **前提条件**
 * - 環境変数 LOGIN_TFRAME_URL / ADMIN_USER / ADMIN_PASSWORD が設定されていること
 *
 * **最終更新日**
 * - 2026-03-31
 */

Feature('経理メニュー - 料金マスタ一覧');

Scenario('管理者ログイン後に料金マスタ一覧を開ける @admin', ({ I, loginKannrisyaPage, keiryoMasterPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  keiryoMasterPage.clickKeiryoIcon();
  keiryoMasterPage.openRyokinMasterList();
  keiryoMasterPage.seeRyokinMasterList();

  pause();
});
