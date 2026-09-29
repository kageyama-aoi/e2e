/**
 * @fileoverview shimamura メモ一覧（受講生）検索テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果エリアに1件以上表示される
 * - タイトルで絞り込み → 対象者が結果に表示される
 *
 * **データソース**
 * - `data/shimamura/student_memo_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario    : シナリオラベル（必須）
 * - name        : タイトル（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('student_memo_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('メモ一覧（受講生）検索');

Before(beforeShimamura);

Data(csvData).Scenario('メモ一覧（受講生）で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToStudentMemoListPage();

  const hasCondition = current.name;
  if (hasCondition) ichiranPageShimamura.fillStudentMemoSearchConditions(current);

  ichiranPageShimamura.clickStudentMemoSearchAndWait();
  I.saveScreenshotWithTimestamp('student_memo_ichiran_search', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyStudentMemoRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyStudentMemoResultsExist();
  }
});
