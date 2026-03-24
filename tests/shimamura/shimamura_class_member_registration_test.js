/**
 * @fileoverview しまむら：クラス受講生登録のE2Eテスト
 *
 * **処理フロー**
 * - 1. 担当者アカウントでログイン（autoLogin）
 * - 2. 管理 > コース > コース一覧 へ遷移
 * - 3. クラス一覧へ移動し検索条件を入力
 * - 4. クラス詳細の受講生タブで受講生登録操作へ進む
 *
 * **前提条件**
 * - 環境変数 `SHIMAMURA_USER`, `SHIMAMURA_PASSWORD`, `SHIMAMURA_TANTOUSYA` が設定されていること
 * - 実行時に `--profile` を指定する場合は `env/.env.<profile>` が存在すること
 *
 * **最終更新日**
 * - 2026-01-27
 */
const { validateShimamuraEnv } = require('../../support/shimamura/utils');

Feature('Dev sandbox (@dev)');

/**
 * テスト実行前のセットアップ
 * 各シナリオの前にログイン処理と担当者番号入力を共通で行う
 * @param {object} args - CodeceptJSのDI引数
 * @param {CodeceptJS.I} args.I - Iオブジェクト
 * @param {object} args.loginPageShimamura - ログインページオブジェクト
 */
Before(async ({ login, loginPageShimamura }) => {
  const tantousyaNumber = validateShimamuraEnv();
  await login('user');
  await loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);
});

const S = {
  search: {
    fields: {
      name: 'name',
      display: 'display_hyouji',
      status: 'contact_status',
      area: 'area_id',
      school: 'school_id',
      courseCategory: 'course_category',
    },
    options: {
      display: 'すべて',
      status: '下記の項目のすべて',
      area: 'すべて',
      school: 'すべて',
      courseCategory: '発表会',
    },
    buttons: {
      search: '検索',
    },
    results: {
      row: '.listViewTdLinkS1',
      link: 'a.listViewTdLinkS1',
      linkIndex: 2,
    },
  },
  tabs: {
    studentTabLink: '#tab_link_student_tab',
    studentTabActive: '#tab_li_student_tab.active',
  },
  selection: {
    coursePulldown: '#cs_course_seletion_pulldown',
    selectButton: '発表会選択',
  },
};

/**
 * クラス一覧画面にて検索条件を入力し、結果のリンクをクリックして詳細へ移動する
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @returns {Promise<string>} 選択したコース名
 */
async function selectClassFromList(I) {
  I.fillField(S.search.fields.name, '鈴木');
  I.selectOption(S.search.fields.display, S.search.options.display);
  I.selectOption(S.search.fields.status, S.search.options.status);
  I.selectOption(S.search.fields.area, S.search.options.area);
  I.selectOption(S.search.fields.school, S.search.options.school);
  I.selectOption(S.search.fields.courseCategory, S.search.options.courseCategory);
  I.click(S.search.buttons.search);
  I.say(`Search Result Page\nURL: ${await I.grabCurrentUrl()}`);
  I.waitForElement(S.search.results.row, 10);
  const courseName = await I.grabTextFrom(S.search.results.link);
  I.say(`リンクラベル: ${courseName}`);
  I.click(locate(S.search.results.row).at(S.search.results.linkIndex));
  I.say(`Course Detail Page\nURL: ${await I.grabCurrentUrl()}`);
  return courseName;
}

/**
 * クラス詳細画面でのタブ操作とコース選択を行う
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {string} courseName - 選択したコース名
 */
async function openStudentTabAndSelectCourse(I, courseName) {
  I.waitForElement(S.tabs.studentTabLink, 10);
  I.click(S.tabs.studentTabLink);
  I.say(`Student Tab Page\nURL: ${await I.grabCurrentUrl()}`);
  I.seeElement(S.tabs.studentTabActive);
  I.selectOption(S.selection.coursePulldown, courseName);
  I.click(S.selection.selectButton);
  I.say(`Presentation Selection Page\nURL: ${await I.grabCurrentUrl()}`);
}

/**
 * クラス受講生登録のテストシナリオ
 */
Scenario('クラス受講生の新規登録ができる @dev', async ({ I, classMemberPageShimamura }) => {
  I.say('--- テスト開始: クラス受講生登録 ---');

  // メインメニューからコース管理ページへ遷移。
  await classMemberPageShimamura.navigateToAdminTab(I, 'コース', 'コース一覧');
  I.say(`Course List Page\nURL: ${await I.grabCurrentUrl()}`);

  // コースTabの中のクラス一覧画面に遷移
  classMemberPageShimamura.clickSubMenuLink('クラス一覧', 'クラス一覧');
  I.say(`Class List Page\nURL: ${await I.grabCurrentUrl()}`);

  const courseName = await selectClassFromList(I);
  await openStudentTabAndSelectCourse(I, courseName);

  // クラス受講生登録画面　操作
  pause(); // ←ここでインタラクティブシェルへ

  // 最終確認のスクリーンショット
  I.saveScreenshotWithTimestamp('CLASS_MEMBER_REGISTRATION_Success.png');

  I.say('--- テスト正常終了: クラス受講生登録 ---');
});
