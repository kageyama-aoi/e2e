'use strict';

/**
 * @fileoverview shimamura 一覧画面定義 — コースアイコン配下
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
    label: 'クラス一覧', menu: menus.classList,
    navKey: 'ClassList', coreKey: 'ClassList',
    fill: (d) => {
      fillTextFieldsByName(I, { name: d.name });
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
];

const specialScreens = {

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

module.exports = { standardScreens, specialScreens };
