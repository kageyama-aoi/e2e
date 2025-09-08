Feature('トークンを利用したテスト');

// このFeature内のBeforeフックと全シナリオで共有される変数です。
let tcnToken;

// このBeforeフックは、このファイル内の各シナリオの実行前に自動的に実行されます。
// ログインとトークン取得を行い、テストの前提条件を整えます。
Before(async ({ I, loginPage, apiTestPage }) => {
  I.say('セットアップ: ログインとトークン取得を開始します。');

  // 1. 管理者としてログインします
  loginPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginPage.seeLogout();

  // 2. APIテストを実行し、トークンを取得してFeatureスコープの変数に保存します。
  tcnToken = await apiTestPage.performApiTestAndExtractToken(
    process.env.TEST_USER_TEACHER,
    process.env.TEST_PASSWORD_TEACHER,
    '講師'
  );

  I.say(`セットアップ: トークンの取得に成功しました: ${secret(tcnToken)}`);
});

Scenario('取得したトークンを後続の操作で利用する', async ({ I, personalInfoPage }) => {
  I.say('Step 1: 前提条件で取得したトークンが利用可能であることを確認します。');
  if (!tcnToken) {
    I.fail('Beforeフックでトークンが取得されませんでした。');
  }
  I.say(`取得したトークンを使用します: ${secret(tcnToken)}`);

  // Page Objectのメソッドを呼び出してページ遷移とAPI実行を行います
  personalInfoPage.navigateToPersonalInfo();
  personalInfoPage.fetchInfoWithToken(tcnToken);

  I.say('Step 2: レスポンスの内容を検証します。');
  const responseSelector = personalInfoPage.locators.responseArea;
  // レスポンスに期待されるテキストが含まれているか確認します (例: "lastNameFirstName")
  I.see('lastName', responseSelector);

  I.say('Step 3: レスポンスを整形してログに出力し、スクリーンショットを保存します。');
  const responseText = await I.grabTextFrom(responseSelector);

  try {
    // 取得したテキストをJSONオブジェクトに変換します
    const responseObject = JSON.parse(responseText);
    // JSONオブジェクトを見やすい形（インデント付き）の文字列に変換します
    const formattedResponse = JSON.stringify(responseObject, null, 2);
    console.log('--- 整形済みレスポンス ---');
    console.log(formattedResponse);
    console.log('--------------------------');
  } catch (e) {
    console.log('レスポンスのJSONパースに失敗しました。生のテキストを出力します:');
    console.log(responseText);
  }

  I.saveScreenshot('API_GET_TEACHER_INFO.png');
});
