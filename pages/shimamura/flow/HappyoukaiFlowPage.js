'use strict';

/**
 * @fileoverview shimamura 発表会（クラス会員登録）フロー Page Object #186
 *
 * 概念: docs/shimamura/concepts/発表会の概念.md
 *
 * **前提知識（実機確認済み）**
 * - 名簿リスト（ProspectLists）から発表会クラスへ「クラスに追加」すると、
 *   対象受講生に event_contacts（ステータス21:不参加）が作成される。
 *   導線: 受講生検索 → 検索結果を名簿リストにする → 名簿詳細「クラス選択」
 *   （別タブポップアップ。エリア・店舗が既定値で絞り込まれているため必ず「すべて」に
 *   リセットしてからクラス名で検索する）→「クラスに追加」
 *   （コースカテゴリーが3:発表会/7:短期レッスン以外だとアラートで弾かれる）
 * - 「クラスに追加」実行後、対象受講生はクラス詳細の受講生タブ →
 *   コース選択プルダウン → 「発表会選択」ボタンの先（LWClassMembershipReg_AN画面）に
 *   チェックなし（不参加）の状態で並ぶ。ここでチェックを入れ「参加者更新」を押すと
 *   参加（コース参加列が✓・開始日・コース料金が表示）になる。
 * - クラス・コースは既存の CourseClassSetupFlowPage.setupLinkedCourseAndClass を
 *   courseCategory:'発表会' で流用できる（course_category値=3で確認済み）。
 * - 「参加者更新」で参加費(sms_fee)を作成する際、対象月（開催月）の口座振替スケジュールが
 *   未登録だと「対象月の口座振替スケジュールが設定されていないため、料金が作成できません。」
 *   というエラーになり参加処理自体が失敗する（月謝一括作成#169と同根の仕様）。
 *   ensureAccountTransferSchedules で事前に確保する必要がある。
 */

const fs   = require('fs');
const path = require('path');

const { logScreenUrl } = require('../../../support/utils');
const { fillTextFieldsByName, assertNoShimamuraError } = require('../../../support/shimamura/utils');
const { TIMEOUTS, SELECTORS } = require('../../../support/shimamura/constants');
const { navigateToKouhosei } = require('./GessyaIkkatuFlowPage');
const { setupLinkedCourseAndClass } = require('./CourseClassSetupFlowPage');
const { ensureAccountTransferSchedules } = require('../../../support/shimamura/accountTransferSchedule');

const BASE_URL = (process.env.BASE_URL || '').replace(/\/?$/, '/');

// setupテストと本体テスト間でクラス・受講生の情報を受け渡すファイル
const SESSION_FILE = path.resolve(__dirname, '../../../output/happyoukai_session.json');

const RESULT_LINK = `a${SELECTORS.RESULT_LINK}`;

const S = {
  studentEdit: {
    lastName:    '#last_name',
    firstName:   '#first_name',
    description: 'textarea[name="description"]',
    saveButton:  'input[name="save_button"]',
    editButton:  'input[name="edit_button"]',
  },
  studentSearch: {
    lastName:      '#last_name',
    searchButton:  'input[name="search"]',
    listNameField: '#prospect_list_savename',
    saveListButton: 'input[name="save_prospect_list"]',
  },
  prospectList: {
    classSelectButton: 'input[name="btn1"]',
    addToClassButton:  'input[name="AddToClass"][value="クラスに追加"]',
  },
  classSelectPopup: {
    area:         '#AN_1_area_id',
    school:       '#school_id',
    className:    '#course_name',
    searchButton: '検索',
  },
  classList: {
    name:           { name: 'name' },
    courseCategory: { name: 'course_category' },
    // 講師ステイタス。既定値が「稼働」のため、講師未割当の新規クラスが検索結果から
    // 除外されてしまう（実機確認済み）。「すべて」相当の空文字にリセットする。
    teacherStatus:  { name: 'contact_status' },
    searchButton:   '検索',
  },
  classDetail: {
    studentTab:          '#tab_link_student_tab',
    coursePulldown:      '#cs_course_seletion_pulldown',
    happyoukaiSelectBtn: '発表会選択',
  },
  participantList: {
    updateButton: 'input[name="update_button"]',
  },
};

function extractRecordId(url) {
  const match = url.match(/[?&]record=([^&]+)/);
  return match ? match[1] : null;
}

