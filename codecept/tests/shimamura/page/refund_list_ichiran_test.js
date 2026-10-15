/**
 * @fileoverview shimamura 返金一覧検索テスト
 *
 * **テスト内容**
 * - 請求月だけで検索 → 結果に1件以上表示される
 * - 請求月＋会員番号で絞り込み → 該当受講生が結果に表示される
 *
 * **注意**
 * - 請求月の既定は来月で、空にしても「すべて」にならず今月扱いになる。月が変わると件数が変わるため、
 *   CSV の全行で実データのある月（2026-10）を固定で渡す
 *
 * **データソース**
 * - `data/shimamura/refund_list_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario    : シナリオラベル（必須）
 * - claim_month : 請求月（YYYY-MM-01・全行必須）
 * - idnumber    : 会員番号（任意）
 * - last_name   : 姓（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('refund_list_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('返金一覧検索');

Before(beforeShimamura);

Data(csvData).Scenario('返金一覧で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToRefundListPage();

  const hasCondition = current.claim_month || current.idnumber || current.last_name;
  if (hasCondition) ichiranPageShimamura.fillRefundListSearchConditions(current);

  ichiranPageShimamura.clickRefundListSearchAndWait();
  I.saveScreenshotWithTimestamp('refund_list_ichiran_search', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyRefundListRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyRefundListResultsExist();
  }
});
