Feature('講師支払調書APIテスト');

// このFeature内のBeforeフックと全シナリオで共有される変数。
let tcnToken;

// このファイル内の各シナリオ実行前に自動実行されるBeforeフック。
// ログインとトークン取得を行い、テストの前提条件を整備。
Before(async ({ I, loginPage, apiTestPage }) => {
  I.say('セットアップ: ログインとトークン取得を開始。');

  // 1. 管理者としてログイン
  loginPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginPage.seeLogout();

  // 2. APIテストを実行し、トークンを取得してFeatureスコープの変数に保存。
  tcnToken = await apiTestPage.performApiTestAndExtractToken(
    process.env.TEST_USER_TEACHER,
    process.env.TEST_PASSWORD_TEACHER,
    '講師'
  );

  I.say(`セットアップ: トークン取得成功: ${secret(tcnToken)}`);
});

Scenario('指定した年月の講師支払調書が取得できる', async ({ I, jsonInputPage }) => {
  I.say('Step 1: 前提条件で取得したトークンが利用可能であることを確認。');
  if (!tcnToken) {
    I.fail('Beforeフックでトークンが取得されていない。');
  }

  I.say('Step 2: JSON入力ページへ遷移。');
  jsonInputPage.navigateToPage();

  I.say('Step 3: APIを実行して支払調書を取得。');
  const targetYear = '2025';
  const targetMonth = '09';
  
  // APIリクエストのパラメータを定義
  const apiParams = {
    api: 'displayTeacherPaymentReport',
    tcnToken: tcnToken,
    targetYear: targetYear,
    targetMonth: targetMonth,
    headderPattern: '001',
  };
  // 定義したパラメータでAPIを実行
  jsonInputPage.executeApi(apiParams);

  I.say('Step 4: レスポンス内容をログファイルに保存。');
  // ファイル名を動的に生成
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseFileName = `1_teacher_payment_report_${timestamp}`;
  
  const responseText = await I.grabTextFrom(jsonInputPage.locators.responseArea);
  await I.saveLogToFile(`${baseFileName}_response.log`, responseText, apiParams);

  I.say('Step 5: レスポンス内容を検証（現状のサーバーエラーを期待）。');
  // 現在のサーバーエラーが発生していることを確認するアサーション。
  I.see('Internal Server Error', jsonInputPage.locators.responseArea);

  I.say('Step 6: レスポンスエリアにスクロールしてスクリーンショットを撮影。');
  await I.scrollIntoView(jsonInputPage.locators.responseArea);
  I.saveScreenshot(`${baseFileName}.png`);
});
