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
  {
    // testgcp は元データ0件のため、テスト用法人「E2E一覧検索用法人」を1件登録済み（#257）
    label: '法人/団体一覧', menu: menus.accountList,
    navKey: 'AccountList', coreKey: 'AccountList',
    fill: (d) => {
      fillTextFieldsByName(I, { name: d.name, billing_address_state: d.billing_address_state });
    },
  },
  {
    label: 'スタッフ一覧', menu: menus.staffList,
    navKey: 'StaffList', coreKey: 'StaffList',
    fill: (d) => {
      fillTextFieldsByName(I, { last_name: d.last_name, first_name: d.first_name });
    },
  },
  {
    label: '保護者一覧', menu: menus.parentList,
    navKey: 'ParentList', coreKey: 'ParentList',
    fill: (d) => {
      fillTextFieldsByName(I, { last_name: d.last_name, first_name: d.first_name });
    },
  },
];

module.exports = { standardScreens, specialScreens: {} };
