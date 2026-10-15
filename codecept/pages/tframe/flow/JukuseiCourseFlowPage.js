'use strict';

/**
 * @fileoverview tframe 業務フロー Page Object — 受講生登録 → コース紐付け
 *
 * 受講生詳細画面（student/dw/_default）の「コース」タブにある「コース選択」ボタンから開く
 * コース紐付けポップアップ（course/sw/stCourseAdder サブパネル）を操作し、
 * 受講生とコースを紐付けるところまでの一連の流れを提供する。
 *
 * shimamura の `pages/shimamura/flow/*FlowPage.js` と同じ役割（複数画面をまたぐ業務フローを
 * ロケーター＋ヘルパー関数で集約する Page Object）を持つが、tframe の既存規約
 * （TIMEOUTS定数・submitTframeFormAndVerify・tf-radio クリック等）に合わせて実装している。
 *
 * 紐付けUIの実在確認は Playwright での実機操作（コース新規登録→受講生新規登録→
 * コース選択ポップアップでの検索・選択・追加）により行った。存在しない画面の
 * でっち上げセレクタは含まない。
 *
 * 使い方は `tests/tframe/flow/jukusei_course_link_flow_test.js` を参照。
 */

const { TIMEOUTS } = require('../../../support/tframe/constants');

/** コース紐付けポップアップ（courseAdderPopup）まわりのロケーター */
const COURSE_LINK_LOCATORS = {
  tab:  { course: '#course_a' },
  pane: { course: '#course' },
  popup: {
    name:         '[id="courseSubpanel[courseAdderPopup][name]"]',
    schoolBranch: '[id="courseSubpanel[courseAdderPopup][school_branch_id]"]',
    searchButton: '[id="courseSubpanel[courseAdderPopup][swSearchButton]"]',
    submitButton: '[id="courseSubpanel[courseAdderPopup][submitAddRecordsButton]"]',
  },
};

/**
 * コースを新規登録する（既存 CoursePage に委譲）
 * @param {object} I - CodeceptJS の I
 * @param {object} coursePage - injected coursePage
 * @param {object} courseData - course_touroku_data.csv と同形式（name は呼び出し前に一意な値へ加工しておくこと）
 */
async function registerCourse(I, coursePage, courseData) {
  I.say('【受講生コース紐付けフロー】コース新規登録');
  coursePage.navigateToRegisterPage();
  coursePage.fillRegistrationForm(courseData);
  await coursePage.submitAndVerifyRegistration(courseData.name);
}

/**
 * 受講生を新規登録する（既存 JukuseiPage に委譲。ID番号重複時は自動リトライ）
 * @param {object} I
 * @param {object} jukuseiPage - injected jukuseiPage
 * @param {object} jukuseiData - jukusei_touroku_data.csv と同形式
 * @returns {Promise<string>} 実際に登録できた idnumber（重複時は採番し直した値）
 */
async function registerJukusei(I, jukuseiPage, jukuseiData) {
  I.say('【受講生コース紐付けフロー】受講生新規登録');
  jukuseiPage.navigateToRegisterPage();
  jukuseiPage.fillRegistrationForm(jukuseiData);
  return jukuseiPage.submitAndVerifyWithIdRetry(jukuseiData.lastName, jukuseiData.idnumber);
}

/**
 * 受講生詳細画面の「コース」タブへ切り替える
 * （受講生登録直後は student/dw/_default の詳細画面に遷移済みであることが前提）
 * @param {object} I
 */
function openCourseTab(I) {
  I.say('【受講生コース紐付けフロー】受講生詳細の「コース」タブへ切替');
  I.waitForElement(COURSE_LINK_LOCATORS.tab.course, TIMEOUTS.ELEMENT);
  I.click(COURSE_LINK_LOCATORS.tab.course);
}

/**
 * 「コース」タブの「コース選択」ボタンを押してコース紐付けポップアップを開く
 * @param {object} I
 */
