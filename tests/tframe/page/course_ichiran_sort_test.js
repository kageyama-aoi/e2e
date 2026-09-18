/**
 * @fileoverview コース一覧 列ヘッダソート検証テスト（#223 #224 #225）
 *
 * 検索条件をすべてクリア（エリア・校舎は「すべて」）→ CSV の絞り込みで検索 → 列ヘッダでソートし、
 * 1ページ目が「第1キー → 第2キー（レコードID昇順）」の順に並ぶことを検証する。
 *
 * 共通ランナー `support/tframe/sortTestRunner.js` の `runSortCases` を使う（ログイン1回で CSV 全ケースを検証）。
 * 並び判定の規則（列の型・空値の扱い）は `support/tframe/sortVerify.js`、
 * 表の操作は `pages/tframe/_common/SortableTable.js` を参照。
 *
 * **CSV カラム**
 * - scenario: シナリオラベル（必須）
 * - sortKey: ソート列キー（`th#swDataList[キー]` のキー）
 * - sortDir: asc / desc
 * - name, code, courseCategory, nendoYear, school_area_id, school_branch_id: 絞り込み（任意・空欄はスキップ）
 *   - プルダウンは値（例: `a1`）と表示名（例: `関東`）のどちらでも指定できる
 *   - 第1キーを全行同値にする絞り込み（例: 年度で絞って年度ソート）なら第2キーを全行で検証できる
 *
 * **データソース**
 * - `data/tframe/course_ichiran_sort_data.csv`
 */
const { loadCsvWithProfile } = require('../../../support/utils');
const { runSortCases } = require('../../../support/tframe/sortTestRunner');
const { openListCase } = require('../../../pages/tframe/_common/SortableTable');

const cases = loadCsvWithProfile('course_ichiran_sort_data', 'tframe');

Feature('コース一覧 ソート検証');

Scenario('列ヘッダソートで第1キー・第2キーの順に並ぶ（CSV全ケース） @admin', async ({ I, coursePage, loginKannrisyaPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  await runSortCases(I, {
    table: coursePage.listSortTable,
    cases,
    openCase: openListCase(coursePage),
  });
});
