Feature('しまむら １ログイン機能');

// `loginPageShimamura` Page Objectをインジェクトします
Scenario('正しい認証情報でしまむらにログインし、担当者番号を入力してメインメニューへ進める', ({ I, loginPageShimamura }) => {
  // .env.shimamura ファイルに定義したユーザー情報を使用します
  const username = process.env.TESTGCP_SHIMAMURA_USER;
  const password = process.env.TESTGCP_SHIMAMURA_PASSWORD;
  const tantousyaNumber = process.env.TESTGCP_SHIMAMURA_TANTOUSYA;

  I.say('--- テスト開始: しまむらログイン ---');

  // Page Objectのメソッドを呼び出してログイン処理を実行します
  I.say('ステップ1: ログイン処理を開始します。');
  loginPageShimamura.login(username, password);
  I.say('ステップ1: ログイン処理が完了しました。');

  // ログイン後、担当者番号を入力してメインメニューへ進みます
  I.say('ステップ2: 担当者番号を入力してメインメニューへ進みます。');
  loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);
  I.say('ステップ2: メインメニューへの遷移が完了しました。');

  // タイムスタンプ付きでスクリーンショットを保存するカスタムステップを呼び出します
  I.say('最終確認: スクリーンショットを保存します。');
  I.saveScreenshotWithTimestamp('LOGIN_Shimamura_MainMenu.png');

  I.say('--- テスト正常終了: しまむらログイン ---');
});