Feature('ログイン後の画面遷移');

Scenario('ログイン後にAPIを実行しトークンを抽出する', async ({ I, loginPage, apiTestPage }) => {
  I.say('Step 1: 管理者としてログインし、ログイン後の状態を確認します');
  loginPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginPage.seeLogout();

  I.say('Step 2: APIテストページでAPIを実行し、トークンを抽出します');
  // apiTestPage のメソッドを呼び出し、必要なパラメータを渡します
  const tcnToken = await apiTestPage.performApiTestAndExtractToken(
    process.env.TEST_USER_TEACHER,
    process.env.TEST_PASSWORD_TEACHER,
    '講師'
  );

  I.say('Step 3: 抽出したトークンが変数に保存されたことを確認します');
  // 抽出されたトークンは tcnToken 変数に格納されており、このシナリオ内で利用可能です。
  I.say(`保存されたトークン: ${secret(tcnToken)}`);

  I.say('Step 4: 実行結果のスクリーンショットを保存します');
  I.saveScreenshotWithTimestamp('API_GET.png');
});