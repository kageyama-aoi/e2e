'use strict';

/**
 * @fileoverview shimamura 一覧画面定義 — コンタクトアイコン配下
 *
 * `standardScreens` は IchiranPage.js の createIchiranScreen で navigate / fill / click / verify×2 に展開される。
 */

const { I } = inject();
const { fillTextFieldsByName } = require('../../../../support/shimamura/utils');
const menus = require('../../_common/sideMenus');
const { selectIfSet } = require('./_helpers');

const standardScreens = [
  {
    label: '顧客一覧', menu: menus.contactModuleList,
    navKey: 'ContactModuleList', coreKey: 'ContactModuleList',
    fill: (d) => {
      fillTextFieldsByName(I, { last_name: d.last_name, company_name: d.company_name });
      selectIfSet('school_id', d.school_id);
    },
  },
];

module.exports = { standardScreens, specialScreens: {} };
