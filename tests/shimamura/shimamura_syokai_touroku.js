// Feature('しまむら 受講生登録機能');
Feature('Dev sandbox (@dev)');

Before(async ({ login,loginPageShimamura }) => {
  const tantousyaNumber = process.env.TESTGCP_SHIMAMURA_TANTOUSYA;
  await login('user');
  await loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);

});

Scenario('新規会員登録 @dev', async ({ I, classMemberPageShimamura }) => {
  I.say('--- テスト開始: 経理処理 ---');

  async function ShouldBeOnStudentGroup(){
    await SubmenuClick('submenu__candidates_grp_sub','候補生');
    classMemberPageShimamura.clickSubMenuLink('候補生検索', '候補生検索');
    console.log("候補生検索ページURL: " + await I.grabCurrentUrl());
  }

  async function SubmenuClick(icon_element,menuname){
    const display = await I.grabCssPropertyFrom(`#${icon_element}`, 'display');
    if (display === 'none') {
      I.click(locate('span').withText(menuname));
      console.log(`✅ サブメニューグループ：${menuname}「＋」ボタンが表示中なのでリンクを押下`);
    } else {
    console.log(`⚠️ サブメニューグループ：${menuname}「-」ボタンなのでスキップ`);
    }
  }

  async function ShouldBeOnKouhoseiList(last_name='かげやま') {
    const S ={
      screen:
      {
        name:'候補生一覧'
      },
      button:
      {
        name:''
      },
      kekka:
      {
        element:'.listViewTdLinkS1'
      }
    }
    I.waitForElement(locate('body').withText(S.screen.name), 5);
    I.fillField('last_name', last_name);
    I.click('検索');
    I.waitForElement(S.kekka.element,10);
    console.log(S.screen.name + `/fURL:`+await I.grabCurrentUrl());
    
    const student_name = await I.grabTextFrom('a.listViewTdLinkS1');
    I.click(locate(S.kekka.element));
    console.log(`link_: ${student_name}`);
    return student_name;
  }
  
 
  async function ShouldBeOnKouhouseiDetail(){
    const S ={
      screen:
      {
        name:'候補生詳細'
      },
      button:
      {
        name:'受講生へ移動'
      }
    }
    I.waitForElement(locate('body').withText(S.screen.name), 5);
    console.log(S.screen.name+ `/URL:`+ await I.grabCurrentUrl());

    const idnumber = await I.grabTextFrom('#td_idnumber');
    console.log(`受講生情報: ${idnumber}_${student_name}`);

    I.click(S.button.name);
   
  }


  async function ShouldBeOnKeirisyoriScreenA(){
      const S = {
      submenu:
      {
        element_name:'submenu__detailviews_sub'
      },
      button:{
        label:'クラス追加/更新する'
      },
      screen:
      {
        name:'受講生詳細'
      }

    }

    I.waitForElement(locate('body').withText(S.screen.name), 5);
    await SubmenuClick(S.submenu.element_name,'閲覧/登録・経理ビュー');
    classMemberPageShimamura.clickSubMenuLink('受講生登録・経理ビュー（個人）', '受講生登録・経理ビュー（個人）');
    console.log(S.screen.name + `/URL:`+await I.grabCurrentUrl());
    I.waitForElement(locate('body').withText(S.button.label), 5);
    I.click(S.button.label)
  }

  async function ShouldBeOnKeirisyoriScreenB(){

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
        label_class_set:'クラス適用',
        label_course_set:'コース料金設定',
        label_tran_set:'売上計上する',
        label_keiri_finish:'確認完了（経理ビューへ）'
      },
      screen:
      {
        name:'受講生詳細'
      },
      screenE:
      {
        url_segment:'DWConfirmCarteKeiri_AN'
      }
    }


    I.click(S.button.class_select);
    await ShouldBoOnClassSelectPopup(class_name01='ピアノ水曜日_01_03',S);
    
    I.switchToNextTab();
    I.waitForElement(locate('body').withText(S.screen.name), 5);
    I.click(S.button.label_class_set);
   
    (function setKensakuKoumoku() {
      keiyaku_date='2025-10-01',kaishi_date='2025-10-01'
      I.waitForEnabled(S.textbox.keiyaku_date, 15);
      I.fillField(S.textbox.keiyaku_date, keiyaku_date);
      I.fillField(S.textbox.kaishi_date, kaishi_date);
    })();  

    I.click(S.button.label_course_set);

    I.wait(5); 
    console.log(`経理ビューB_クラス選択POP_UP閉じたあと/URL:`+await I.grabCurrentUrl());
    I.click(S.button.label_tran_set);

    // console.log(`経理ビューE/URL:`+await I.grabCurrentUrl());
    // await verifyNavigationByUrlChange(5, S.screenE.url_segment, S.button.label_keiri_finish);

    // console.log(`経理ビューA/URL:`+await I.grabCurrentUrl());

    async function ShouldBoOnClassSelectPopup(class_name01,S){
      const SS = {
        display:
        {
          name:'クラス選択POP_UP'
        }
    }
      await I.wait(3);
      
      I.switchToNextTab();

      (function setKensakuKoumoku() {
        I.waitForElement(S.pulldown.area, 5);
        I.fillField(S.textbox.class_name, class_name01);
        I.selectOption(S.pulldown.couse_category,'スクール')
        I.selectOption(S.pulldown.area,'すべて');
        I.selectOption(S.pulldown.tenpo,'すべて');
      })(); 


      console.log(SS.display.name+`/URL:`+await I.grabCurrentUrl());      
      I.click('検索');

      I.waitForElement('.listViewTdLinkS1',10);
      I.click(locate('.listViewTdLinkS1'));

    }

  }


  // E
  async function ShouldBeOnKeirisyoriScreenE(){
    console.log(`経理ビューE/URL:`+await I.grabCurrentUrl());
    await verifyNavigationByUrlChange(5, S.screenE.url_segment, S.button.label_keiri_finish);
    console.log(`経理ビューA/URL:`+await I.grabCurrentUrl());
  }


  async function ShouldBeOnTaikai(){
    I.waitForElement(locate('body').withText('受講生詳細'), 5);
    await SubmenuClick('submenu__detailviews_sub','閲覧/登録・経理ビュー');
    classMemberPageShimamura.clickSubMenuLink('受講生詳細', '個人情報１');   
    I.click('退会処理')
    console.log(`退会処理/URL:`+await I.grabCurrentUrl());
    // pause();
  }

  async function verifyNavigationByUrlChange(maxTries, targetValue, clickElement) {
  
    for (let i = 0; i < maxTries; i++) {
      const currentUrl = await I.grabCurrentUrl();

      if (currentUrl.includes(targetValue)) {
        console.log(`✅ URLに '${targetValue}' を検出（${i + 1}回目）`);
        I.click(clickElement); 
        break; 
      } else {
          console.log(`⏳ 該当なし（${i + 1}回目）... 1秒待機`);
        I.wait(1);
      }

      if (i === maxTries - 1) {
        throw new Error(`❌ URLに '${targetValue}' が含まれませんでした（${maxTries}回試行）`);
      }
    }
 
  }

  await classMemberPageShimamura.navigateToAdminTab('受講生', '受講生登録');

  await ShouldBeOnStudentGroup();
  const student_name = await ShouldBeOnKouhoseiList();  
  await ShouldBeOnKouhouseiDetail();
  await ShouldBeOnKeirisyoriScreenA();
  await ShouldBeOnKeirisyoriScreenB();
  await ShouldBeOnKeirisyoriScreenE();
  await ShouldBeOnTaikai();
  
  

  // 最終確認のスクリーンショット
  I.saveScreenshotWithTimestamp('CLASS_MEMBER_REGISTRATION_Success.png');

  I.say('--- テスト正常終了: 退会画面へ遷移 ---');
  }

);
