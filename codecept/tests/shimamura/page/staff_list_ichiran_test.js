/**
 * @fileoverview shimamura スタッフ一覧検索テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果エリアに1件以上表示される
 * - 姓で絞り込み → 該当スタッフが結果に表示される
 *
 * **データソース**
 * - `data/shimamura/staff_list_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario    : シナリオラベル（必須）
 * - last_name   : 姓（任意）
 * - first_name  : 名（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('staff_list_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('スタッフ一覧検索');

Before(beforeShimamura);

Data(csvData).Scenario('スタッフ一覧で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToStaffListPage();

  const hasCondition = current.last_name || current.first_name;
  if (hasCondition) ichiranPageShimamura.fillStaffListSearchConditions(current);

  ichiranPageShimamura.clickStaffListSearchAndWait();
  I.saveScreenshotWithTimestamp('staff_list_ichiran_search', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyStaffListRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyStaffListResultsExist();
  }
});
