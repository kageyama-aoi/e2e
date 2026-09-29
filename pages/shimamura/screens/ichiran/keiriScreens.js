'use strict';

/**
 * @fileoverview shimamura 一覧画面定義 — 経理アイコン配下
 *
 * `standardScreens` は IchiranPage.js の createIchiranScreen で navigate / fill / click / verify×2 に展開される。
 * `specialScreens` は共通形に乗らない画面の個別メソッド（`this` は結合後の IchiranPage）。
 */

const { I } = inject();
const { fillTextFieldsByName } = require('../../../../support/shimamura/utils');
const { TIMEOUTS } = require('../../../../support/shimamura/constants');
const menus = require('../../_common/sideMenus');
const { selectIfSet } = require('./_helpers');

// 結果がリンクではなく行だけの一覧（AFS会員番号検索・POSレスポンスエラー一覧）で結果として見るセル
const RESULT_ROW_CELL = 'td.oddListRowS1, td.evenListRowS1';

const standardScreens = [
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
    // 基準日（query_date）が必須。未入力で検索すると「日付をご入力ください。」で0件
    label: '売掛金', menu: menus.urikakekin,
    navKey: 'Urikakekin', coreKey: 'Urikakekin',
    fill: (d) => {
      fillTextFieldsByName(I, { query_date: d.query_date, last_name: d.last_name, first_name: d.first_name });
      selectIfSet('school_id', d.school_id);
    },
  },
  {
    label: 'AFS会員番号検索', menu: menus.afsMemberSearch,
    navKey: 'AfsMemberSearch', coreKey: 'AfsMember', resultSelector: RESULT_ROW_CELL,
    fill: (d) => {
      fillTextFieldsByName(I, { acsno: d.acsno, idnumber: d.idnumber, card_kananame: d.card_kananame });
    },
  },
  {
    // エラー登録日（date_entered）が既定で当日に絞られている
    label: 'POSレスポンスエラー一覧', menu: menus.posResponseError,
    navKey: 'PosResponseError', coreKey: 'PosResponseError',
    clearDateRange: ['date_entered'], resultSelector: RESULT_ROW_CELL,
    fill: (d) => {
      selectIfSet('error_resource_id', d.error_resource_id);
    },
  },
  {
    label: '料金一覧', menu: menus.feeList,
    navKey: 'FeeList', coreKey: 'FeeList', clearDateRange: true,
    fill: (d) => {
      fillTextFieldsByName(I, { fee_name: d.fee_name, course_name: d.course_name, last_name: d.last_name });
      selectIfSet('school_id', d.school_id);
    },
  },
  {
    // testgcp は元データ0件のため、テスト用共通料金「E2E一覧検索用共通料金」を1件登録済み（#260）。
    // 既定の絞り込み（店舗 TESTモール太田店・料金サブ区分 入会金）がこのデータと一致する
    label: '料金一覧(共通)', menu: menus.feeCommonList,
    navKey: 'FeeCommonList', coreKey: 'FeeCommonList',
    fill: (d) => {
      fillTextFieldsByName(I, { fee_name: d.fee_name });
      selectIfSet('fee_subcategory', d.fee_subcategory);
    },
  },
];

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
};

module.exports = { standardScreens, specialScreens };