function buildTestName(row) {
  const now  = new Date();
  const mmdd = String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
  const hhmm = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  return {
    lastName:    `発表会テスト${mmdd}`,
    firstName:   `${row.testNo}${row.scenario.replace(/_/g, '')}`,
    description: `テスト実行 ${mmdd}_${hhmm} | ${row.scenario}`,
  };
}

function loadSession() {
  try { return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')); } catch { return { classRecordId: null, className: null, courseName: null, students: [] }; }
}

function saveSession(session) {
  fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });
  fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
}

function resetSession() {
  saveSession({ classRecordId: null, className: null, courseName: null, students: [] });
}

/**
 * 発表会カテゴリのクラス・コースを新規作成し、セッションファイルに記録する。
 * @param {object} I
 * @param {{courseCd: string, courseName: string, className?: string, kingaku: number|string,
 *   areaValue: string, schoolValue: string, weekdaySelector: string,
 *   startH: string, startM: string, endH: string, endM: string, monthsUntilEnd?: number}} params
 */
async function createHappyoukaiClassAndCourse(I, params) {
  I.say(`【発表会クラス作成】${params.className || params.courseName}`);
  const { courseRecordId, classRecordId } = await setupLinkedCourseAndClass(I, {
    ...params,
    courseCategory: '発表会',
  });

  const session = loadSession();
  session.classRecordId = classRecordId;
  session.className     = params.className || params.courseName;
  session.courseName    = params.courseName;
  saveSession(session);

  I.say(`  ✓ 発表会クラス record=${classRecordId} / コース record=${courseRecordId}`);
  return { courseRecordId, classRecordId };
}

/**
 * 候補生を検索して受講生へ昇格させ、共通の姓（buildTestName）に書き換える。
 * 会員番号（idnumber）をセッションファイルに保存し、後続の名簿化・参加確認で使う。
 * @param {object} I
 * @param {object} classMemberPageShimamura
 * @param {{lastName: string, testNo: string, scenario: string}} row CSVの1行
 */
async function promoteAndRenameStudent(I, classMemberPageShimamura, row) {
  await navigateToKouhosei(I, classMemberPageShimamura, row.lastName);

  I.say('【受講生登録】受講生詳細 → 編集');
  I.click(S.studentEdit.editButton);
  I.waitForElement(S.studentEdit.lastName, TIMEOUTS.SCREEN);
  await logScreenUrl(I, '受講生編集');

  const testName = buildTestName(row);
  I.say(`【名前書き換え】${testName.lastName} / ${testName.firstName}`);
  fillTextFieldsByName(I, { last_name: testName.lastName, first_name: testName.firstName });
  I.fillField(S.studentEdit.description, testName.description);

  I.click(S.studentEdit.saveButton);
  I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);
  await assertNoShimamuraError(I, '【受講生登録】保存');
  await logScreenUrl(I, '受講生詳細（保存後）');

  const currentUrl = await I.grabCurrentUrl();
  const recordId = extractRecordId(currentUrl);
  const idnumber = (await I.grabTextFrom('#td_idnumber')).trim();

  const session = loadSession();
  session.students.push({ recordId, idnumber, lastName: testName.lastName, firstName: testName.firstName, scenario: row.scenario });
  saveSession(session);

  I.say(`  ✓ 受講生登録完了 会員番号=${idnumber} record=${recordId}`);
  return { recordId, idnumber, testName };
}

/**
 * 受講生一覧を共通の姓で検索し、検索結果を名簿リストにする。
 * @param {object} I
 * @param {object} classMemberPageShimamura
 * @param {{lastName: string, listName: string}} params
 * @returns {Promise<string>} 作成された名簿リスト（ProspectLists）の record ID
 */
async function createRosterFromStudents(I, classMemberPageShimamura, { lastName, listName }) {
  I.say(`【受講生検索】姓 "${lastName}" で検索 → 名簿リスト化`);
  await classMemberPageShimamura.navigateToAdminTab(I, '受講生', '受講生一覧');
  I.fillField(S.studentSearch.lastName, lastName);
  I.click(S.studentSearch.searchButton);
  I.waitForElement(RESULT_LINK, TIMEOUTS.RESULT);
  await logScreenUrl(I, '受講生一覧（検索結果）');

  I.fillField(S.studentSearch.listNameField, listName);
  I.click(S.studentSearch.saveListButton);
  I.wait(TIMEOUTS.TAB_SWITCH);

  // 保存後は受講生一覧に留まる仕様のため、ページ内リンクから新規名簿のrecord IDを拾う
  const html = await I.grabHTMLFrom('body');
  const match = html.match(/module=ProspectLists&amp;record=([a-f0-9-]+)/) || html.match(/module=ProspectLists&record=([a-f0-9-]+)/);
  if (!match) throw new Error('【名簿リスト化】作成した名簿リストのrecord IDが取得できませんでした');

  const listRecordId = match[1];
  I.say(`  ✓ 名簿リスト作成完了 record=${listRecordId}`);
  return listRecordId;
}

