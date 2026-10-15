'use strict';

/**
 * @fileoverview shimamura 一覧画面定義 — 受講生アイコン配下
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
    // コース名欄はポップアップ選択式（表示欄は disabled・実値は hidden）なので、絞り込みはコース区分のセレクトで行う（#209）
    label: 'コース別受講生一覧', menu: menus.courseByStudent,
    navKey: 'CourseByStudent', coreKey: 'CourseByStudent',
    fill: (d) => {
      selectIfSet('course_category', d.course_category);
      selectIfSet('school_id', d.school_id);
    },
  },
  {
    // クラス名欄はポップアップ選択式（disabled）なので、絞り込みはセレクトで行う
    label: '受講生別クラス一覧', menu: menus.classesByStudent,
    navKey: 'ClassesByStudent', coreKey: 'ClassesByStudent', clearDateRange: true,
    fill: (d) => {
      selectIfSet('school_id', d.school_id);
      selectIfSet('genjukousha', d.genjukousha);
    },
  },
  {
    // 登録日・更新日・申込最終送信日の3範囲が既定で当月に埋まっており、そのままだと0件になる
    label: '債権買取顧客情報一覧', menu: menus.creditPurchaseCustomer,
    navKey: 'CreditPurchaseCustomer', coreKey: 'CreditPurchaseCustomer',
    clearDateRange: ['date_entered_range', 'date_modified_range', 'moushikomi_last_send_time_range'],
    fill: (d) => {
      fillTextFieldsByName(I, { idnumber: d.idnumber, last_name: d.last_name, first_name: d.first_name });
    },
  },
  {
    label: '候補生検索', menu: menus.kouhoSearch,
    navKey: 'KouhoSearch', coreKey: 'Kouho', clearDateRange: true,
    fill: (d) => {
      fillTextFieldsByName(I, { last_name: d.last_name, first_name: d.first_name });
    },
  },
  {
    label: '資料請求一覧', menu: menus.documentRequestList,
    navKey: 'DocumentRequestList', coreKey: 'DocumentRequest', clearDateRange: true,
    fill: (d) => {
      fillTextFieldsByName(I, { last_name: d.last_name, first_name: d.first_name });
    },
  },
  {
    // 結果リンクは「対象者（受講生名）」と「タイトル」の2種類
    label: 'メモ一覧', menu: menus.studentMemoList,
    navKey: 'StudentMemoList', coreKey: 'StudentMemo',
    fill: (d) => {
      fillTextFieldsByName(I, { name: d.name });
    },
  },
];

const specialScreens = {

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
};

module.exports = { standardScreens, specialScreens };
