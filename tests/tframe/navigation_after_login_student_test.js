Feature('ログイン後の画面遷移');

Scenario('ログイン後にAPIを実行し受講生トークンを抽出する', async ({ I, loginKannrisyaPage, apiCommonLoginPage }) => {
  I.say('Step 1: 管理者としてログインし、ログイン後の状態を確認します');
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  I.say('Step 2: APIテストページでAPIを実行し、受講生アクセス用のトークンを抽出します');
  // apiTestPage のメソッドを呼び出し、必要なパラメータを渡します
  const tcnToken = await apiCommonLoginPage.performApiTestAndExtractToken(
    process.env.TEST_USER_STUDENT,
    process.env.TEST_PASSWORD_STUDENT,
    '受講生'
  );

  I.say('Step 3: 抽出したトークンが変数に保存されたことを確認します');
  // 抽出されたトークンは tcnToken 変数に格納されており、このシナリオ内で利用可能です。
  I.say(`保存されたトークン: ${secret(tcnToken)}`);

  I.say('Step 4: 実行結果のスクリーンショットを保存します');
  I.saveScreenshotWithTimestamp('API_GET.png');





});

// ./tests/tframe/navigation_after_login_student_test.js の末尾など
After(() => {
  if (process.env.KEEP_BROWSER_OPEN === '1') {
    pause();
  }
});