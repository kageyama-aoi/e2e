// Feature('しまむら 受講生登録機能');
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
Scenario('新規会員登録 @dev', async ({ I, classMemberPageShimamura }) => {
  // --- テスト本編: クラス会員登録 ---
  I.say('--- テスト開始: 経理処理 ---');

  // メインメニューから受講生管理ページへ遷移。
  classMemberPageShimamura.navigateToAdminTab('受講生', '受講生登録');

  async function SubmenuClick(icon_element,menuname){
    const display = await I.grabCssPropertyFrom(`#${icon_element}`, 'display');
    if (display === 'none') {
      I.click(locate('span').withText(menuname));
      console.log(`✅ ${menuname}「＋」ボタンが表示中なのでリンクを押下`);
    } else {
    console.log(`⚠️ ${menuname}「-」ボタンなのでスキップ`);
    }
  }

  await SubmenuClick('submenu__candidates_grp_sub','候補生');

  // const display = await I.grabCssPropertyFrom('#submenu__candidates_grp_sub', 'display');
  // if (display === 'none') {
  //   I.click(locate('span').withText('候補生'));
  //   console.log('✅ 「＋」ボタンが表示中なのでリンクを押下');
  // } else {
  //   console.log('⚠️ 「-」ボタンなのでスキップ');
  // }
  classMemberPageShimamura.clickSubMenuLink('候補生検索', '候補生検索');

  async function KouhoViewOperate() {
    I.waitForElement(locate('body').withText('候補生一覧'), 10);
    I.fillField('last_name', 'かげやま');
    I.click('検索');
    I.waitForElement('.listViewTdLinkS1',10);
    const student_name = await I.grabTextFrom('a.listViewTdLinkS1');
    I.say(`リンクラベル: ${student_name}`);
    I.click(locate('.listViewTdLinkS1'));
    return student_name;
  }
  const student_name = await KouhoViewOperate();
 
  async function ChangeStudent(){
    const idnumber = await I.grabTextFrom('#td_idnumber');
    I.waitForElement(locate('body').withText('候補生詳細'), 10);
    I.say(`受講生情報: ${idnumber}_${student_name}`);
    I.click('受講生へ移動');
   
  }


  await ChangeStudent();
  
  async function KeirisyoriStart(){
    I.waitForElement(locate('body').withText('受講生詳細'), 10);
    await SubmenuClick('submenu__detailviews_sub','閲覧/登録・経理ビュー');
    classMemberPageShimamura.clickSubMenuLink('受講生登録・経理ビュー（個人）', '受講生登録・経理ビュー（個人）');
    I.waitForElement(locate('body').withText('クラス追加/更新する'), 10);
    I.click('クラス追加/更新する')
    }
  
  pause(); // ←ここでインタラクティブシェルへ


I.click('クラス選択')
I.switchToNextTab();
I.fillField('course_name', 'か');
I.click('検索');
I.selectOption('#course_category','スクール')
I.selectOption('AN_1_area_id','すべて');
I.selectOption('school_id','すべて');
I.switchToNextTab();
I.click('クラス選択')
I.click('クラス適用')
  
  //クラス画面　操作
  function ClassOperate(){
    I.waitForElement('#tab_link_student_tab', 10);
    I.click('#tab_link_student_tab');
    I.seeElement('#tab_li_student_tab.active');   
    I.selectOption('#cs_course_seletion_pulldown', course_name); 
    I.click('発表会選択')    
  }


  // 最終確認のスクリーンショット
  I.saveScreenshotWithTimestamp('CLASS_MEMBER_REGISTRATION_Success.png');

  I.say('--- テスト正常終了: クラス会員登録 ---');
});
