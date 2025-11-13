// Feature('しまむら 受講生登録機能');
Feature('Dev sandbox (@dev)');

Before(async ({ login, loginPageShimamura }) => {
  const tantousyaNumber = process.env.TESTGCP_SHIMAMURA_TANTOUSYA;
  await login('user');
  await loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);

});

async function toggleGroupmenu(I, { icon_id, menuname }) {
  const display = await I.grabCssPropertyFrom(`#${icon_id}`, 'display');

  if (display === 'none') {
    I.click(locate('span').withText(menuname));
    I.say(`✅ サブメニューグループ：${menuname}「＋」ボタンが表示中なのでリンクを押下`);
  } else {
    I.say(`⚠️ サブメニューグループ：${menuname}「-」ボタンなのでスキップ`);
  }
}

async function ShouldBeOnStudentGroup(I, classMemberPageShimamura) {
  await toggleGroupmenu(I, {
    icon_id: 'submenu__candidates_grp_sub',
    menuname: '候補生'
  });
  classMemberPageShimamura.clickSubMenuLink('候補生検索', '候補生検索');
  I.say("候補生検索ページURL: " + await I.grabCurrentUrl());
}


/**
 * 候補生一覧で検索して、詳細へ遷移するための名前を返す
 */
async function ShouldBeOnKouhoseiList(I, last_name) {
  const S = {
    screen: { name: '候補生一覧' },
    field: { lastName: 'last_name' },
    button: { search: '検索' },
    result: { list: '.listViewTdLinkS1', link: 'a.listViewTdLinkS1' }
  }
  I.waitForElement(locate('body').withText(S.screen.name), 5);
  I.fillField(S.field.lastName, last_name);
  I.click(S.button.search);
  I.waitForElement(S.result.list, 10);

  I.say(S.screen.name + `/URL:` + await I.grabCurrentUrl());

  const student_name = await I.grabTextFrom(S.result.link);
  I.click(locate(S.result.list));
  I.say(`link_: ${student_name}`);

  return student_name;
}

/**
 * 候補生詳細画面の確認＆ログ出力
 */

async function ShouldBeOnKouhouseiDetail(I, student_name) {
  const S = {
    screen: { name: '候補生詳細' },
    button: { name: '受講生へ移動' },
    element: { idNumber: '#td_idnumber' }
  }

  I.waitForElement(locate('body').withText(S.screen.name), 5);
  I.say(S.screen.name + `/URL:` + await I.grabCurrentUrl());

  const idnumber = await I.grabTextFrom(S.element.idNumber);
  I.say(`受講生情報: ${idnumber}_${student_name}`);

  I.click(S.button.name);

}

/**
 * 経理処理画面A
 */

async function ShouldBeOnKeirisyoriScreenA(I, classMemberPageShimamura) {
  const S = {
    screen: { name: '受講生詳細' },
    submenu: {
      icon_id: 'submenu__detailviews_sub',
      groupName: '閲覧/登録・経理ビュー',
      linkName: '受講生登録・経理ビュー（個人）'
    },
    button: { addUpdateClass: 'クラス追加/更新する' }
  }

  I.waitForElement(locate('body').withText(S.screen.name), 5);

  await toggleGroupmenu(I, {
    icon_id: S.submenu.icon_id,
    menuname: S.submenu.groupName
  });

  classMemberPageShimamura.clickSubMenuLink(S.submenu.linkName, S.submenu.linkName);
  I.say(S.screen.name + `/URL:` + await I.grabCurrentUrl());
  I.waitForElement(locate('body').withText(S.button.addUpdateClass), 5);
  I.click(S.button.addUpdateClass)
}

/**
 * 経理処理画面B
 */
async function fillClassSearchForm(I, locators, className, options) {
  I.wait(2);
  I.switchToNextTab()
  I.waitForElement(locators.pulldown.area, 5);
  I.fillField(locators.textbox.class_name, className);
  I.selectOption(locators.pulldown.couse_category, options.couse_category)
  I.selectOption(locators.pulldown.area, options.area);
  I.selectOption(locators.pulldown.tenpo, options.tenpo);
}

async function fillAccountingDates(I, locators, dates) {
  I.waitForEnabled(locators.textbox.keiyaku_date, 15);
  I.fillField(locators.textbox.keiyaku_date, dates.keiyaku_date);
  I.fillField(locators.textbox.kaishi_date, dates.kaishi_date);
}

/**
 * 経理処理画面B
 */
async function ShouldBeOnKeirisyoriScreenB(I, { class_name01, keiyaku_date, kaishi_date }) {

  const S = {
    textbox: { keiyaku_date: '#contract_dateclass_operation', kaishi_date: '#start_dateclass_operation', class_name: '#course_name' },
    pulldown: { area: '#AN_1_area_id', tenpo: '#school_id', couse_category: '#course_category' },
    button: { class_select: '#course_popup_popup_button', label_class_set: 'クラス適用', label_course_set: 'コース料金設定', label_tran_set: '売上計上する' },
    screen: { name: '受講生詳細' }
  }


  I.click(S.button.class_select);
  await ShouldBoOnClassSelectPopup(I, S, class_name01);

  I.switchToNextTab();
  I.waitForElement(locate('body').withText(S.screen.name), 5);
  I.click(S.button.label_class_set);

  await fillAccountingDates(I, S, { keiyaku_date, kaishi_date });

  I.click(S.button.label_course_set);

  I.say(`経理ビューB_クラス選択POP_UP閉じたあと/URL:` + await I.grabCurrentUrl());
  I.retry({ retries: 2, minTimeout: 500 }).click(S.button.label_tran_set);


}

