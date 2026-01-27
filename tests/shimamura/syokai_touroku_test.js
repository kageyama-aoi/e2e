/**
 * @fileoverview しまむら：新規会員登録と経理処理のE2Eテスト
 *
 * データ駆動（Data Driven）でCSVからテストデータを読み込み実行します。
 *
 * **処理フロー**
 * - 1. 候補生検索
 * - 2. 候補生詳細から「受講生へ移動」
 * - 3. 受講生登録・経理ビュー（個人）へ遷移
 * - 4. クラス追加/更新、クラス選択、経理日付入力、売上計上
 * - 5. 確認完了後、退会処理画面へ遷移
 *
 * **データソース**
 * - `syokai_touroku_data.csv`（または `--profile` に応じたファイル）
 *
 * **前提条件**
 * - 環境変数 `SHIMAMURA_TANTOUSYA` が設定されていること
 * - 実行時に `--profile` を指定する場合は `env/.env.<profile>` が存在すること
 *
 * **最終更新日**
 * - 2026-01-27
 */
const fs = require('fs');
const path = require('path');
const { readCsv, getProfileFromArgs } = require('../../support/utils');
const { toggleGroupmenu, verifyNavigationByUrlChange } = require('../../support/shimamura/utils');

const profile = getProfileFromArgs();
// CSVパス
const defaultCsvPath = path.join(__dirname, '../../data/shimamura', 'syokai_touroku_data.csv');
const profileCsvPath = profile ? path.join(__dirname, '../../data/shimamura', `syokai_touroku_data_${profile}.csv`) : null;

let csvData = [];
if (profileCsvPath && fs.existsSync(profileCsvPath)) {
  csvData = readCsv(profileCsvPath);
} else {
  csvData = readCsv(defaultCsvPath);
}

Feature('Dev sandbox (@dev)');

Before(async ({ login, loginPageShimamura }) => {
  const tantousyaNumber = process.env.SHIMAMURA_TANTOUSYA;
  if (!tantousyaNumber) {
    throw new Error('❌ SHIMAMURA_TANTOUSYA が環境変数（.envファイル）に設定されていません。プロファイルが正しく指定されているか確認してください。');
  }
  await login('user');
  await loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber.replace(/['"]/g, ''));

});

/**
 * 候補生検索ページへ遷移する
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} classMemberPageShimamura - ClassMember ページオブジェクト
 */
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
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {string} last_name - 検索する氏名
 * @returns {Promise<string>} 取得した候補生氏名
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
 * 候補生詳細画面の確認＆ログ出力を行い、受講生へ移動ボタンをクリックする
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {string} student_name - 候補生氏名
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
 * 経理処理画面A（受講生詳細からの遷移）を確認する
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} classMemberPageShimamura - ClassMember ページオブジェクト
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
 * クラス検索フォームに入力する
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} locators - 要素ロケーター
 * @param {string} className - クラス名
 * @param {Object} options - 選択オプション
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

/**
 * 経理日付（契約日・開始日）を入力する
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} locators - 要素ロケーター
 * @param {Object} dates - 日付データ
 */
async function fillAccountingDates(I, locators, dates) {
  I.waitForEnabled(locators.textbox.keiyaku_date, 15);
  I.fillField(locators.textbox.keiyaku_date, dates.keiyaku_date);
  I.fillField(locators.textbox.kaishi_date, dates.kaishi_date);
}

/**
 * 経理処理画面B（クラス選択〜売上計上）の操作を行う
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} input - 入力データ
 * @param {string} input.class_name01 - クラス名
 * @param {string} input.keiyaku_date - 契約日
 * @param {string} input.kaishi_date - 開始日
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
 * クラス選択ポップアップで検索してクラスを選択する
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} parentLocators - 親画面のロケーター
 * @param {string} class_name01 - クラス名
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
 * 経理処理画面Eを確認し、経理ビューへ戻る
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} classMemberPageShimamura - ClassMember ページオブジェクト
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
 * 退会処理画面へ遷移して最終在籍年月を入力する
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} classMemberPageShimamura - ClassMember ページオブジェクト
 * @param {Object} options - 退会情報
 * @param {string} options.taikaiYear - 最終在籍年
 * @param {string} options.taikaiMonth - 最終在籍月
 */
async function ShouldBeOnTaikai(I, classMemberPageShimamura, { taikaiYear, taikaiMonth }) {
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
  
  I.fillField('#final_enrollment_year', taikaiYear);
  I.fillField('#final_enrollment_month', taikaiMonth);
  // I.fillField(locators.textbox.class_name, className);
  
  // final_enrollment_year
  // final_enrollment_month
  // ToggleCheckBoxesWithName(&quot;mass_AN[]&quot;, this);
  // <td class="oddListRowS1" bgcolor="#fdfdfd" valign="top"><input class="checkbox" type="checkbox" value="7a06973b-fc53-7000-5482-691433cfe2bb" name="mass_AN[]"></td>
  // pause();
}


/**
 * テストシナリオ
 */


Data(csvData).Scenario('新規会員登録 @dev', async ({ I, classMemberPageShimamura, current }) => {
  I.say('--- テスト開始: 経理処理 ---');

  const input =
  {
    class_name01: current.className,
    keiyaku_date: current.keiyakuDate,
    kaishi_date: current.kaishiDate
  }


  await classMemberPageShimamura.navigateToAdminTab(I,'受講生', '受講生登録');
  await ShouldBeOnStudentGroup(I, classMemberPageShimamura);
  const student_name = await ShouldBeOnKouhoseiList(I, last_name = current.lastName);
  await ShouldBeOnKouhouseiDetail(I, student_name);
  await ShouldBeOnKeirisyoriScreenA(I, classMemberPageShimamura);
  await ShouldBeOnKeirisyoriScreenB(I, input);

  await ShouldBeOnKeirisyoriScreenE(I, classMemberPageShimamura);
  await ShouldBeOnTaikai(I, classMemberPageShimamura, { taikaiYear: current.taikaiYear, taikaiMonth: current.taikaiMonth });



  // 最終確認のスクリーンショット
  I.saveScreenshotWithTimestamp('CLASS_MEMBER_REGISTRATION_Success.png');

  I.say('--- テスト正常終了: 退会画面へ遷移 ---');
}

);
