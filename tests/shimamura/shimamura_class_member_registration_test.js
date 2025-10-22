// Feature('しまむら クラス会員登録機能');
Feature('Dev sandbox (@dev)');

// Beforeフックを使い、各シナリオの前にログイン処理を共通化します。
Before(({ I, loginPageShimamura }) => {
  const username = process.env.TESTGCP_SHIMAMURA_USER;
  const password = process.env.TESTGCP_SHIMAMURA_PASSWORD;
  const tantousyaNumber = process.env.TESTGCP_SHIMAMURA_TANTOUSYA;
  loginPageShimamura.login(username, password);
  loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);
});

// ログイン処理はBeforeフックで行われるため、ここでは classMemberPageShimamura のみインジェクトします。
Scenario('クラス会員の新規登録ができる @dev', async ({ I, classMemberPageShimamura }) => {
  // --- テスト本編: クラス会員登録 ---
  I.say('--- テスト開始: クラス会員登録 ---');

  // メインメニューからコース管理ページへ遷移。
  classMemberPageShimamura.navigateToAdminTab('コース', 'コース一覧');

  // コースTabの中のクラス一覧画面に遷移
  classMemberPageShimamura.clickSubMenuLink('クラス一覧', 'クラス一覧');
  
   // クラス一覧画面にて、1番上に表示されたクラスリンクを押下
  async function ClassViewOperate() {
    I.fillField('name', '鈴木');
    I.selectOption('display_hyouji','すべて');
    I.selectOption('contact_status','下記の項目のすべて');
    I.selectOption('area_id','すべて');
    I.selectOption('school_id','すべて');
    I.selectOption('course_category','発表会');
    I.click('検索');
    I.waitForElement('.listViewTdLinkS1',10);
    const course_name = await I.grabTextFrom('a.listViewTdLinkS1');
    I.say(`リンクラベル: ${course_name}`);
    I.click(locate('.listViewTdLinkS1').at(2));
    return course_name;
  }

  const course_name = await ClassViewOperate();
  
  //クラス画面　操作
  function ClassOperate(){
    I.waitForElement('#tab_link_student_tab', 10);
    I.click('#tab_link_student_tab');
    I.seeElement('#tab_li_student_tab.active');   
    I.selectOption('#cs_course_seletion_pulldown', course_name); 
    I.click('発表会選択')    
  }

  await ClassOperate();

  //クラス会員登録画面　操作
  pause(); // ←ここでインタラクティブシェルへ



  // 最終確認のスクリーンショット
  I.saveScreenshotWithTimestamp('CLASS_MEMBER_REGISTRATION_Success.png');

  I.say('--- テスト正常終了: クラス会員登録 ---');
});
