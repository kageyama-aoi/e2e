/**
 * @fileoverview マイページ（講師/受講生）ログイン機能のテスト
 *
 * **テスト内容**
 * - 講師マイページ: TEST_USER_TEACHER でのログイン成功・メニュー一覧抽出
 * - 受講生マイページ: TEST_USER_STUDENT でのログイン成功・メニュー一覧抽出
 *
 * **作成日**
 * - 2025-12-20
 *
 * **最終更新日**
 * - 2026-04-20
 */
Feature('マイページ ログイン機能');

Scenario('講師マイページにログインしてメニューを確認できる', async ({ I, loginMyPageTeacher }) => {
  loginMyPageTeacher.login(process.env.TEST_USER_TEACHER, process.env.TEST_PASSWORD_TEACHER);
  loginMyPageTeacher.seeLogout();
  await loginMyPageTeacher.logMenuItems();
  I.saveScreenshotWithTimestamp('LOGIN_Mypage_Teacher.png');
});

Scenario('受講生マイページにログインしてメニューを確認できる', async ({ I, loginMyPageStudent }) => {
  loginMyPageStudent.login(process.env.TEST_USER_STUDENT, process.env.TEST_PASSWORD_STUDENT);
  loginMyPageStudent.seeLogout();
  await loginMyPageStudent.logMenuItems();
  I.saveScreenshotWithTimestamp('LOGIN_Mypage_Student.png');
});