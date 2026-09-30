/**
 * @fileoverview shimamura 講師別受講生一覧検索テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果エリアに1件以上表示される
 * - クラス名で絞り込み → 該当クラスが結果に表示される
 *
 * **データソース**
 * - `data/shimamura/teacher_student_list_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario    : シナリオラベル（必須）
 * - last_name   : 講師の姓（任意）
 * - first_name  : 講師の名（任意）
 * - name        : クラス名（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('teacher_student_list_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('講師別受講生一覧検索');

Before(beforeShimamura);

Data(csvData).Scenario('講師別受講生一覧で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToTeacherStudentListPage();

  const hasCondition = current.last_name || current.first_name || current.name;
  if (hasCondition) ichiranPageShimamura.fillTeacherStudentListSearchConditions(current);

  ichiranPageShimamura.clickTeacherStudentListSearchAndWait();
  I.saveScreenshotWithTimestamp('teacher_student_list_ichiran_search', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyTeacherStudentListRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyTeacherStudentListResultsExist();
  }
});
