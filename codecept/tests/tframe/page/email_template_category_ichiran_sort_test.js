/**
 * @fileoverview Eメールテンプレートカテゴリ一覧 列ヘッダソート検証テスト（#226）
 *
 * 検索条件をすべてクリア → CSV の絞り込みで検索 → 列ヘッダでソートし、1ページ目の並びを検証する。
 * 列の型・第2キーは `pages/tframe/screens/EmailIchiranPage.js` の `templateCategorySortTable` を参照（第2キー=更新日時の降順）。
 * 仕組みは `/tframe-ichiran-dev` 末尾「ソート検証の追加」を参照。
 *
 * **CSV カラム**: scenario, sortKey, sortDir ＋ 絞り込み（name。任意・空欄はスキップ）
 *
 * **データソース**
 * - `data/tframe/email_template_category_ichiran_sort_data.csv`
 */
const { loadCsvWithProfile } = require('../../../support/utils');
const { runSortCases } = require('../../../support/tframe/sortTestRunner');
const { openListCase } = require('../../../pages/tframe/_common/SortableTable');

const cases = loadCsvWithProfile('email_template_category_ichiran_sort_data', 'tframe');

Feature('Eメールテンプレートカテゴリ一覧 ソート検証');

Scenario('列ヘッダソートで指定順に並ぶ（CSV全ケース） @admin', async ({ I, emailIchiranPage, loginKannrisyaPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  await runSortCases(I, { table: emailIchiranPage.templateCategorySortTable, cases, openCase: openListCase(emailIchiranPage, { navigate: 'navigateToTemplateCategoryListPage', fill: 'fillTemplateCategorySearchConditions' }) });
});
