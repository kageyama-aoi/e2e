Feature('しまむら クラス会員登録機能');

// Beforeフックを使い、各シナリオの前にログイン処理を共通化します。
Before(({ I, loginPageShimamura }) => {
  I.say('--- 前提処理開始: ログイン ---');
  const username = process.env.TESTGCP_SHIMAMURA_USER;
  const password = process.env.TESTGCP_SHIMAMURA_PASSWORD;
  const tantousyaNumber = process.env.TESTGCP_SHIMAMURA_TANTOUSYA;
  // ログインしてメインメニューへ
  loginPageShimamura.login(username, password);
  loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);
  I.say('--- 前提処理終了: ログイン ---');
});

// ログイン処理はBeforeフックで行われるため、ここでは classMemberPageShimamura のみインジェクトします。
Scenario('クラス会員の新規登録ができる', ({ I, classMemberPageShimamura }) => {
  // --- テスト本編: クラス会員登録 ---
  I.say('--- テスト開始: クラス会員登録 ---');

  // ステップ1: メインメニューからコース管理ページへ遷移します。
  // ページ遷移の具体的な操作は `classMemberPageShimamura` に集約されています。
  I.say('ステップ1: コース管理ページへ遷移します。');
  classMemberPageShimamura.navigateToAdminTab('コース', 'コース一覧');
  // TODO: 遷移後のヘッダーテキストが「クラス一覧」で正しいか確認してください
  classMemberPageShimamura.clickSubMenuLink('クラス一覧', 'クラス一覧');

  I.say('ステップ2: クラスを検索します。');
  const searchCriteria = {
    className: '合同発表会2027冬_kage',
    teacherStatus: '下記の項目のすべて',
    courseCategory: '発表会',
  };
  classMemberPageShimamura.searchClass(searchCriteria);

  I.say('ステップ3: 検索結果を確認し、新規登録へ進みます。');
  classMemberPageShimamura.selectClassFromSearchResult(searchCriteria.className);
  // TODO: クラス詳細画面で、特定の要素が表示されていることを確認する検証ステップを追加してください。

  // 最終確認のスクリーンショット
  I.saveScreenshotWithTimestamp('CLASS_MEMBER_REGISTRATION_Success.png');

  I.say('--- テスト正常終了: クラス会員登録 ---');
});
