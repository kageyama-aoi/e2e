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