/**
 * 名簿リスト詳細画面で対象クラスを選択し、「クラスに追加」を実行する。
 * これにより名簿内の全受講生に event_contacts（21:不参加）が作成される。
 * @param {object} I
 * @param {{prospectListRecordId: string, className: string}} params
 */
async function addRosterToClass(I, { prospectListRecordId, className }) {
  I.say(`【名簿→クラス追加】名簿(${prospectListRecordId}) を「${className}」へ`);
  I.amOnPage(`${BASE_URL}index.php?action=DetailView&module=ProspectLists&record=${prospectListRecordId}`);
  I.waitForElement(S.prospectList.classSelectButton, TIMEOUTS.SCREEN);
  await logScreenUrl(I, '名簿リスト詳細');

  I.click(S.prospectList.classSelectButton);
  I.retry({ retries: 5, minTimeout: 200 }).switchToNextTab();
  I.waitForElement(S.classSelectPopup.className, TIMEOUTS.SCREEN);

  // エリア・店舗が既定値で絞り込まれているため「すべて」にリセットしてから検索する
  I.selectOption(S.classSelectPopup.area, 'all');
  I.wait(TIMEOUTS.TAB_SWITCH); // school_id がAJAXで再構築される
  I.selectOption(S.classSelectPopup.school, 'all');
  I.fillField(S.classSelectPopup.className, className);
  I.click(S.classSelectPopup.searchButton);
  I.waitForElement(locate(SELECTORS.RESULT_LINK).withText(className), TIMEOUTS.RESULT);
  I.click(locate(SELECTORS.RESULT_LINK).withText(className));
  I.switchToNextTab();
  I.wait(TIMEOUTS.TAB_SWITCH);

  I.waitForElement(S.prospectList.addToClassButton, TIMEOUTS.SCREEN);
  I.click(S.prospectList.addToClassButton);
  I.wait(TIMEOUTS.TAB_SWITCH);
  await logScreenUrl(I, 'クラスに追加後');
  I.say('  ✓ クラスに追加完了（event_contacts 21:不参加 で作成）');
}

/**
 * 発表会クラスの開催月（今日からmonthsFromNowヶ月後）を対象に、口座振替スケジュールを
 * 確保する。参加者更新（参加費作成）が失敗しないための前提条件。
 * @param {object} I
 * @param {{monthsFromNow: number}} params
 */
