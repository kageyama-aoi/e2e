/**
 * @fileoverview コース詳細「受講生」タブ（画面内の付随一覧）列ヘッダソート検証テスト（#225）
 *
 * CSV の record（コースのレコードID）でコース詳細を開き、受講生タブの一覧を列ヘッダでソートして
 * 第1キーの並びを検証する。タブ内一覧は一覧画面と同じ部品で、表を囲む枠
 * （`div[id="studentSubpanel[swDataList]"]`）だけが違う。第2キーなし。
 *
 * 共通ランナー `support/tframe/sortTestRunner.js` の `runSortCases` を使う（ログイン1回で CSV 全ケースを検証）。
 * 並び判定の規則（列の型・空値の扱い）は `support/tframe/sortVerify.js`、
 * 表の操作は `pages/tframe/_common/SortableTable.js` を参照。
 *
 * **CSV カラム**
 * - scenario: シナリオラベル（必須）
 * - sortKey: ソート列キー（`th#swDataList[キー]` のキー）
 * - sortDir: asc / desc
 * - record: 受講生が2名以上いるコースのレコードID（環境依存のためプロファイル別 CSV に置く）
 *
 * **データソース**
 * - `data/tframe/course_detail_student_sort_data_<profile>.csv`（無いプロファイルは空の既定 CSV でスキップ）
 */
const { loadCsvWithProfile } = require('../../../support/utils');
const { runSortCases } = require('../../../support/tframe/sortTestRunner');

const cases = loadCsvWithProfile('course_detail_student_sort_data', 'tframe');

Feature('コース詳細 受講生タブ ソート検証');

Scenario('タブ内一覧の列ヘッダソートで第1キーの順に並ぶ（CSV全ケース） @admin', async ({ I, coursePage, loginKannrisyaPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  await runSortCases(I, {
    table: coursePage.studentSubpanelSortTable,
    cases,
    openCase: async (c) => coursePage.openDetailTab(c.record, '#student'),
  });
});
