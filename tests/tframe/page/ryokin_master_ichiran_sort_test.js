/**
 * @fileoverview 料金マスタ一覧 列ヘッダソート検証テスト（#226）
 *
 * 検索条件をすべてクリア → CSV の絞り込みで検索 → 列ヘッダでソートし、1ページ目の並びを検証する。
 * 列の型・第2キーは `pages/tframe/screens/RyokinMasterPage.js` の `listSortTable` を参照（第2キー=レコードIDの降順）。
 * 仕組みは `/tframe-ichiran-dev` 末尾「ソート検証の追加」を参照。
 *
 * juku 専用画面。ケースは juku_beta 用 CSV にのみ置く（他プロファイルはケース0件でスキップ）。
 *
 * **CSV カラム**: scenario, sortKey, sortDir ＋ 絞り込み（name。空欄はスキップ）
 *
 * **データソース**
 * - `data/tframe/ryokin_master_ichiran_sort_data.csv`
 */
const { loadCsvWithProfile } = require('../../../support/utils');
const { runSortCases } = require('../../../support/tframe/sortTestRunner');
const { openListCase } = require('../../../pages/tframe/_common/SortableTable');

const cases = loadCsvWithProfile('ryokin_master_ichiran_sort_data', 'tframe');

Feature('料金マスタ一覧 ソート検証');

Scenario('列ヘッダソートで指定順に並ぶ（CSV全ケース） @admin', async ({ I, ryokinMasterPage, loginKannrisyaPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  await runSortCases(I, { table: ryokinMasterPage.listSortTable, cases, openCase: openListCase(ryokinMasterPage) });
});
