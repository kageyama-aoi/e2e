/**
 * @fileoverview コース別受講生一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 空条件で検索 → 結果エリアに1件以上表示される
 * - C パターン: コース名で絞り込み → 特定レコードが結果に表示される
 *
 * **データソース**
 * - `data/tframe/stByCourse_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - courseName: コース名検索条件（任意）
 * - lastName: 受講生姓検索条件（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('stByCourse_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('コース別受講生一覧検索');

Data(csvData).Scenario('コース別受講生一覧で検索できる @admin', async ({ I, jukuseiPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  jukuseiPage.navigateToStByCourseListPage();

  const hasCondition = current.courseName || current.lastName;
  if (hasCondition) jukuseiPage.fillStByCourseSearchConditions(current);

  jukuseiPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('stByCourse_ichiran_search', true);

  if (current.expectedName) {
    jukuseiPage.verifyRecordInResults(current.expectedName);
  } else {
    jukuseiPage.verifyResultsExist();
  }
});
