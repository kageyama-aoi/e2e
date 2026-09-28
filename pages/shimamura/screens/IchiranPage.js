'use strict';

const { I } = inject();
const { toggleGroupmenu } = require('../../../support/shimamura/utils');
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

// ================================================================
//  標準一覧画面ファクトリ
//
//  検索ボタン input[name="search"] と結果リンク a.listViewTdLinkS1 が共通の
//  「標準一覧画面」を、1つの定義から navigate / fill / click / verify×2 の
//  5メソッドに展開する。メソッド名は画面ごとの navKey / coreKey で決まる。
//
//  画面の定義はアイコン別ファイル（./ichiran/<icon>Screens.js）に置く（#251）。
//    standardScreens … この共通形に乗る画面（1エントリ = 1画面）
//    specialScreens  … 乗らない画面の個別メソッド（未収金一覧・受注売上・出席表検索・有効性データ出力 等）
//
//  新しい標準一覧画面を追加するとき: 該当アイコンのファイルの standardScreens に1エントリ足すだけ。
//  新しいアイコンのファイルを作ったら下の ICON_SCREEN_FILES に足す。
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

// ================================================================
//  アイコン別の画面定義を結合
//  （メソッド名が重複したら後勝ちで静かに上書きされるため、起動時に検出して止める）
// ================================================================
const ICON_SCREEN_FILES = [
  require('./ichiran/studentScreens'),
  require('./ichiran/courseScreens'),
  require('./ichiran/teacherScreens'),
  require('./ichiran/contactsScreens'),
  require('./ichiran/keiriScreens'),
];

const screenMethods = [
  ...ICON_SCREEN_FILES.flatMap((f) => f.standardScreens.map(createIchiranScreen)),
  ...ICON_SCREEN_FILES.map((f) => f.specialScreens),
];

const seen = new Set(Object.keys(base));
for (const methods of screenMethods) {
  for (const name of Object.keys(methods)) {
    if (seen.has(name)) throw new Error(`IchiranPage: メソッド名 ${name} が重複しています（ichiran/*Screens.js を確認）`);
    seen.add(name);
  }
}

module.exports = Object.assign({}, base, ...screenMethods);
