'use strict';

/**
 * @fileoverview shimamura コース(ShimaCourse)・クラス(Course)を新規作成し、
 * 両者を紐づけて実際に登録可能な状態（スケジュール設定済み）にするための汎用 Page Object。
 *
 * 月謝一括作成の運営管理費テスト（#167）のため、既存クラスの内部コース構成に
 * 依存せず、運営管理費(course_kanrihi)を確実にコントロールしたいケースで使う。
 *
 * **前提として判明している仕様**
 * - コース(ShimaCourse)は運営管理費・月謝などの料金マスタで、店舗を持たない。
 * - クラス(Course)は店舗・曜日・時間を持つスケジュール実体で、コースとは別モジュール。
 * - クラスの「コース」タブから「コース選択」ポップアップでコースを検索・適用すると、
 *   クラス⇔コースが紐づく（複数コースを1クラスに紐づけることも可能）。
 * - クラスは「スケジュール」タブの「全体スケジュールの作成・変更」で実スケジュールを
 *   作成しないと、経理ビューでの登録時に「クラスにスケジュールが設定されていません」
 *   エラーとなり売上計上できない。
 * - 経理カルテビューの金額表示は税込（マスタの運営管理費は税抜）。
 */

const { logScreenUrl } = require('../../../support/utils');
const { TIMEOUTS, SELECTORS } = require('../../../support/shimamura/constants');

const BASE_URL = (process.env.BASE_URL || '').replace(/\/?$/, '/');

const S = {
  course: {
    cd:       '#course_cd',
    name:     '#course_name',
    category: '#course_category',
    kanrihi:  '#course_kanrihi',
    save:     'input[name="save_button"]',
  },
  class: {
    name:     '#name',
    area:     '#area_id',
    school:   '#school_id',
    category: '#course_category',
    teiin:    '#teiin',
    startH:   '#kaishi_jikan_H',
    startM:   '#kaishi_jikan_M',
    endH:     '#syuryou_jikan_H',
    endM:     '#syuryou_jikan_M',
    save:     'input[name="save_button"]',
  },
  courseTab: {
    tabLink:        '#tab_link_course_tab',
    selectPopupBtn: '#course_selection_popup_popup_button',
    applyButton:    'input[name="apply_course"]',
  },
  scheduleTab: {
    tabLink:      '#tab_link_schedule_tab',
    bulkCreate:   'input[value*="全体スケジュール"]',
    endYear:      '#event_end_year',
    endMonth:     '#event_end_month',
    endDay:       '#event_end_day',
    saveButton:   'input[name="new_save_button"]',
  },
};

function extractRecordId(url) {
  const match = url.match(/[?&]record=([^&]+)/);
  return match ? match[1] : null;
}

/**
 * コース(ShimaCourse)を新規作成する。
 * @param {object} I
 * @param {{courseCd: string, courseName: string, courseCategory?: string, kanrihi: number|string}} params
 *   courseCategory は選択肢の表示テキスト（既定値: 'スクール'）
 * @returns {Promise<string>} 作成したコースの record ID
 */
async function createShimaCourse(I, { courseCd, courseName, courseCategory = 'スクール', kanrihi }) {
  I.say(`【コース作成】${courseName}（${courseCd}） / 運営管理費(税抜): ${kanrihi}`);
  I.amOnPage(`${BASE_URL}index.php?module=ShimaCourse&action=EditView&return_module=ShimaCourse&return_action=DetailView`);
  I.waitForElement(S.course.cd, TIMEOUTS.SCREEN);
  I.fillField(S.course.cd, courseCd);
  I.fillField(S.course.name, courseName);
  I.selectOption(S.course.category, courseCategory);
  I.fillField(S.course.kanrihi, String(kanrihi));
  I.click(S.course.save);
  I.waitForElement(locate('body').withText(courseName), TIMEOUTS.SCREEN);
  await logScreenUrl(I, 'コース作成完了');

  const url = await I.grabCurrentUrl();
  const recordId = extractRecordId(url);
  if (!recordId) throw new Error(`【コース作成】record ID を取得できませんでした（url: ${url}）`);
  I.say(`  ✓ コース作成完了 record=${recordId}`);
  return recordId;
}

/**
 * クラス(Course)を新規作成する。
 * @param {object} I
 * @param {{
 *   name: string, areaValue: string, schoolValue: string, courseCategory?: string,
 *   weekdaySelector: string, startH: string, startM: string, endH: string, endM: string,
 *   teiin?: string
 * }} params
 *   areaValue/schoolValue は `#area_id`/`#school_id` の option value（school_id は area 選択後の
 *   AJAX 更新後にのみ有効な値になる）。weekdaySelector は例 `#youbi_8`（水曜日）。
 * @returns {Promise<string>} 作成したクラスの record ID
 */
async function createClass(I, {
  name, areaValue, schoolValue, courseCategory = 'スクール',
  weekdaySelector, startH, startM, endH, endM, teiin = '10',
}) {
  I.say(`【クラス作成】${name}`);
  I.amOnPage(`${BASE_URL}index.php?module=Course&action=EditView&return_module=Course&return_action=DetailView`);
  I.waitForElement(S.class.area, TIMEOUTS.SCREEN);
  I.fillField(S.class.name, name);
  I.selectOption(S.class.area, areaValue);
  I.wait(TIMEOUTS.TAB_SWITCH); // school_id は area 変更後の AJAX で再構築されるため待機
  I.selectOption(S.class.school, schoolValue);
  I.selectOption(S.class.category, courseCategory);
  I.checkOption(weekdaySelector);
  I.selectOption(S.class.startH, startH);
  I.selectOption(S.class.startM, startM);
  I.selectOption(S.class.endH, endH);
  I.selectOption(S.class.endM, endM);
  I.fillField(S.class.teiin, teiin);
  I.click(S.class.save);
  I.waitForElement(locate('body').withText(name), TIMEOUTS.SCREEN);
  await logScreenUrl(I, 'クラス作成完了');

  const url = await I.grabCurrentUrl();
  const recordId = extractRecordId(url);
  if (!recordId) throw new Error(`【クラス作成】record ID を取得できませんでした（url: ${url}）`);
  I.say(`  ✓ クラス作成完了 record=${recordId}`);
  return recordId;
}

