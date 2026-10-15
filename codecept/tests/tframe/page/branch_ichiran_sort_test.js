/**
 * @fileoverview 校舎一覧 列ヘッダソート検証テスト（#225）
 *
 * 検索条件をすべてクリア → CSV の絞り込みで検索 → 列ヘッダでソートし、1ページ目の第1キーの並びを検証する。
 * 校舎一覧には第2キーが無い（同値内の並びは不定）ため第1キーのみ。エリアは内部コード順のため連続性のみ見る。
 *
 * 共通ランナー `support/tframe/sortTestRunner.js` の `runSortCases` を使う（ログイン1回で CSV 全ケースを検証）。
 * 並び判定の規則（列の型・空値の扱い）は `support/tframe/sortVerify.js`、
 * 表の操作は `pages/tframe/_common/SortableTable.js` を参照。
 *
 * **CSV カラム**
 * - scenario: シナリオラベル（必須）
 * - sortKey: ソート列キー（`th#swDataList[キー]` のキー）
 * - sortDir: asc / desc
 * - schoolName, SchoolCode, area_area_id: 絞り込み（任意・空欄はスキップ）
 *
 * **データソース**
 * - `data/tframe/branch_ichiran_sort_data.csv`
 */
const { loadCsvWithProfile } = require('../../../support/utils');
const { runSortCases } = require('../../../support/tframe/sortTestRunner');
const { openListCase } = require('../../../pages/tframe/_common/SortableTable');

const cases = loadCsvWithProfile('branch_ichiran_sort_data', 'tframe');

Feature('校舎一覧 ソート検証');

Scenario('列ヘッダソートで第1キーの順に並ぶ（CSV全ケース） @admin', async ({ I, branchPage, loginKannrisyaPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  await runSortCases(I, {
    table: branchPage.listSortTable,
    cases,
    openCase: openListCase(branchPage),
  });
});
