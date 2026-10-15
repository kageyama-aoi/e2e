/**
 * @fileoverview コース一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 空条件で検索 → 結果エリアに1件以上表示される
 * - C パターン: コース名で絞り込み → 特定レコードが結果に表示される
 *
 * **データソース**
 * - `data/tframe/course_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - name, courseCategory, nendoYear, school_area_id, school_branch_id: 検索条件（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('course_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('コース一覧検索');

Data(csvData).Scenario('コース一覧で検索できる @admin', async ({ I, coursePage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  coursePage.navigateToListPage();

  const hasCondition = current.name || current.courseCategory || current.nendoYear ||
    current.school_area_id || current.school_branch_id;
  if (hasCondition) coursePage.fillSearchConditions(current);

  coursePage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('course_ichiran_search', true);

  if (current.expectedName) {
    coursePage.verifyRecordInResults(current.expectedName);
  } else {
    coursePage.verifyResultsExist();
  }
});
