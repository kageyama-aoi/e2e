'use strict';

/**
 * @fileoverview shimamura メニュー巡回 Page Object（#251 Phase 1）
 *
 * `menuSnapshot/testgcp.json`（実機採取の全メニュー）を元に、
 * 「アイコンの画面を開く → 折りたたみグループを展開 → サイドバーのリンクを押す → 開けたか確認」を行う。
 * 画面固有の操作は持たない。全画面に最薄の下地（開ける・エラーが出ない）を付けるためのもの。
 *
 * 併せて、開いた画面が IchiranPage の「標準一覧」形式（検索ボタン input[name="search"]）かを記録する
 * （バケットA の画面を STANDARD_SCREENS に1エントリ足すだけで済むかの判定材料）。
 */

const { I } = inject();
const { toggleGroupmenu, sidebarLinkXPath } = require('../../../support/shimamura/utils');
const { TIMEOUTS, SELECTORS, BASE_URL } = require('../../../support/shimamura/constants');
const snapshot = require('./menuSnapshot/testgcp.json');

/** 業務でほぼ使わないため巡回のみとするアイコン（計画書 バケットE） */
const BUCKET_E_ICONS = ['Calendar', 'Emails', 'SMSReports', 'SMSHelp', 'Administration'];

/**
 * route（`Module/action?k=v`）を BASE_URL 相対の URL に戻す（アイコン画面を開く用）
 * @param {string} route
 * @returns {string}
 */
function routeToUrl(route) {
  const [ma, query] = route.split('?');
  const [module, action] = ma.split('/');
  return `index.php?module=${module}&action=${action}${query ? `&${query}` : ''}&top_menu=1`;
}

module.exports = {

  BUCKET_E_ICONS,

  /**
   * 巡回対象のアイコン一覧（サイドバーがあり、index.php 画面の項目を1件以上持つもの）
   * @returns {Array<{iconKey: string, iconLabel: string, iconRoute: string, items: Array<{group: string, toggleId: (string|null), label: string, route: string}>}>}
   */
  listPatrolIcons() {
    return Object.entries(snapshot.sideMenu)
      .map(([iconKey, icon]) => ({
        iconKey,
        iconLabel: icon.iconLabel,
        iconRoute: icon.iconRoute,
        items: icon.groups.flatMap((g) => g.items
          .filter((it) => /^[A-Za-z]+\//.test(it.route)) // PDF 等の index.php 以外は除外
          .map((it) => ({ group: g.name, toggleId: g.toggleId || null, label: it.label, route: it.route }))),
      }))
      .filter((icon) => icon.items.length > 0);
  },

  /**
   * アイコンの画面（モジュール TOP）を開く
   * @param {string} iconRoute
   */
  openIcon(iconRoute) {
    I.amOnPage(BASE_URL + routeToUrl(iconRoute));
    I.waitForElement('#leftCol', TIMEOUTS.ELEMENT);
  },

  /**
   * サイドバーから1項目を開く（折りたたみグループなら先に展開）
   * @param {{group: string, toggleId: (string|null), label: string}} item
   */
  async clickSidebarItem(item) {
    if (item.toggleId) {
      await toggleGroupmenu(I, { icon_id: item.toggleId, menuname: item.group });
    }
    I.say(`【巡回】${item.group} > ${item.label}`);
    I.click(locate(sidebarLinkXPath(item.label)).first());
    I.waitForElement('body', TIMEOUTS.ELEMENT);
  },

  /**
   * 開いた画面を確認する。shimamura のエラー表示・PHP エラー・遷移先 module 不一致を検出したら例外。
   * @param {{label: string, route: string}} item
   * @returns {Promise<{url: string, standardList: boolean}>} 遷移先 URL と「標準一覧」形式かどうか
   */
  async verifyOpened(item) {
    const info = await I.executeScript((errSel) => {
      const errEl = document.querySelector(errSel);
      const bodyText = document.body ? document.body.innerText : '';
      return {
        url: location.href,
        appError: errEl ? errEl.innerText.trim() : '',
        phpError: (/(Fatal error|Parse error|Warning|Notice):\s.*on line \d+/.exec(bodyText) || [''])[0],
        standardList: !!document.querySelector('input[name="search"]'),
      };
    }, SELECTORS.ERROR_CONTAINER);

    const problems = [];
    if (info.appError) problems.push(`画面エラー: ${info.appError}`);
    if (info.phpError) problems.push(`PHPエラー: ${info.phpError}`);
    const expectedModule = item.route.split('/')[0];
    if (!new URL(info.url).searchParams.get('module')) {
      problems.push(`module 不明の URL に遷移: ${info.url}`);
    } else if (new URL(info.url).searchParams.get('module') !== expectedModule) {
      // 同じ画面を別 module 名で出すリンクもあるため、不一致は警告に留める
      I.say(`  ⚠ module 不一致（期待 ${expectedModule}）: ${info.url}`);
    }
    if (problems.length) throw new Error(`${item.label}: ${problems.join(' / ')}`);
    return { url: info.url, standardList: info.standardList };
  },
};
