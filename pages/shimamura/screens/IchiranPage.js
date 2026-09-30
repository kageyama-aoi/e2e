'use strict';

const { I } = inject();
const { toggleGroupmenu, sidebarLinkXPath } = require('../../../support/shimamura/utils');
const { TIMEOUTS, SELECTORS, BASE_URL } = require('../../../support/shimamura/constants');

const RESULT_LINK = `a${SELECTORS.RESULT_LINK}`;

// セレクタリスト（'a, b'）の各要素に :not([data-e2e-stale]) を付ける
const notStale = (sel) => sel.split(',').map((s) => `${s.trim()}:not([data-e2e-stale])`).join(', ');

// ================================================================
//  共通ヘルパー（this 経由で全メソッドから使う）
//  resultSel は結果として見る要素。既定は結果リンク a.listViewTdLinkS1（リンクの無い一覧は画面定義で指定）
// ================================================================
const base = {

  // -- 検索実行・結果確認（標準一覧画面共通） --

  // 開いた時点で結果一覧が出ている画面（資料請求一覧・講師別受講生一覧 等）では、単に結果要素を待つと
  // 検索前の要素で即成立し、後続の結果確認が「検索前の一覧」を見て合格しうる（#257）。
  // 検索前の要素に印を付け、印の無い＝検索後に描かれた要素を待つ（全画面リロードでも AJAX 差し替えでも成立）
  _clickSearchAndWait(resultSel = RESULT_LINK) {
    I.executeScript((sel) => {
      document.querySelectorAll(sel).forEach((el) => el.setAttribute('data-e2e-stale', '1'));
    }, resultSel);
    I.click('input[name="search"]');
    I.waitForElement(notStale(resultSel), TIMEOUTS.RESULT);
  },

  _verifyResultsExist(resultSel = RESULT_LINK) {
    I.seeElement(resultSel);
  },

  _verifyRecordInResults(expectedText, resultSel = RESULT_LINK) {
    I.see(expectedText, resultSel);
  },

  // -- ナビゲーション --

  _navigateToModule(moduleRelUrl) {
    // sideMenus.js の URL は先頭 '/' 付きでも無しでもよい（BASE_URL が末尾 '/' 付きのため重複を除く）
    I.amOnPage(BASE_URL + String(moduleRelUrl).replace(/^\//, ''));
    I.waitForElement('a[class*="subMenuLink"]', TIMEOUTS.ELEMENT);
  },

  // 表示テキスト完全一致（withText の部分一致だと「料金一覧」が「料金一覧(共通)」にも当たる。#260）
  _clickShortcut(linkText) {
    I.say(`【ナビ】サイドバー "${linkText}" をクリック`);
    I.click(locate(sidebarLinkXPath(linkText)).first());
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

  // 日付範囲 `<prefix>_rstart` / `<prefix>_rend` を空にする。既定は date_group1。
  // 画面によっては別名の範囲が既定で当月に埋まっている（例: 債権買取顧客情報一覧の date_entered_range 等）
  _clearDateRangeFields(prefixes = ['date_group1']) {
    I.executeScript((prefixList) => {
      prefixList.forEach(prefix => {
        [`${prefix}_rstart`, `${prefix}_rend`].forEach(name => {
          const el = document.querySelector(`[name="${name}"]`);
          if (el) el.value = '';
        });
      });
    }, prefixes);
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
//  clearDateRange: true = date_group1 を空にする／配列 = 指定した日付範囲の prefix を空にする。
//  resultSelector: 結果として見る要素。省略時は結果リンク a.listViewTdLinkS1。
//                  リンクの無い一覧（AFS会員番号検索 等）は行のセル 'td.oddListRowS1, td.evenListRowS1' を指定する。
//
//  新しい標準一覧画面を追加するとき: 該当アイコンのファイルの standardScreens に1エントリ足すだけ。
//  新しいアイコンのファイルを作ったら下の ICON_SCREEN_FILES に足す。
//  （手順は /shimamura-ichiran-dev スキル参照）
// ================================================================
function createIchiranScreen({ label, menu, navKey, coreKey, fill, clearDateRange = false, resultSelector = RESULT_LINK }) {
  return {
    async [`navigateTo${navKey}Page`]() {
      I.say(`【${label}】一覧画面へ遷移`);
      await this._navigateViaMenu(menu);
      I.waitForElement('input[name="search"]', TIMEOUTS.ELEMENT);
      if (clearDateRange) this._clearDateRangeFields(clearDateRange === true ? undefined : clearDateRange);
    },

    [`fill${coreKey}SearchConditions`](data) {
      I.say(`【${label}】検索条件を入力`);
      fill(data);
    },

    [`click${coreKey}SearchAndWait`]() {
      I.say(`【${label}】検索実行`);
      this._clickSearchAndWait(resultSelector);
    },

    [`verify${coreKey}ResultsExist`]() {
      I.say(`【${label}】検索結果が表示されることを確認`);
      this._verifyResultsExist(resultSelector);
    },

    [`verify${coreKey}RecordInResults`](expectedText) {
      I.say(`【${label}】"${expectedText}" が結果に表示されることを確認`);
      this._verifyRecordInResults(expectedText, resultSelector);
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
  require('./ichiran/resourceScreens'),
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
