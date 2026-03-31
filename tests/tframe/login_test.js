/**
 * @fileoverview 管理者ログイン機能のテスト
 * 
 * **テスト内容**
 * - 管理者ユーザー (ADMIN_USER) でのログイン成功確認
 * - ログイン後にログアウトボタンが表示されることを検証
 * 
 * **作成日**
 * - 2025-12-20
 * 
 * **最終更新日**
 * - 2026-01-17
 */
Feature('ログイン機能');

// Page Objectをインジェクトします
Scenario('正しい認証情報でログインできる @admin', ({ I, loginKannrisyaPage }) => {
  // Page Objectのメソッドを呼び出してログイン処理を実行します
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  pause();
  // ログイン後の成功を検証します
  loginKannrisyaPage.seeLogout();
});

Scenario('TEST_USER_STUDENTでログインできる @student', ({ I, loginKannrisyaPage }) => {
  loginKannrisyaPage.login(process.env.TEST_USER_STUDENT, process.env.TEST_PASSWORD_STUDENT);
  pause();
  loginKannrisyaPage.seeLogout();
});