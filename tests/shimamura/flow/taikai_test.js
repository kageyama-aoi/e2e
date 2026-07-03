/**
 * @fileoverview しまむら：受講生退会処理のE2Eテスト
 *
 * CSVデータに基づいて複数の受講生に対する退会処理を自動実行します。
 *
 * **処理フロー**
 * - 1. 担当者アカウントでログイン（autoLogin）
 * - 2. `taikai_testdata.csv` を読み込み
 * - 3. 各レコードで受講生検索 → 退会処理画面 → 最終在籍年月を入力して更新
 *
 * **動的日付フィールド**
 * - `finalYear`/`finalMonth`（退会最終在籍年月）は退会処理側のルール「先月まで許容・先々月以前はNG」に
 *   対応するため、CSV記載値が範囲外の場合は `resolveDynamicDateIfPast`（graceMonths: 1）で
 *   本日日付に自動補正される（置換発生時は `I.say` でログに記録される）。
 *
 * **前提条件**
 * - 環境変数 `SHIMAMURA_TANTOUSYA` が設定されていること
 * - `data/shimamura/taikai_testdata.csv` が存在すること
 * - 実行時に `--profile` を指定する場合は `env/.env.<profile>` が存在すること
 *
 * **最終更新日**
 * - 2026-01-27
 */
const { loadCsvWithProfile } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { toggleGroupmenu, resolveDynamicDateIfPast } = require('../../../support/shimamura/utils');
const { TIMEOUTS } = require('../../../support/shimamura/constants');
const { fillTaikaiFormAndSubmit, resolveUnfinishedKeiriDataIfPresent } = require('../../../pages/shimamura/flow/SyokaiFlowPage');

Feature('退会処理 (@dev)');

Before(beforeShimamura);

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
  await I.waitForElement(locate('body').withText(S.screen.name), TIMEOUTS.SCREEN);
  await I.waitForElement(S.field.idnumber, TIMEOUTS.ELEMENT);
  await I.fillField(S.field.idnumber, idnumber);
  await I.click(S.button.search);
  await I.waitForElement(S.result.list, TIMEOUTS.RESULT);

  await I.say(`${S.screen.name}\nURL: ${await I.grabCurrentUrl()}`);

  const student_name = await I.grabTextFrom(S.result.link);
  await I.click(locate(S.result.list));
  await I.say(`★link_: ${student_name}`);

  return student_name;
}

const TAIKAI_NAV = {
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

/**
 * 受講生詳細画面から「個人情報１」タブへ移動する
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} classMemberPageShimamura - ClassMember ページオブジェクト
 */
async function navigateToKojin1Tab(I, classMemberPageShimamura) {
  // 受講生詳細 画面にいることを確認
  I.waitForElement(locate('body').withText(TAIKAI_NAV.screen.detailTitle), TIMEOUTS.SCREEN);

  // サブメニューグループ「閲覧/登録・経理ビュー」を開く
  await toggleGroupmenu(I, {
    icon_id: TAIKAI_NAV.submenu.iconId,
    menuname: TAIKAI_NAV.submenu.menuName,
  });

  // アコーディオンの閉じるリンクをクリック
  I.click(TAIKAI_NAV.accordion.paymentGroup);
  I.click(TAIKAI_NAV.accordion.kojin1);

  // 受講生詳細へ移動（個人情報1タブ）
  classMemberPageShimamura.clickSubMenuLink(
    TAIKAI_NAV.submenuLink.mainTitle,
    TAIKAI_NAV.submenuLink.subTitle
  );
}

/**
 * 受講生詳細画面から退会処理画面まで画面遷移
 * 「経理処理が完了してないデータがあります」警告が出ていると退会処理ボタンが
 * 表示されないため、警告を検知したら解消してから個人情報1タブへ遷移し直す
 * （解消操作自体が経理ビューAへ遷移してしまい個人情報1タブの状態が崩れるため）。
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} classMemberPageShimamura - ClassMember ページオブジェクト
 */
async function navigateToTaikaiScreen(I, classMemberPageShimamura) {
  await navigateToKojin1Tab(I, classMemberPageShimamura);

  const resolved = await resolveUnfinishedKeiriDataIfPresent(I);
  if (resolved) {
    await navigateToKojin1Tab(I, classMemberPageShimamura);
  }

  // 退会画面へ遷移
  I.click(TAIKAI_NAV.buttons.taikai);
  I.say(`退会処理\nURL: ${await I.grabCurrentUrl()}`);
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
  // （経理処理未完了データの警告解消は navigateToTaikaiScreen 内で行う）
  await ShouldBeOnZyukouseiList(I, idnumber);
  await navigateToTaikaiScreen(I, classMemberPageShimamura);

  // 退会入力 & 更新（フォーム操作は SyokaiFlowPage.js と共通化）
  // 退会処理は「先月まで許容・先々月以前はNG」のため graceMonths: 1 で補正
  const resolvedTaikaiDate = resolveDynamicDateIfPast(
    I,
    `${finalYear}-${String(finalMonth).padStart(2, '0')}-01`,
    'finalYear/finalMonth',
    { graceMonths: 1 }
  );
  const [resolvedYear, resolvedMonth] = resolvedTaikaiDate.split('-');
  await fillTaikaiFormAndSubmit(I, { taikaiYear: resolvedYear, taikaiMonth: resolvedMonth });

  // スクリーンショット（idnumber付きだと追いやすい）
  I.saveScreenshotWithTimestamp(`CLASS_MEMBER_TAIKAI_${idnumber}.png`);

  I.say(`--- テスト正常終了: 退会処理 idnumber=${idnumber} ---`);
}



Scenario('受講生退会 @dev', async ({ I, classMemberPageShimamura }) => {

  const testDataList = loadCsvWithProfile('taikai_testdata', 'shimamura');

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
