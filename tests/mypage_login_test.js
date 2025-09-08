Feature('マイページ ログイン機能');

// `loginMyPage` Page Objectをインジェクトします
Scenario('正しい認証情報でマイページにログインできる', ({ I, loginMyPage }) => {
  // .envファイルに定義したマイページ用のユーザー情報を使用します
  // TODO: .envファイルに MYPAGE_USER と MYPAGE_PASSWORD を定義してください
  const username = process.env.TEST_USER_TEACHER;
  const password = process.env.TEST_PASSWORD_TEACHER;

  // Page Objectのメソッドを呼び出してログイン処理を実行します
  loginMyPage.login(username, password);

  // ログイン後の成功を検証します
  loginMyPage.seeLogout();

  // タイムスタンプ付きでスクリーンショットを保存するカスタムステップを呼び出します
  I.saveScreenshotWithTimestamp('LOGIN_Mypage.png');
});