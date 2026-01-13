// Feature('しまむら １ログイン機能');
Feature('Dev sandbox (@dev)');
// `loginPageShimamura` Page Objectをインジェクトします
Scenario('正しい認証情報でしまむらにログインし、担当者番号を入力してメインメニューへ進める', ({ I, loginPageShimamura }) => {
  // 環境変数からログイン情報を取得します（プロファイルによって値が切り替わります）
  const username = process.env.SHIMAMURA_USER;
  const password = process.env.SHIMAMURA_PASSWORD;
  const tantousyaNumber = process.env.SHIMAMURA_TANTOUSYA;

  // 環境変数が正しく読み込まれているかチェック
  if (!username || !password || !tantousyaNumber) {
    throw new Error('❌ ログイン情報（SHIMAMURA_USER, SHIMAMURA_PASSWORD, SHIMAMURA_TANTOUSYA）が環境変数に設定されていません。プロファイルの設定を確認してください。');
  }

  // Page Objectのメソッドを呼び出してログイン処理を実行します
  loginPageShimamura.login(username, password);
  
  // ログイン後、担当者番号を入力してメインメニューへ進みます
  loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);
  
  // タイムスタンプ付きでスクリーンショットを保存するカスタムステップを呼び出します
  I.saveScreenshotWithTimestamp('LOGIN_Shimamura_MainMenu.png');

  I.say('--- テスト正常終了: しまむらログイン ---');
});