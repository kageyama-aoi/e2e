Feature('トークンを利用したテスト');

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

Scenario('取得したトークンを後続の操作で利用する', async ({ I, personalInfoPage }) => {
  I.say('Step 1: 前提条件で取得したトークンが利用可能であることを確認。');
  if (!tcnToken) {
    I.fail('Beforeフックでトークンが取得されていない。');
  }
  I.say(`取得したトークンを使用: ${secret(tcnToken)}`);

  // Page Objectのメソッドを呼び出してページ遷移とAPI実行
  personalInfoPage.navigateToPersonalInfo();
  personalInfoPage.fetchInfoWithToken(tcnToken);

  I.say('Step 2: レスポンス内容を検証。');
  const responseSelector = personalInfoPage.locators.responseArea;
  // レスポンスに期待されるテキストが含まれているか確認 (例: "lastNameFirstName")
  I.see('lastName', responseSelector);

  I.say('Step 3: レスポンスを整形してログに出力し、スクリーンショットを保存。');
  const responseText = await I.grabTextFrom(responseSelector);

  try {
    // 取得したテキストをJSONオブジェクトに変換
    const responseObject = JSON.parse(responseText);
    // JSONオブジェクトを見やすい形（インデント付き）の文字列に変換
    const formattedResponse = JSON.stringify(responseObject, null, 2);
    console.log('--- 整形済みレスポンス ---');
    console.log(formattedResponse);
    console.log('--------------------------');
  } catch (e) {
    console.log('レスポンスのJSONパースに失敗。生のテキストを出力:');
    console.log(responseText);
  }

  I.saveScreenshotWithTimestamp('API_GET_TEACHER_INFO.png');
});
