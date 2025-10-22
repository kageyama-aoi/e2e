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

  classMemberPageShimamura.clickSubMenuLink('候補生検索', '候補生検索');

  async function KouhoViewOperate() {
    I.waitForElement(locate('body').withText('候補生一覧'), 5);
    I.fillField('last_name', 'かげやま');
    I.click('検索');
    I.waitForElement('.listViewTdLinkS1',10);
    const student_name = await I.grabTextFrom('a.listViewTdLinkS1');
    I.say(`リンクラベル: ${student_name}`);
    I.click(locate('.listViewTdLinkS1'));
    return student_name;
  }
  
 
  async function ChangeFromKouhoToStudent(){
    const idnumber = await I.grabTextFrom('#td_idnumber');
    I.waitForElement(locate('body').withText('候補生詳細'), 5);
    I.say(`受講生情報: ${idnumber}_${student_name}`);
    I.click('受講生へ移動');
   
  }


  
  
  async function KeirisyoriStart(){
    I.waitForElement(locate('body').withText('受講生詳細'), 5);
    await SubmenuClick('submenu__detailviews_sub','閲覧/登録・経理ビュー');
    classMemberPageShimamura.clickSubMenuLink('受講生登録・経理ビュー（個人）', '受講生登録・経理ビュー（個人）');
    I.waitForElement(locate('body').withText('クラス追加/更新する'), 5);
    I.click('クラス追加/更新する')
  }

  async function KeirisyoriScreenB(){

    const S = {
      textbox:
      {
        keiyaku_date:'#contract_dateclass_operation',
        kaishi_date:'#start_dateclass_operation',
        class_name:'#course_name'
      }
      ,
      pulldown:
      {
        area:'#AN_1_area_id',
        tenpo:'#school_id',
        couse_category:'#course_category'
      },
      button:
      {
        class_select:'#course_popup_popup_button',
        class_apply:'#apply_class'
      }


    }
    I.waitForElement(S.button.class_select, 10);
    I.click(S.button.class_select);
    I.switchToNextTab();
    I.waitForElement(S.pulldown.area, 5);
    I.fillField(S.textbox.class_name, 'ピアノ水曜日_01_03');
    I.selectOption(S.pulldown.couse_category,'スクール')
    I.selectOption(S.pulldown.area,'すべて');
    I.selectOption(S.pulldown.tenpo,'すべて');
    const currentUrl01 = await I.grabCurrentUrl();
    I.say(`現在のURL01: ${currentUrl01}`);
    I.click('検索');
    I.waitForElement('.listViewTdLinkS1',10);
    // const class_name = await I.grabTextFrom('a.listViewTdLinkS1');
    I.click(locate('.listViewTdLinkS1'));
    
    // pause();
    I.switchToNextTab();
    const currentUrl02 = await I.grabCurrentUrl();
    I.say(`現在のURL02: ${currentUrl02}`);
    
    I.waitForElement(locate('body').withText('受講生詳細'), 5);
    I.click('クラス適用');
   
    // I.waitForEnabled(S.textbox.keiyaku_date, 15);
    I.seeElement(S.textbox.keiyaku_date, 5);
    I.fillField(S.textbox.keiyaku_date, '2025-10-01');
    I.fillField(S.textbox.kaishi_date, '2025-10-01');
    I.click('コース料金設定');

    I.wait(5); 
    I.click('売上計上する');

    I.wait(5); 
    
    I.click('確認完了（経理ビューへ）')


  // HM_ﾋﾟｱﾉ初級30分
  // コース料金設定

  //mid_month
  }

  async function TaikaiStart(){
    I.waitForElement(locate('body').withText('受講生詳細'), 5);
    await SubmenuClick('submenu__detailviews_sub','閲覧/登録・経理ビュー');
    classMemberPageShimamura.clickSubMenuLink('受講生詳細', '受講生登録・経理ビュー（個人）');
    
    I.waitForElement(locate('body').withText('退会処理'), 5);
    I.click('退会処理')
  }

  const student_name = await KouhoViewOperate();  
  await ChangeFromKouhoToStudent();
  await KeirisyoriStart();

  await KeirisyoriScreenB();
  await TaikaiStart();
  

  // 最終確認のスクリーンショット
  I.saveScreenshotWithTimestamp('CLASS_MEMBER_REGISTRATION_Success.png');

  I.say('--- テスト正常終了: クラス会員登録 ---');
}
);