async function ensureHappyoukaiAccountTransferSchedule(I, { monthsFromNow }) {
  const target = new Date();
  target.setMonth(target.getMonth() + monthsFromNow);
  const claimMonth = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`;
  await ensureAccountTransferSchedules(I, {
    claimMonth,
    debitDate:   `${claimMonth}-11`,
    depositDate: `${claimMonth}-15`,
  });
}

/**
 * クラス一覧（発表会カテゴリ）からクラスを検索し、受講生タブ → コース選択 →
 * 「発表会選択」ボタンを経由して参加者一覧画面（LWClassMembershipReg_AN）へ遷移する。
 * @param {object} I
 * @param {object} classMemberPageShimamura
 * @param {{className: string, courseName: string}} params
 */
async function navigateToParticipantList(I, classMemberPageShimamura, { className, courseName }) {
  I.say(`【参加者一覧へ】クラス「${className}」→ コース「${courseName}」`);
  await classMemberPageShimamura.navigateToAdminTab(I, 'コース', 'コース一覧');
  classMemberPageShimamura.clickSubMenuLink('クラス一覧', 'クラス一覧');

  I.fillField(S.classList.name, className);
  I.selectOption(S.classList.courseCategory, '発表会');
  I.selectOption(S.classList.teacherStatus, ''); // 既定「稼働」だと講師未割当クラスが除外されるためリセット
  I.click(S.classList.searchButton);
  I.wait(TIMEOUTS.TAB_SWITCH); // 検索結果はAJAXで差し替わるため、確定するまで待ってから要素を探す
  I.waitForElement(locate(SELECTORS.RESULT_LINK).withText(className), TIMEOUTS.RESULT);

  // クリック連打はAJAX直後のDOM再描画と競合し遷移が不安定になるため、
  // href属性を取得して直接遷移する（navigateToKouhoseiと同じ堅牢パターン）
  const href = await I.grabAttributeFrom(locate(SELECTORS.RESULT_LINK).withText(className), 'href');
  const detailUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
  I.amOnPage(detailUrl);
  I.waitForElement(S.classDetail.studentTab, TIMEOUTS.SCREEN);
  await logScreenUrl(I, 'クラス詳細');

  I.click(S.classDetail.studentTab);
  I.waitForElement(S.classDetail.coursePulldown, TIMEOUTS.SCREEN);
  I.selectOption(S.classDetail.coursePulldown, courseName);
  I.wait(TIMEOUTS.TAB_SWITCH);
  I.click(S.classDetail.happyoukaiSelectBtn);
  I.waitForElement(S.participantList.updateButton, TIMEOUTS.SCREEN);
  await logScreenUrl(I, '発表会参加者一覧');
}

/**
 * 参加者一覧で、指定した会員番号の行のチェックボックスをON/OFFする。
 * チェックボックスの value は event_contacts の内部IDのため、会員番号を含む行を
 * XPathで特定してから操作する。
 * @param {object} I
 * @param {{idnumber: string, checked: boolean}} params
 */
function setParticipantChecked(I, { idnumber, checked }) {
  // 画面全体の //tr だとナビゲーション等の無関係な行と衝突しうるため、
  // 参加者一覧テーブル(class="listView")配下に限定する
  const checkboxXPath = `//table[contains(@class,"listView")]//tr[td[contains(., "${idnumber}")]]//input[@name="mass_AN[]"]`;
  I.waitForElement(checkboxXPath, TIMEOUTS.SCREEN);
  if (checked) {
    I.checkOption(checkboxXPath);
  } else {
    I.uncheckOption(checkboxXPath);
  }
}

/**
 * 参加者一覧の「参加者更新」ボタンを押す。
 * @param {object} I
 */
function submitParticipantUpdate(I) {
  I.say('【参加者更新】');
  // 参加費作成の検証（締切超過等）でボタン押下後に非同期でconfirm/alertが出ることがある。
  // CodeceptJSはポップアップの既定アクション（accept/cancel）が未設定だと内部エラーになり
  // ダイアログが解決されずページがブロックされたままになる（実機確認済み）。
  // amAcceptingPopups() でダイアログ発生前に既定アクションを設定しておく。
  I.amAcceptingPopups();
  I.click(S.participantList.updateButton);
  // 参加費(sms_fee)・スケジュール紐づけをサーバー側で作成するため TAB_SWITCH(2秒) では
  // 不足することを実機確認済み（複数名同時更新で顕著）。RESULT相当まで待つ。
  I.wait(TIMEOUTS.RESULT);
}

/**
 * 参加者一覧上で、指定した会員番号の「コース参加」列が期待通りか検証する。
 * @param {object} I
 * @param {{idnumber: string, expectedParticipating: boolean}} params
 */
async function verifyParticipation(I, { idnumber, expectedParticipating }) {
  // grabTextFrom+文字列比較は参加者更新直後に稀に "not found" になることを実機確認済み
  // （データ自体は正しく更新されている）。I.see/I.dontSee ベースの方が安定するためこちらを使う。
  const rowXPath = `//table[contains(@class,"listView")]//tr[td[contains(., "${idnumber}")]]`;
  I.waitForElement(rowXPath, TIMEOUTS.SCREEN);
  if (expectedParticipating) {
    I.see('✓', rowXPath);
  } else {
    I.dontSee('✓', rowXPath);
  }
  I.say(`  ✓ 会員番号=${idnumber} ${expectedParticipating ? '参加' : '不参加'}（期待通り）`);
}

module.exports = {
  SESSION_FILE,
  resetSession,
  loadSession,
  createHappyoukaiClassAndCourse,
  promoteAndRenameStudent,
  createRosterFromStudents,
  addRosterToClass,
  ensureHappyoukaiAccountTransferSchedule,
  navigateToParticipantList,
  setParticipantChecked,
  submitParticipantUpdate,
  verifyParticipation,
};
