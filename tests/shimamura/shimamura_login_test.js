Feature('しまむら ログイン機能');

// `loginPageShimamura` Page Objectをインジェクトします
Scenario('正しい認証情報でしまむらにログインできる', ({ I, loginPageShimamura }) => {
  // .env.shimamura ファイルに定義したユーザー情報を使用します
  const username = process.env.SHIMAMURA_USER;
  const password = process.env.SHIMAMURA_PASSWORD;

  // Page Objectのメソッドを呼び出してログイン処理を実行します
  loginPageShimamura.login(username, password);

  // ログイン後の成功を検証します
  loginPageShimamura.seeLogout();

  // タイムスタンプ付きでスクリーンショットを保存するカスタムステップを呼び出します
  I.saveScreenshotWithTimestamp('LOGIN_Shimamura.png');
});