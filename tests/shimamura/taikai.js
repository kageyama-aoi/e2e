Feature('退会処理 (@dev)');

Before(async ({ login, loginPageShimamura }) => {
  const tantousyaNumber = process.env.TESTGCP_SHIMAMURA_TANTOUSYA;
  await login('user');
  await loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);

});


/**
 * トグルメニュー（個別コードではなく、共通化
 */

async function toggleGroupmenu(I, { icon_id, menuname }) {
  const display = await I.grabCssPropertyFrom(`#${icon_id}`, 'display');

  if (display === 'none') {
    I.click(locate('span').withText(menuname));
    I.say(`✅ サブメニューグループ：${menuname}「＋」ボタンが表示中なのでリンクを押下`);
  } else {
    I.say(`⚠️ サブメニューグループ：${menuname}「-」ボタンなのでスキップ`);
  }
}

/**
 * 受講生 一覧で検索して、詳細へ遷移するための名前を返す
 */
async function ShouldBeOnZyukouseiList(I, idnumber) {
  const S = {
    screen: { name: '受講生一覧' },
    field: { idnumber: '#idnumber' },
    button: { search: '検索' },
    result: { list: '.listViewTdLinkS1', link: 'a.listViewTdLinkS1' }
  }
  await I.waitForElement(locate('body').withText(S.screen.name), 5);
  await I.waitForElement(S.field.idnumber, 10);
  await I.fillField(S.field.idnumber, idnumber);
  await I.click(S.button.search);
  await I.waitForElement(S.result.list, 10);

  await I.say(S.screen.name + `/---URL:` + await I.grabCurrentUrl());

  const student_name = await I.grabTextFrom(S.result.link);
  await I.click(locate(S.result.list));
  await I.say(`★link_: ${student_name}`);

  return student_name;
}

/**
 * 退会処理
 */





async function ShouldBeOnTaikai(I, classMemberPageShimamura) {

   // 退会処理画面用 定数まとめ
const TAIKAI = {
  screen: {
    detailTitle: '受講生詳細',
  },
  submenu: {
    iconId: 'submenu__detailviews_sub',
    menuName: '閲覧/登録・経理ビュー',
  },
  accordion: {
    paymentGroup: 'div[onclick*="payment_det_group"]',
    kojin1: 'div[onclick*="kojin_1"]',
  },
  submenuLink: {
    mainTitle: '受講生詳細',
    subTitle: '個人情報１',
  },
  buttons: {
    taikai: '退会処理',
    update: '更新',
  },
  fields: {
    finalYear: '#final_enrollment_year',
    finalMonth: '#final_enrollment_month',
  },
  checkboxes: {
    firstMassAn: '(//input[@type="checkbox" and @name="mass_AN[]"])[1]',
  },
  values: {
    finalYear: '2025',
    finalMonth: '12',
  },
};
  // 受講生詳細 画面にいることを確認
  I.waitForElement(locate('body').withText(TAIKAI.screen.detailTitle), 5);

  // サブメニューグループ「閲覧/登録・経理ビュー」を開く
  await toggleGroupmenu(I, {
    icon_id: TAIKAI.submenu.iconId,
    menuname: TAIKAI.submenu.menuName,
  });

  // アコーディオンの閉じるリンクをクリック
  I.click(TAIKAI.accordion.paymentGroup);
  I.click(TAIKAI.accordion.kojin1);

  // 受講生詳細へ移動（個人情報1タブ）
  classMemberPageShimamura.clickSubMenuLink(
    TAIKAI.submenuLink.mainTitle,
    TAIKAI.submenuLink.subTitle
  );

  // デバッグ用: 必要なときだけ生かす
  // pause();

  // 退会画面へ遷移
  I.click(TAIKAI.buttons.taikai);
  I.say(`退会処理/URL:` + await I.grabCurrentUrl());

  // 退会画面入力
  I.fillField(TAIKAI.fields.finalYear, TAIKAI.values.finalYear);
  I.fillField(TAIKAI.fields.finalMonth, TAIKAI.values.finalMonth);

  // チェックボックス（mass_AN[] の1番目）をON
  I.click(TAIKAI.checkboxes.firstMassAn);

  // 退会処理の実行
  I.click(TAIKAI.buttons.update);
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


Scenario('会員退会 @dev', async ({ I, classMemberPageShimamura }) => {
  I.say('--- テスト開始: 対象受講生 ---');

  const input =
  {
    p1: '',
    p2: ''
  }

  await classMemberPageShimamura.navigateToAdminTab(I,'受講生', '受講生検索');


  const idnumber = '29TK202510042';
  await ShouldBeOnZyukouseiList(I, idnumber) ;

  // await ShouldBeOnStudentGroup(I, classMemberPageShimamura);
  // const student_name = await ShouldBeOnKouhoseiList(I, last_name = 'かげやま');

  await ShouldBeOnTaikai(I, classMemberPageShimamura);
  pause();

  // 最終確認のスクリーンショット
  I.saveScreenshotWithTimestamp('CLASS_MEMBER_REGISTRATION_Success.png');

  I.say('--- テスト正常終了: 退会画面へ遷移 ---');
}

);
