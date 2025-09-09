Feature('しまむら ログイン機能');

// `loginPageShimamura` Page Objectをインジェクトします
Scenario('正しい認証情報でしまむらにログインし、担当者番号を入力してメインメニューへ進める', ({ I, loginPageShimamura }) => {
  // .env.shimamura ファイルに定義したユーザー情報を使用します
  const username = process.env.TESTGCP_SHIMAMURA_USER;
  const password = process.env.TESTGCP_SHIMAMURA_PASSWORD;

  // Page Objectのメソッドを呼び出してログイン処理を実行します
  loginPageShimamura.login(username, password);

  // ログイン後、担当者番号を入力してメインメニューへ進みます
  loginPageShimamura.enterTantousyaNumberAndProceed();

  // タイムスタンプ付きでスクリーンショットを保存するカスタムステップを呼び出します
  I.saveScreenshotWithTimestamp('LOGIN_Shimamura_MainMenu.png');
});