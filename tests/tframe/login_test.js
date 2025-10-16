Feature('ログイン機能');

// Page Objectをインジェクトします
Scenario('正しい認証情報でログインできる', ({ I, loginKannrisyaPage }) => {
  // Page Objectのメソッドを呼び出してログイン処理を実行します
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);

  // ログイン後の成功を検証します
  loginKannrisyaPage.seeLogout();
});