'use strict';

/**
 * @fileoverview shimamura 一覧画面定義 — 部屋･備品アイコン配下
 *
 * `standardScreens` は IchiranPage.js の createIchiranScreen で navigate / fill / click / verify×2 に展開される。
 */

const { I } = inject();
const { fillTextFieldsByName } = require('../../../../support/shimamura/utils');
const menus = require('../../_common/sideMenus');
const { selectIfSet } = require('./_helpers');

const standardScreens = [
  {
    // 店舗の既定値（TESTモール太田店）で絞られた状態で開く。店舗セレクトで他店舗の部屋も引ける
    label: '部屋一覧', menu: menus.classroomList,
    navKey: 'ClassroomList', coreKey: 'ClassroomList',
    fill: (d) => {
      fillTextFieldsByName(I, { name: d.name });
      selectIfSet('school_id', d.school_id);
    },
  },
  {
    // エリアの既定値（中国・四国）で絞られた状態で開く
    label: '店舗一覧', menu: menus.schoolList,
    navKey: 'SchoolList', coreKey: 'SchoolList',
    fill: (d) => {
      fillTextFieldsByName(I, { name: d.name });
      selectIfSet('area_id', d.area_id);
    },
  },
];

module.exports = { standardScreens, specialScreens: {} };