/**
 * クラスの「コース」タブから、指定したコースを検索・紐づけする。
 * @param {object} I
 * @param {{classRecordId: string, courseName: string}} params
 */
async function linkCourseToClass(I, { classRecordId, courseName }) {
  I.say(`【コース紐づけ】クラス(${classRecordId}) に「${courseName}」を紐づけ`);
  I.amOnPage(`${BASE_URL}index.php?module=Course&action=DW_AN&record=${classRecordId}`);
  I.waitForElement(S.courseTab.tabLink, TIMEOUTS.SCREEN);
  I.click(S.courseTab.tabLink);
  I.waitForElement(S.courseTab.selectPopupBtn, TIMEOUTS.SCREEN);

  I.click(S.courseTab.selectPopupBtn);
  I.retry({ retries: 5, minTimeout: 200 }).switchToNextTab();
  I.waitForElement('#course_name', TIMEOUTS.SCREEN);
  I.fillField('#course_name', courseName);
  I.click('検索');
  I.waitForElement(locate(SELECTORS.RESULT_LINK).withText(courseName), TIMEOUTS.RESULT);
  I.click(locate(SELECTORS.RESULT_LINK).withText(courseName));
  I.switchToNextTab();

  I.waitForElement(S.courseTab.applyButton, TIMEOUTS.SCREEN);
  I.click(S.courseTab.applyButton);
  I.wait(TIMEOUTS.TAB_SWITCH);
  I.say(`  ✓ コース紐づけ完了`);
}

/**
 * クラスの「スケジュール」タブで「全体スケジュールの作成・変更」を実行し、
 * デフォルト設定（週単位・曜日は既定値）のままスケジュール終了日だけを
 * 指定月数後に変更して保存する。これにより経理ビューでの登録が可能になる。
 * @param {object} I
 * @param {{classRecordId: string, monthsUntilEnd?: number}} params
 */
async function createClassSchedule(I, { classRecordId, monthsUntilEnd = 6 }) {
  I.say(`【スケジュール作成】クラス(${classRecordId}) / 終了日: ${monthsUntilEnd}ヶ月後`);
  I.amOnPage(`${BASE_URL}index.php?module=Course&action=DW_AN&record=${classRecordId}`);
  I.waitForElement(S.scheduleTab.tabLink, TIMEOUTS.SCREEN);
  I.click(S.scheduleTab.tabLink);
  I.wait(TIMEOUTS.TAB_SWITCH);
  I.click(S.scheduleTab.bulkCreate);
  I.waitForElement(S.scheduleTab.endYear, TIMEOUTS.SCREEN);

  const end = new Date();
  end.setMonth(end.getMonth() + monthsUntilEnd);
  I.selectOption(S.scheduleTab.endYear, String(end.getFullYear()));
  I.selectOption(S.scheduleTab.endMonth, String(end.getMonth() + 1));
  I.selectOption(S.scheduleTab.endDay, String(end.getDate()));

  // 保存ボタンの onclick は window.confirm() を呼ぶ（codeceptjs の既定ダイアログ自動承認に依存）
  I.click(S.scheduleTab.saveButton);
  I.wait(TIMEOUTS.TAB_SWITCH);
  await logScreenUrl(I, 'スケジュール作成完了');
  I.say(`  ✓ スケジュール作成完了`);
}

/**
 * コース作成 → クラス作成 → 紐づけ → スケジュール作成をまとめて実行する。
 * 運営管理費テストなど、確実に金額をコントロールしたい単一コース・単一クラスの
 * 組み合わせを1コールで用意したい場合に使う。
 * @param {object} I
 * @param {object} params createShimaCourse・createClass の引数をまとめて渡す
 *   （className が省略された場合は courseName をそのままクラス名としても使う）
 * @returns {Promise<{courseRecordId: string, classRecordId: string}>}
 */
async function setupLinkedCourseAndClass(I, params) {
  const courseRecordId = await createShimaCourse(I, {
    courseCd:       params.courseCd,
    courseName:     params.courseName,
    courseCategory: params.courseCategory,
    kanrihi:        params.kanrihi,
  });

  const className = params.className || params.courseName;
  const classRecordId = await createClass(I, {
    name:            className,
    areaValue:       params.areaValue,
    schoolValue:     params.schoolValue,
    courseCategory:  params.courseCategory,
    weekdaySelector: params.weekdaySelector,
    startH:          params.startH,
    startM:          params.startM,
    endH:            params.endH,
    endM:            params.endM,
    teiin:           params.teiin,
  });

  await linkCourseToClass(I, { classRecordId, courseName: params.courseName });
  await createClassSchedule(I, { classRecordId, monthsUntilEnd: params.monthsUntilEnd });

  return { courseRecordId, classRecordId };
}

module.exports = {
  createShimaCourse,
  createClass,
  linkCourseToClass,
  createClassSchedule,
  setupLinkedCourseAndClass,
};
