/**
 * @fileoverview 校舎一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 空条件で検索 → 結果エリアに1件以上表示される
 * - C パターン: 校舎名で絞り込み → 特定レコードが結果に表示される
 *
 * **データソース**
 * - `data/tframe/branch_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - schoolName: 検索条件（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('branch_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('校舎一覧検索');

Data(csvData).Scenario('校舎一覧で検索できる @admin', async ({ I, branchPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  branchPage.navigateToListPage();

  const hasCondition = current.schoolName || current.SchoolCode || current.area_area_id;
  if (hasCondition) branchPage.fillSearchConditions(current);

  branchPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('branch_ichiran_search', true);

  if (current.expectedName) {
    branchPage.verifyRecordInResults(current.expectedName);
  } else {
    branchPage.verifyResultsExist();
  }
});