/**
 * クラス選択ポップアップ
*/
async function ShouldBoOnClassSelectPopup(I, parentLocators, class_name01) {
  const SS = {
    display: { name: 'クラス選択POP_UP' },
    button: { search: '検索' },
    result: { link: '.listViewTdLinkS1' },
    options: { couse_category: 'スクール', area: 'すべて', tenpo: 'すべて' }
  }

  // I.switchToNextTab();
  await fillClassSearchForm(I, parentLocators, class_name01, SS.options);

  I.say(SS.display.name + `/URL:` + await I.grabCurrentUrl());
  I.click(SS.button.search);

  I.waitForElement(SS.result.link, 10);
  I.click(locate(SS.result.link));
}


/**
 * 経理処理画面E
 */
async function ShouldBeOnKeirisyoriScreenE(I, classMemberPageShimamura) {
  const S = {
    screen: { url_segment: 'DWConfirmCarteKeiri_AN' },
    button: { label_keiri_finish: '確認完了（経理ビューへ）' },

  }
  I.say(`経理ビューE/URL:` + await I.grabCurrentUrl());
  await verifyNavigationByUrlChange(I, 5, S.screen.url_segment, S.button.label_keiri_finish);
  I.say(`経理ビューA/URL:` + await I.grabCurrentUrl());
}


/**
 * 退会処理
 */

async function ShouldBeOnTaikai(I, classMemberPageShimamura) {
  //   const S = {
  //   display: { name: 'クラス選択POP_UP' },
  //   button: { search: '検索' },
  //   result: { link: '.listViewTdLinkS1' },
  //   options: { couse_category: 'スクール', area: 'すべて', tenpo: 'すべて' }
  // }
  I.waitForElement(locate('body').withText('受講生詳細'), 5);
  await toggleGroupmenu(I, {
    icon_id: 'submenu__detailviews_sub',
    menuname: '閲覧/登録・経理ビュー'
  });
  classMemberPageShimamura.clickSubMenuLink('受講生詳細', '個人情報１');
  I.click('退会処理')
  I.say(`退会処理/URL:` + await I.grabCurrentUrl());
  
  I.fillField('#final_enrollment_year', '2026');
  I.fillField('#final_enrollment_month', '02');
  // I.fillField(locators.textbox.class_name, className);
  
  // final_enrollment_year
  // final_enrollment_month
  // ToggleCheckBoxesWithName(&quot;mass_AN[]&quot;, this);
  // <td class="oddListRowS1" bgcolor="#fdfdfd" valign="top"><input class="checkbox" type="checkbox" value="7a06973b-fc53-7000-5482-691433cfe2bb" name="mass_AN[]"></td>
  // pause();
}

async function verifyNavigationByUrlChange(I, maxTries, targetValue, clickElement) {

  for (let i = 0; i < maxTries; i++) {
    const currentUrl = await I.grabCurrentUrl();

    if (currentUrl.includes(targetValue)) {
      I.say(`✅ URLに '${targetValue}' を検出（${i + 1}回目）`);
      I.click(clickElement);
      break;
    } else {
      I.say(`⏳ 該当なし（${i + 1}回目）... 1秒待機`);
      I.wait(1);
    }

    if (i === maxTries - 1) {
      throw new Error(`❌ URLに '${targetValue}' が含まれませんでした（${maxTries}回試行）`);
    }
  }

}


/**
 * テストシナリオ
 */


Scenario('新規会員登録 @dev', async ({ I, classMemberPageShimamura }) => {
  I.say('--- テスト開始: 経理処理 ---');

  const input =
  {
    class_name01: 'ピアノ水曜日_01_03',
    keiyaku_date: '2025-11-04',
    kaishi_date: '2025-11-05'
  }

  await classMemberPageShimamura.navigateToAdminTab(I,'受講生', '受講生登録');
  await ShouldBeOnStudentGroup(I, classMemberPageShimamura);
  const student_name = await ShouldBeOnKouhoseiList(I, last_name = 'かげやま');
  await ShouldBeOnKouhouseiDetail(I, student_name);
  await ShouldBeOnKeirisyoriScreenA(I, classMemberPageShimamura);
  await ShouldBeOnKeirisyoriScreenB(I, input);

  await ShouldBeOnKeirisyoriScreenE(I, classMemberPageShimamura);
  await ShouldBeOnTaikai(I, classMemberPageShimamura);



  // 最終確認のスクリーンショット
  I.saveScreenshotWithTimestamp('CLASS_MEMBER_REGISTRATION_Success.png');

  I.say('--- テスト正常終了: 退会画面へ遷移 ---');
}

);
