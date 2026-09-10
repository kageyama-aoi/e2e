'use strict';

const { I } = inject();
const { toggleGroupmenu, fillTextFieldsByName } = require('../../../support/shimamura/utils');
const menus = require('../_common/sideMenus');
const { TIMEOUTS, SELECTORS, BASE_URL } = require('../../../support/shimamura/constants');

const RESULT_LINK = `a${SELECTORS.RESULT_LINK}`;

// ================================================================
//  共通ヘルパー（this 経由で全メソッドから使う）
// ================================================================
const base = {

  // -- 検索実行・結果確認（listViewTdLinkS1 を使う標準一覧画面共通） --

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

  // -- ナビゲーション --

  _navigateToModule(moduleRelUrl) {
    // sideMenus.js の URL は先頭 '/' 付きでも無しでもよい（BASE_URL が末尾 '/' 付きのため重複を除く）
    I.amOnPage(BASE_URL + String(moduleRelUrl).replace(/^\//, ''));
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
};

// select[name="X"] は値があるときだけ選択する（fill 定義を短くするための小ヘルパー）
function selectIfSet(name, value) {
  if (value) I.selectOption(`select[name="${name}"]`, value);
}

// ================================================================
//  標準一覧画面ファクトリ
//
//  検索ボタン input[name="search"] と結果リンク a.listViewTdLinkS1 が共通の
//  「標準一覧画面」を、1つの定義から navigate / fill / click / verify×2 の
//  5メソッドに展開する。メソッド名は画面ごとの navKey / coreKey で決まる。
//
//  非標準の画面（未収金一覧・受注売上・出席表検索・有効性データ出力）は
//  ファイル下部に個別メソッドとして定義する（この共通形に乗らないため）。
//
//  新しい標準一覧画面を追加するとき: STANDARD_SCREENS に1エントリ足すだけ。
//  （手順は /shimamura-ichiran-dev スキル参照）
// ================================================================
function createIchiranScreen({ label, menu, navKey, coreKey, fill, clearDateRange = false }) {
  return {
    async [`navigateTo${navKey}Page`]() {
      I.say(`【${label}】一覧画面へ遷移`);
      await this._navigateViaMenu(menu);
      I.waitForElement('input[name="search"]', TIMEOUTS.ELEMENT);
      if (clearDateRange) this._clearDateRangeFields();
    },

    [`fill${coreKey}SearchConditions`](data) {
      I.say(`【${label}】検索条件を入力`);
      fill(data);
    },

    [`click${coreKey}SearchAndWait`]() {
      I.say(`【${label}】検索実行`);
      this._clickSearchAndWait();
    },

    [`verify${coreKey}ResultsExist`]() {
      I.say(`【${label}】検索結果が表示されることを確認`);
      this._verifyResultsExist();
    },

    [`verify${coreKey}RecordInResults`](expectedText) {
      I.say(`【${label}】"${expectedText}" が結果に表示されることを確認`);
      this._verifyRecordInResults(expectedText);
    },
  };
}

const STANDARD_SCREENS = [
  {
    label: '入出金一覧', menu: menus.transactionList,
    navKey: 'TransactionList', coreKey: 'Transaction', clearDateRange: true,
    fill: (d) => {
      fillTextFieldsByName(I, { last_name: d.last_name, course_name: d.course_name });
      selectIfSet('area_id',      d.area_id);
      selectIfSet('school_id',    d.school_id);
      selectIfSet('smsgroup',     d.smsgroup);
      selectIfSet('claim_type',   d.claim_type);
      selectIfSet('payment_type', d.payment_type);
    },
  },
  {
    label: '受講生検索', menu: menus.studentSearch,
    navKey: 'StudentSearch', coreKey: 'Student', clearDateRange: true,
    fill: (d) => {
      fillTextFieldsByName(I, { last_name: d.last_name, first_name: d.first_name, idnumber: d.idnumber });
      selectIfSet('school_id', d.school_id);
    },
  },
  {
    label: '候補生一覧', menu: menus.contactList,
    navKey: 'ContactList', coreKey: 'ContactList', clearDateRange: true,
    fill: (d) => {
      fillTextFieldsByName(I, { last_name: d.last_name, first_name: d.first_name });
    },
  },
  {
    label: 'コース別受講生一覧', menu: menus.courseByStudent,
    navKey: 'CourseByStudent', coreKey: 'CourseByStudent',
    fill: (d) => {
      fillTextFieldsByName(I, { course_name: d.course_name });
      selectIfSet('school_id', d.school_id);
    },
  },
  {
    label: 'クラス一覧', menu: menus.classList,
    navKey: 'ClassList', coreKey: 'ClassList',
    fill: (d) => {
      fillTextFieldsByName(I, { name: d.name });
      selectIfSet('school_id', d.school_id);
    },
  },
  {
    label: '講師一覧', menu: menus.teacherList,
    navKey: 'TeacherList', coreKey: 'TeacherList',
    fill: (d) => {
      fillTextFieldsByName(I, { last_name: d.last_name, first_name: d.first_name });
      selectIfSet('school_id', d.school_id);
    },
  },
  {
    label: 'コース一覧', menu: menus.courseIchiran,
    navKey: 'CourseIchiran', coreKey: 'CourseIchiran',
    fill: (d) => {
      // CSV 列は name だが画面フィールドは course_name
      fillTextFieldsByName(I, { course_name: d.name });
      selectIfSet('school_id', d.school_id);
    },
  },
  {
    label: '顧客一覧', menu: menus.contactModuleList,
    navKey: 'ContactModuleList', coreKey: 'ContactModuleList',
    fill: (d) => {
      fillTextFieldsByName(I, { last_name: d.last_name, company_name: d.company_name });
      selectIfSet('school_id', d.school_id);
    },
  },
];

// ================================================================
//  非標準の一覧画面（共通ファクトリに乗らない画面）
// ================================================================
const specialScreens = {

  // -- 未収金一覧 (mishukin_list) --
  //  検索結果は listViewTdLinkS1 ではなくページネーションテーブル形式。

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
    selectIfSet('school_id', data.school_id);
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

  // -- 有効性データ出力 (validity_data_output) --

  async navigateToValidityDataOutputPage() {
    I.say('【有効性データ出力】画面へ遷移');
    await this._navigateViaMenu(menus.validityDataOutput);
    I.waitForElement('input[value="有効性データ出力"]', TIMEOUTS.ELEMENT);
  },

  async downloadValidityDataCsv(savePath) {
    I.say('【有効性データ出力】出力ボタンをクリックしてCSVをダウンロード');
    return await I.downloadAndReadCsv('input[value="有効性データ出力"]', savePath);
  },

  // -- 受注・売上（経理）(keiri_invoices) --

  async navigateToKeiriInvoicesPage() {
    I.say('【受注・売上】一覧画面へ遷移');
    await this._navigateViaMenu(menus.keiriInvoices);
    I.waitForElement('select[name="keiri_month_year"]', TIMEOUTS.ELEMENT);
  },

  fillKeiriInvoicesSearchConditions(data) {
    I.say('【受注・売上】検索条件を入力');
    selectIfSet('keiri_month_year',  data.keiri_year);
    selectIfSet('keiri_month_month', data.keiri_month);
    selectIfSet('keiri_month_day',   data.keiri_day);
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

  // -- 出席表検索 (attendance_today) --

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

module.exports = Object.assign(
  {},
  base,
  ...STANDARD_SCREENS.map(createIchiranScreen),
  specialScreens,
);
