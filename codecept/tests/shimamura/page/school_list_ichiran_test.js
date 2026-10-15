/**
 * @fileoverview shimamura 店舗一覧検索テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果エリアに1件以上表示される
 * - 店舗名で絞り込み → 該当店舗が結果に表示される
 *
 * **データソース**
 * - `data/shimamura/school_list_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario    : シナリオラベル（必須）
 * - name        : 店舗名（任意）
 * - area_id     : エリア（select の表示名）（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('school_list_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('店舗一覧検索');

Before(beforeShimamura);

Data(csvData).Scenario('店舗一覧で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToSchoolListPage();

  const hasCondition = current.name || current.area_id;
  if (hasCondition) ichiranPageShimamura.fillSchoolListSearchConditions(current);

  ichiranPageShimamura.clickSchoolListSearchAndWait();
  I.saveScreenshotWithTimestamp('school_list_ichiran_search', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifySchoolListRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifySchoolListResultsExist();
  }
});
