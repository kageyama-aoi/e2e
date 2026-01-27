/**
 * @fileoverview 会員退会処理のE2Eテストシナリオ
 * 
 * このファイルは、CSVデータに基づいて複数の受講生に対する退会処理を自動実行します。
 * 
 * **処理フロー**
 * - 1. 担当者アカウントでログイン (Beforeフック)
 * - 2. `taikai_testdata.csv` からテストデータを読み込み
 * - 3. 各レコードに対して以下の処理を繰り返し実行:
 *   - a. 受講生検索画面でID検索
 *   - b. 受講生詳細画面へ遷移
 *   - c. 「閲覧/登録・経理ビュー」>「個人情報1」>「退会処理」へ遷移
 *   - d. 最終在籍年月を入力して更新
 * 
 * **前提条件**
 * - 環境変数 `SHIMAMURA_TANTOUSYA` が設定されていること
 * - `data/shimamura/taikai_testdata.csv` が存在すること
 * 
 * **最終更新日**
 * - 2026-01-17
 */
Feature('退会処理 (@dev)');

Before(async ({ login, loginPageShimamura }) => {
  const tantousyaNumber = process.env.SHIMAMURA_TANTOUSYA;
  await login('user');
  await loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);

});


const path = require('path');
const { readCsv } = require('../../support/utils');
const { toggleGroupmenu, verifyNavigationByUrlChange } = require('../../support/shimamura/utils');

/**
 * CSVファイルから退会テストデータを読み込む
 * @param {string} csvFileName - 読み込むCSVファイル名
 * @returns {Array<Object>} パースされたテストデータの配列
 */
function loadTaikaiTestDataFromCsv(csvFileName) {
  const filePath = path.join(__dirname, '../../data/shimamura', csvFileName);
  return readCsv(filePath);
}

/**
 * 受講生一覧画面で検索を行い、詳細画面へ遷移する
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {string} idnumber - 受講生番号
 * @returns {Promise<string>} 取得した受講生氏名
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
 * 受講生詳細画面から退会処理画面まで画面遷移
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} classMemberPageShimamura - ClassMember ページオブジェクト
 */
async function navigateToTaikaiScreen(I, classMemberPageShimamura) {
  const S = {
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
    },
  };

  // 受講生詳細 画面にいることを確認
  I.waitForElement(locate('body').withText(S.screen.detailTitle), 5);

  // サブメニューグループ「閲覧/登録・経理ビュー」を開く
  await toggleGroupmenu(I, {
    icon_id: S.submenu.iconId,
    menuname: S.submenu.menuName,
  });

  // アコーディオンの閉じるリンクをクリック
  I.click(S.accordion.paymentGroup);
  I.click(S.accordion.kojin1);

  // 受講生詳細へ移動（個人情報1タブ）
  classMemberPageShimamura.clickSubMenuLink(
    S.submenuLink.mainTitle,
    S.submenuLink.subTitle
  );

  // 退会画面へ遷移
  I.click(S.buttons.taikai);
  I.say(`退会処理/URL:` + await I.grabCurrentUrl());
}

/**
 * 退会画面で必要事項を入力し、更新を行う
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {string} finalYear - 最終在籍年
 * @param {string} finalMonth - 最終在籍月
 */
async function ShouldBeOnTaikai(I, finalYear, finalMonth) {
  const S = {
    fields: {
      finalYear: '#final_enrollment_year',
      finalMonth: '#final_enrollment_month',
    },
    checkboxes: {
      firstMassAn: '(//input[@type="checkbox" and @name="mass_AN[]"])[1]',
    },
    buttons: {
      update: '更新',
    }
  };

  I.fillField(S.fields.finalYear, finalYear);
  I.fillField(S.fields.finalMonth, finalMonth);


  // チェックボックス（mass_AN[] の1番目）をON
  I.click(S.checkboxes.firstMassAn);

  // 退会処理の実行
  I.click(S.buttons.update);
}

/**
 * 一連の退会処理フローを実行する
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} classMemberPageShimamura - ClassMember ページオブジェクト
 * @param {Object} data - テストデータ
 * @param {string} data.idnumber - 受講生番号
 * @param {string} data.finalYear - 最終在籍年
 * @param {string} data.finalMonth - 最終在籍月
 */
async function runTaikaiFlow(I, classMemberPageShimamura, { idnumber, finalYear, finalMonth }) {
  I.say(`--- テスト開始: 対象受講生 ${idnumber} ---`);

  // 管理タブ -> 受講生検索へ
  await classMemberPageShimamura.navigateToAdminTab(I, '受講生', '受講生検索');

  // 受講生検索 → 詳細 → 退会画面へ
  await ShouldBeOnZyukouseiList(I, idnumber);
  await navigateToTaikaiScreen(I, classMemberPageShimamura);

  // 退会入力 & 更新
  await ShouldBeOnTaikai(I, finalYear, finalMonth);

  // スクリーンショット（idnumber付きだと追いやすい）
  I.saveScreenshotWithTimestamp(`CLASS_MEMBER_TAIKAI_${idnumber}.png`);

  I.say(`--- テスト正常終了: 退会処理 idnumber=${idnumber} ---`);
}



Scenario('会員退会 @dev', async ({ I, classMemberPageShimamura }) => {

  const testDataList = loadTaikaiTestDataFromCsv('taikai_testdata.csv');

  I.say(`CSVテストデータ件数: ${testDataList.length}件`);

  for (const data of testDataList) {
    const { idnumber, finalYear, finalMonth } = data;

    if (!idnumber) {
      I.say('⚠️ idnumber が空の行をスキップ');
      continue;
    }

    await runTaikaiFlow(I, classMemberPageShimamura, {
      idnumber,
      finalYear,
      finalMonth,
    });
  }

  I.say('=== 全テストデータ分の退会処理シナリオ完了 ===');
});
