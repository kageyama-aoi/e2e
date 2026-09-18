/**
 * @fileoverview 講師一覧 列ヘッダソート検証テスト（#225）
 *
 * 検索条件をすべてクリア（エリア・校舎・区分は「すべて」）→ CSV の絞り込みで検索 → 列ヘッダでソートし、
 * 1ページ目が「第1キー → 第2キー（更新日時の降順）」の順に並ぶことを検証する。
 * 氏名（フリガナ順）・区分（内部コード順）は表示値で順序を判定できないため、同値の連続性のみ見る。
 *
 * 共通ランナー `support/tframe/sortTestRunner.js` の `runSortCases` を使う（ログイン1回で CSV 全ケースを検証）。
 * 並び判定の規則（列の型・空値の扱い）は `support/tframe/sortVerify.js`、
 * 表の操作は `pages/tframe/_common/SortableTable.js` を参照。
 *
 * **CSV カラム**
 * - scenario: シナリオラベル（必須）
 * - sortKey: ソート列キー（`th#swDataList[キー]` のキー）
 * - sortDir: asc / desc
 * - lastName, firstName, idnumber, personStatus, school_area_id, school_branch_id: 絞り込み（任意・空欄はスキップ）
 *
 * **データソース**
 * - `data/tframe/koshi_ichiran_sort_data.csv`
 */
const { loadCsvWithProfile } = require('../../../support/utils');
const { runSortCases } = require('../../../support/tframe/sortTestRunner');
const { openListCase } = require('../../../pages/tframe/_common/SortableTable');

const cases = loadCsvWithProfile('koshi_ichiran_sort_data', 'tframe');

Feature('講師一覧 ソート検証');

Scenario('列ヘッダソートで第1キー・第2キーの順に並ぶ（CSV全ケース） @admin', async ({ I, koshiPage, loginKannrisyaPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  await runSortCases(I, {
    table: koshiPage.listSortTable,
    cases,
    openCase: openListCase(koshiPage),
  });
});
