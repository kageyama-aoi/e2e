/**
 * @fileoverview 講師別受講生一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 空条件で検索 → 結果エリアに1件以上表示される
 * - C パターン: 講師の姓で絞り込み → 特定レコードが結果に表示される
 *
 * **データソース**
 * - `data/tframe/teByStudent_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - lastName: 講師の姓検索条件（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('teByStudent_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('講師別受講生一覧検索');

Data(csvData).Scenario('講師別受講生一覧で検索できる @admin', async ({ I, koshiPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  koshiPage.navigateToTeByStudentListPage();

  const hasCondition = current.lastName;
  if (hasCondition) koshiPage.fillTeByStudentSearchConditions(current);

  koshiPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('teByStudent_ichiran_search', true);

  if (current.expectedName) {
    koshiPage.verifyRecordInResults(current.expectedName);
  } else {
    koshiPage.verifyResultsExist();
  }
});