function openCourseSelectPopup(I) {
  I.say('【受講生コース紐付けフロー】コース選択ポップアップを開く');
  const openButton = locate('button').withText('コース選択');
  I.waitForElement(openButton, TIMEOUTS.ELEMENT);
  I.click(openButton);
}

/**
 * ポップアップ内でコース名検索を行う
 *
 * 校舎の絞り込みはユーザーごとに前回検索した値が残るため、明示的に「すべて」（空値）へ
 * 変更してから検索する（実機確認時、既定値が「東京」のままだと対象コースがヒットしなかった）。
 *
 * @param {object} I
 * @param {string} courseName - 検索するコース名（一意な名前を渡すこと）
 */
function searchCourseInPopup(I, courseName) {
  const { popup } = COURSE_LINK_LOCATORS;
  I.say(`【受講生コース紐付けフロー】ポップアップでコース名検索: ${courseName}`);
  I.waitForElement(popup.name, TIMEOUTS.ELEMENT);
  I.fillField(popup.name, courseName);
  I.selectOption(popup.schoolBranch, ''); // 校舎=すべて（前回検索値が残っているとヒットしないため）
  I.click(popup.searchButton);
  I.waitForElement('.tf-radio.tf-radio-primary', TIMEOUTS.ELEMENT);
}

/**
 * 検索結果1件目を選択し「追加」で確定する
 *
 * tframe のカスタムラジオボタンは input 自体が非表示のため、
 * ラップしている span.tf-radio をクリックする（既存の popup picker と同じ作法）。
 *
 * @param {object} I
 */
function selectFirstCourseResultAndSubmit(I) {
  const { popup } = COURSE_LINK_LOCATORS;
  I.say('【受講生コース紐付けフロー】検索結果1件目を選択して追加');
  I.click(locate('.tf-radio.tf-radio-primary').first());
  I.click(popup.submitButton);
}

/**
 * 受講生詳細の「コース」タブ操作をまとめて実行する（タブ切替→ポップアップ→検索→選択→追加）
 * @param {object} I
 * @param {string} courseName - 紐付けるコース名
 */
async function linkCourseToJukusei(I, courseName) {
  openCourseTab(I);
  openCourseSelectPopup(I);
  searchCourseInPopup(I, courseName);
  selectFirstCourseResultAndSubmit(I);
}

/**
 * 受講生の「コース」タブ一覧に指定コース名が表示されることを確認する
 * @param {object} I
 * @param {string} courseName
 */
function verifyCourseLinked(I, courseName) {
  I.say(`【受講生コース紐付けフロー】コース一覧に "${courseName}" が表示されることを確認`);
  I.waitForText(courseName, TIMEOUTS.ELEMENT, COURSE_LINK_LOCATORS.pane.course);
}

/**
 * 「コース新規登録 → 受講生新規登録 → コース紐付け → 紐付け結果確認」を一括実行する
 * @param {object} I
 * @param {object} jukuseiPage
 * @param {object} coursePage
 * @param {{courseData: object, jukuseiData: object}} data - courseData.name は事前に一意な値へ加工しておくこと
 * @returns {Promise<string>} 実際に登録できた受講生の idnumber
 */
async function runJukuseiCourseLinkFlow(I, jukuseiPage, coursePage, { courseData, jukuseiData }) {
  await registerCourse(I, coursePage, courseData);
  const usedIdnumber = await registerJukusei(I, jukuseiPage, jukuseiData);
  await linkCourseToJukusei(I, courseData.name);
  verifyCourseLinked(I, courseData.name);
  return usedIdnumber;
}

module.exports = {
  COURSE_LINK_LOCATORS,
  registerCourse,
  registerJukusei,
  openCourseTab,
  openCourseSelectPopup,
  searchCourseInPopup,
  selectFirstCourseResultAndSubmit,
  linkCourseToJukusei,
  verifyCourseLinked,
  runJukuseiCourseLinkFlow,
};
