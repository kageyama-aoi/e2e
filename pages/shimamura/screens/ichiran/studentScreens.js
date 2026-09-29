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
    label: 'コース別受講生一覧', menu: menus.courseByStudent,
    navKey: 'CourseByStudent', coreKey: 'CourseByStudent',
    fill: (d) => {
      fillTextFieldsByName(I, { course_name: d.course_name });
      selectIfSet('school_id', d.school_id);
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
