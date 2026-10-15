'use strict';

/**
 * @fileoverview shimamura 一覧画面定義 — 講師アイコン配下
 *
 * `standardScreens` は IchiranPage.js の createIchiranScreen で navigate / fill / click / verify×2 に展開される。
 */

const { I } = inject();
const { fillTextFieldsByName } = require('../../../../support/shimamura/utils');
const menus = require('../../_common/sideMenus');
const { selectIfSet } = require('./_helpers');

const standardScreens = [
  {
    label: '講師一覧', menu: menus.teacherList,
    navKey: 'TeacherList', coreKey: 'TeacherList',
    fill: (d) => {
      fillTextFieldsByName(I, { last_name: d.last_name, first_name: d.first_name });
      selectIfSet('school_id', d.school_id);
    },
  },
  {
    // 講師の姓・名とクラス名（name）で絞り込める。結果リンクは講師コード・クラス名・受講生
    label: '講師別受講生一覧', menu: menus.teacherStudentList,
    navKey: 'TeacherStudentList', coreKey: 'TeacherStudentList',
    fill: (d) => {
      fillTextFieldsByName(I, { last_name: d.last_name, first_name: d.first_name, name: d.name });
      selectIfSet('school_id', d.school_id);
    },
  },
];

module.exports = { standardScreens, specialScreens: {} };
