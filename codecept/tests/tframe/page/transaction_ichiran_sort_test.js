/**
 * @fileoverview 入出金一覧 列ヘッダソート検証テスト（#226）
 *
 * 検索条件をすべてクリア → CSV の絞り込みで検索 → 列ヘッダでソートし、1ページ目の並びを検証する。
 * 列の型・第2キーは `pages/tframe/screens/KeiriIchiranPage.js` の `transactionSortTable` を参照（第2キーなし）。
 * 仕組みは `/tframe-ichiran-dev` 末尾「ソート検証の追加」を参照。
 *
 * 日付レンジは既定が当月のため CSV の dateFrom / dateTo で広げる。
 *
 * **CSV カラム**: scenario, sortKey, sortDir ＋ 絞り込み（dateFrom、dateTo、lastName。空欄はスキップ）
 *
 * **データソース**
 * - `data/tframe/transaction_ichiran_sort_data.csv`
 */
const { loadCsvWithProfile } = require('../../../support/utils');
const { runSortCases } = require('../../../support/tframe/sortTestRunner');
const { openListCase } = require('../../../pages/tframe/_common/SortableTable');

const cases = loadCsvWithProfile('transaction_ichiran_sort_data', 'tframe');

Feature('入出金一覧 ソート検証');

Scenario('列ヘッダソートで指定順に並ぶ（CSV全ケース） @admin', async ({ I, keiriIchiranPage, loginKannrisyaPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  await runSortCases(I, { table: keiriIchiranPage.transactionSortTable, cases, openCase: openListCase(keiriIchiranPage, { navigate: 'navigateToTransactionListPage', fill: 'fillTransactionSearchConditions' }) });
});
