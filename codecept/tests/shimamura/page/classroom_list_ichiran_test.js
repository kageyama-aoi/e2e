/**
 * @fileoverview shimamura 部屋一覧検索テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果エリアに1件以上表示される
 * - 店舗で絞り込み → その店舗の部屋が結果に表示される
 *
 * **データソース**
 * - `data/shimamura/classroom_list_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario    : シナリオラベル（必須）
 * - name        : 名称（任意）
 * - school_id   : 店舗（select の表示名）（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('classroom_list_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('部屋一覧検索');

Before(beforeShimamura);

Data(csvData).Scenario('部屋一覧で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToClassroomListPage();

  const hasCondition = current.name || current.school_id;
  if (hasCondition) ichiranPageShimamura.fillClassroomListSearchConditions(current);

  ichiranPageShimamura.clickClassroomListSearchAndWait();
  I.saveScreenshotWithTimestamp('classroom_list_ichiran_search', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyClassroomListRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyClassroomListResultsExist();
  }
});
