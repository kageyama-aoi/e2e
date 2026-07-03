'use strict';

const { I } = inject();
const { toggleGroupmenu, fillTextFieldsByName } = require('../../../support/shimamura/utils');
const menus = require('../_common/sideMenus');
const { TIMEOUTS, SELECTORS } = require('../../../support/shimamura/constants');

const RESULT_LINK = `a${SELECTORS.RESULT_LINK}`;

module.exports = {

  // ----------------------------------------------------------------
  //  共通: 検索実行・結果確認（listViewTdLinkS1 を使う全モジュール共通）
  // ----------------------------------------------------------------

  _clickSearchAndWait() {
    I.click('input[name="search"]');
    I.waitForElement(RESULT_LINK, TIMEOUTS.RESULT);
  },

  _verifyResultsExist() {
    I.seeElement(RESULT_LINK);
  },

  _verifyRecordInResults(expectedText) {
    I.see(expectedText, RESULT_LINK);
  },

  // ----------------------------------------------------------------
  //  ナビゲーションヘルパー
  // ----------------------------------------------------------------

  _navigateToModule(moduleRelUrl) {
    I.amOnPage(process.env.BASE_URL + moduleRelUrl);
    I.waitForElement('a[class*="subMenuLink"]', TIMEOUTS.ELEMENT);
  },

  _clickShortcut(linkText) {
    I.say(`【ナビ】サイドバー "${linkText}" をクリック`);
    I.click(locate('a[class*="subMenuLink"]').withText(linkText));
  },

  async _navigateViaMenu(menuDef) {
    const useSidebar = process.env.SHIMAMURA_NAV === 'sidebar';
    if (!useSidebar || !menuDef.moduleUrl) {
      this._navigateToModule(menuDef.directUrl || menuDef.moduleUrl);
      return;
    }
    this._navigateToModule(menuDef.moduleUrl);
    if (menuDef.collapseToggle) {
      await toggleGroupmenu(I, menuDef.collapseToggle);
    }
    this._clickShortcut(menuDef.shortcut);
  },

  _clearDateRangeFields() {
    I.executeScript(() => {
      ['date_group1_rstart', 'date_group1_rend'].forEach(name => {
        const el = document.querySelector(`[name="${name}"]`);
        if (el) el.value = '';
      });
    });
  },

  // ----------------------------------------------------------------
  //  入出金一覧 (transaction_list)
  // ----------------------------------------------------------------

  async navigateToTransactionListPage() {
    I.say('【入出金一覧】一覧画面へ遷移');
    await this._navigateViaMenu(menus.transactionList);
    I.waitForElement('input[name="search"]', TIMEOUTS.ELEMENT);
    this._clearDateRangeFields();
  },

  fillTransactionSearchConditions(data) {
    I.say('【入出金一覧】検索条件を入力');
    fillTextFieldsByName(I, {
      last_name:   data.last_name,
      course_name: data.course_name,
    });
    if (data.area_id)      I.selectOption('select[name="area_id"]', data.area_id);
    if (data.school_id)    I.selectOption('select[name="school_id"]', data.school_id);
    if (data.smsgroup)     I.selectOption('select[name="smsgroup"]', data.smsgroup);
    if (data.claim_type)   I.selectOption('select[name="claim_type"]', data.claim_type);
    if (data.payment_type) I.selectOption('select[name="payment_type"]', data.payment_type);
  },

  clickTransactionSearchAndWait() {
    I.say('【入出金一覧】検索実行');
    this._clickSearchAndWait();
  },

  verifyTransactionResultsExist() {
    I.say('【入出金一覧】検索結果が表示されることを確認');
    this._verifyResultsExist();
  },

  verifyTransactionRecordInResults(expectedText) {
    I.say(`【入出金一覧】"${expectedText}" が結果に表示されることを確認`);
    this._verifyRecordInResults(expectedText);
  },

  // ----------------------------------------------------------------
  //  受講生検索 (student_search)
  // ----------------------------------------------------------------

  async navigateToStudentSearchPage() {
    I.say('【受講生検索】一覧画面へ遷移');
    await this._navigateViaMenu(menus.studentSearch);
    I.waitForElement('input[name="search"]', TIMEOUTS.ELEMENT);
    this._clearDateRangeFields();
  },

  fillStudentSearchConditions(data) {
    I.say('【受講生検索】検索条件を入力');
    fillTextFieldsByName(I, {
      last_name:  data.last_name,
      first_name: data.first_name,
      idnumber:   data.idnumber,
    });
    if (data.school_id)  I.selectOption('select[name="school_id"]', data.school_id);
  },

  clickStudentSearchAndWait() {
    I.say('【受講生検索】検索実行');
    this._clickSearchAndWait();
  },

  verifyStudentResultsExist() {
    I.say('【受講生検索】検索結果が表示されることを確認');
    this._verifyResultsExist();
  },

  verifyStudentRecordInResults(expectedText) {
    I.say(`【受講生検索】"${expectedText}" が結果に表示されることを確認`);
    this._verifyRecordInResults(expectedText);
  },

  // ----------------------------------------------------------------
  //  候補生一覧 (contact_list)
  // ----------------------------------------------------------------

  async navigateToContactListPage() {
    I.say('【候補生一覧】一覧画面へ遷移');
    await this._navigateViaMenu(menus.contactList);
    I.waitForElement('input[name="search"]', TIMEOUTS.ELEMENT);
    this._clearDateRangeFields();
  },

  fillContactListSearchConditions(data) {
    I.say('【候補生一覧】検索条件を入力');
    fillTextFieldsByName(I, {
      last_name:  data.last_name,
      first_name: data.first_name,
    });
  },

  clickContactListSearchAndWait() {
    I.say('【候補生一覧】検索実行');
    this._clickSearchAndWait();
  },

  verifyContactListResultsExist() {
    I.say('【候補生一覧】検索結果が表示されることを確認');
    this._verifyResultsExist();
  },

  verifyContactListRecordInResults(expectedText) {
    I.say(`【候補生一覧】"${expectedText}" が結果に表示されることを確認`);
    this._verifyRecordInResults(expectedText);
  },

  // ----------------------------------------------------------------
  //  コース別受講生一覧 (course_by_student)
  // ----------------------------------------------------------------

  async navigateToCourseByStudentPage() {
    I.say('【コース別受講生一覧】一覧画面へ遷移');
    await this._navigateViaMenu(menus.courseByStudent);
    I.waitForElement('input[name="search"]', TIMEOUTS.ELEMENT);
  },

  fillCourseByStudentSearchConditions(data) {
    I.say('【コース別受講生一覧】検索条件を入力');
    fillTextFieldsByName(I, { course_name: data.course_name });
    if (data.school_id)   I.selectOption('select[name="school_id"]', data.school_id);
  },

  clickCourseByStudentSearchAndWait() {
    I.say('【コース別受講生一覧】検索実行');
    this._clickSearchAndWait();
  },

  verifyCourseByStudentResultsExist() {
    I.say('【コース別受講生一覧】検索結果が表示されることを確認');
    this._verifyResultsExist();
  },

  verifyCourseByStudentRecordInResults(expectedText) {
    I.say(`【コース別受講生一覧】"${expectedText}" が結果に表示されることを確認`);
    this._verifyRecordInResults(expectedText);
  },

  // ----------------------------------------------------------------
  //  クラス一覧 (class_list)
  // ----------------------------------------------------------------

  async navigateToClassListPage() {
    I.say('【クラス一覧】一覧画面へ遷移');
    await this._navigateViaMenu(menus.classList);
    I.waitForElement('input[name="search"]', TIMEOUTS.ELEMENT);
  },

  fillClassListSearchConditions(data) {
    I.say('【クラス一覧】検索条件を入力');
    fillTextFieldsByName(I, { name: data.name });
    if (data.school_id) I.selectOption('select[name="school_id"]', data.school_id);
  },

  clickClassListSearchAndWait() {
    I.say('【クラス一覧】検索実行');
    this._clickSearchAndWait();
  },

  verifyClassListResultsExist() {
    I.say('【クラス一覧】検索結果が表示されることを確認');
    this._verifyResultsExist();
  },

  verifyClassListRecordInResults(expectedText) {
    I.say(`【クラス一覧】"${expectedText}" が結果に表示されることを確認`);
    this._verifyRecordInResults(expectedText);
  },

  // ----------------------------------------------------------------
  //  講師一覧 (teacher_list)
  // ----------------------------------------------------------------

  async navigateToTeacherListPage() {
    I.say('【講師一覧】一覧画面へ遷移');
    await this._navigateViaMenu(menus.teacherList);
    I.waitForElement('input[name="search"]', TIMEOUTS.ELEMENT);
  },

  fillTeacherListSearchConditions(data) {
    I.say('【講師一覧】検索条件を入力');
    fillTextFieldsByName(I, {
      last_name:  data.last_name,
      first_name: data.first_name,
    });
    if (data.school_id)  I.selectOption('select[name="school_id"]', data.school_id);
  },

  clickTeacherListSearchAndWait() {
    I.say('【講師一覧】検索実行');
    this._clickSearchAndWait();
  },

  verifyTeacherListResultsExist() {
    I.say('【講師一覧】検索結果が表示されることを確認');
    this._verifyResultsExist();
  },

  verifyTeacherListRecordInResults(expectedText) {
    I.say(`【講師一覧】"${expectedText}" が結果に表示されることを確認`);
    this._verifyRecordInResults(expectedText);
  },

  // ----------------------------------------------------------------
  //  コース一覧（管理）(course_ichiran)
  // ----------------------------------------------------------------

  async navigateToCourseIchiranPage() {
    I.say('【コース一覧】一覧画面へ遷移');
    await this._navigateViaMenu(menus.courseIchiran);
    I.waitForElement('input[name="search"]', TIMEOUTS.ELEMENT);
  },

  fillCourseIchiranSearchConditions(data) {
    I.say('【コース一覧】検索条件を入力');
    fillTextFieldsByName(I, { course_name: data.name });
    if (data.school_id) I.selectOption('select[name="school_id"]', data.school_id);
  },

  clickCourseIchiranSearchAndWait() {
    I.say('【コース一覧】検索実行');
    this._clickSearchAndWait();
  },

  verifyCourseIchiranResultsExist() {
    I.say('【コース一覧】検索結果が表示されることを確認');
    this._verifyResultsExist();
  },

  verifyCourseIchiranRecordInResults(expectedText) {
    I.say(`【コース一覧】"${expectedText}" が結果に表示されることを確認`);
    this._verifyRecordInResults(expectedText);
  },

  // ----------------------------------------------------------------
  //  顧客一覧 (contact_module_list)
  // ----------------------------------------------------------------

  async navigateToContactModuleListPage() {
    I.say('【顧客一覧】一覧画面へ遷移');
    await this._navigateViaMenu(menus.contactModuleList);
    I.waitForElement('input[name="search"]', TIMEOUTS.ELEMENT);
  },

  fillContactModuleListSearchConditions(data) {
    I.say('【顧客一覧】検索条件を入力');
    fillTextFieldsByName(I, {
      last_name:    data.last_name,
      company_name: data.company_name,
    });
    if (data.school_id)    I.selectOption('select[name="school_id"]', data.school_id);
  },

  clickContactModuleListSearchAndWait() {
    I.say('【顧客一覧】検索実行');
    this._clickSearchAndWait();
  },

  verifyContactModuleListResultsExist() {
    I.say('【顧客一覧】検索結果が表示されることを確認');
    this._verifyResultsExist();
  },

  verifyContactModuleListRecordInResults(expectedText) {
    I.say(`【顧客一覧】"${expectedText}" が結果に表示されることを確認`);
    this._verifyRecordInResults(expectedText);
  },

  // ----------------------------------------------------------------
  //  未収金一覧 (mishukin_list)
  //  ※ 結果リンクは listViewTdLinkS1 を使わない特殊テーブル形式。
  // ----------------------------------------------------------------

  async navigateToMishukinListPage() {
    I.say('【未収金一覧】一覧画面へ遷移');
    await this._navigateViaMenu(menus.mishukinList);
    I.waitForElement('input[name="search"]', TIMEOUTS.ELEMENT);
  },

  fillMishukinSearchConditions(data) {
    I.say('【未収金一覧】検索条件を入力');
    fillTextFieldsByName(I, {
      last_name:  data.last_name,
      query_date: data.query_date,
    });
    if (data.school_id)  I.selectOption('select[name="school_id"]', data.school_id);
  },

  clickMishukinSearchAndWait() {
    I.say('【未収金一覧】検索実行');
    I.click('input[name="search"]');
    I.waitForElement('.listViewPaginationTdS1', TIMEOUTS.ENABLED);
  },

  verifyMishukinTableVisible() {
    I.say('【未収金一覧】結果テーブルが表示されることを確認');
    I.seeElement('.listViewPaginationTdS1');
  },

  // ----------------------------------------------------------------
  //  有効性データ出力 (validity_data_output)
  // ----------------------------------------------------------------

  async navigateToValidityDataOutputPage() {
    I.say('【有効性データ出力】画面へ遷移');
    await this._navigateViaMenu(menus.validityDataOutput);
    I.waitForElement('input[value="有効性データ出力"]', TIMEOUTS.ELEMENT);
  },

  async downloadValidityDataCsv(savePath) {
    I.say('【有効性データ出力】出力ボタンをクリックしてCSVをダウンロード');
    return await I.downloadAndReadCsv('input[value="有効性データ出力"]', savePath);
  },

  // ----------------------------------------------------------------
  //  受注・売上（経理）(keiri_invoices)
  // ----------------------------------------------------------------

  async navigateToKeiriInvoicesPage() {
    I.say('【受注・売上】一覧画面へ遷移');
    await this._navigateViaMenu(menus.keiriInvoices);
    I.waitForElement('select[name="keiri_month_year"]', TIMEOUTS.ELEMENT);
  },

  fillKeiriInvoicesSearchConditions(data) {
    I.say('【受注・売上】検索条件を入力');
    if (data.keiri_year)  I.selectOption('select[name="keiri_month_year"]',  data.keiri_year);
    if (data.keiri_month) I.selectOption('select[name="keiri_month_month"]', data.keiri_month);
    if (data.keiri_day)   I.selectOption('select[name="keiri_month_day"]',   data.keiri_day);
  },

  clickKeiriInvoicesDisplayAndWait() {
    I.say('【受注・売上】表示ボタンをクリック');
    I.click('input[name="button"][value="表示"]');
    I.waitForElement('select[name="keiri_month_year"]', TIMEOUTS.ENABLED);
  },

  verifyKeiriInvoicesPageLoaded() {
    I.say('【受注・売上】フォームが再表示されることを確認');
    I.seeElement('select[name="keiri_month_year"]');
  },

  // ----------------------------------------------------------------
  //  出席表検索 (attendance_today)
  // ----------------------------------------------------------------

  async navigateToAttendanceTodayPage() {
    I.say('【出席表検索】一覧画面へ遷移');
    await this._navigateViaMenu(menus.attendanceToday);
    I.waitForElement('input[name="button"][value="出席表表示"]', TIMEOUTS.ELEMENT);
  },

  fillAttendanceTodaySearchConditions(data) {
    I.say('【出席表検索】検索条件を入力');
    fillTextFieldsByName(I, {
      start_date: data.start_date,
      end_date:   data.end_date,
    });
  },

  clickAttendanceTodayDisplayAndWait() {
    I.say('【出席表検索】出席表表示ボタンをクリック');
    I.click('input[name="button"][value="出席表表示"]');
    I.waitForElement('.listViewPaginationTdS1', TIMEOUTS.ENABLED);
  },

  verifyAttendanceTodayPageLoaded() {
    I.say('【出席表検索】ページが表示されることを確認');
    I.seeElement('.listViewPaginationTdS1');
  },
};
