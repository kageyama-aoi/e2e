/**
 * @fileoverview shimamura 受講生別クラス一覧検索テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果エリアに1件以上表示される
 * - 店舗で絞り込み
 *
 * **データソース**
 * - `data/shimamura/classes_by_student_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario    : シナリオラベル（必須）
 * - school_id   : 店舗（select の表示名）（任意）
 * - genjukousha : 現受講者（select の値。例: current）（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('classes_by_student_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('受講生別クラス一覧検索');

Before(beforeShimamura);

Data(csvData).Scenario('受講生別クラス一覧で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToClassesByStudentPage();

  const hasCondition = current.school_id || current.genjukousha;
  if (hasCondition) ichiranPageShimamura.fillClassesByStudentSearchConditions(current);

  ichiranPageShimamura.clickClassesByStudentSearchAndWait();
  I.saveScreenshotWithTimestamp('classes_by_student_ichiran_search', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyClassesByStudentRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyClassesByStudentResultsExist();
  }
});
