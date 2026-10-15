/**
 * @fileoverview 受講生別コース一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 空条件で検索 → 結果エリアに1件以上表示される
 * - C パターン: 受講生姓で絞り込み → 特定レコードが結果に表示される
 *
 * **データソース**
 * - `data/tframe/courseBySt_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - lastName: 受講生姓検索条件（任意）
 * - courseName: コース名検索条件（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('courseBySt_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('受講生別コース一覧検索');

Data(csvData).Scenario('受講生別コース一覧で検索できる @admin', async ({ I, jukuseiPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  jukuseiPage.navigateToCourseByStListPage();

  const hasCondition = current.lastName || current.courseName;
  if (hasCondition) jukuseiPage.fillCourseByStSearchConditions(current);

  jukuseiPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('courseBySt_ichiran_search', true);

  if (current.expectedName) {
    jukuseiPage.verifyRecordInResults(current.expectedName);
  } else {
    jukuseiPage.verifyResultsExist();
  }
});
