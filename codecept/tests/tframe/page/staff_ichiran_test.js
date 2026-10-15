/**
 * @fileoverview スタッフ一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 空条件で検索 → 結果エリアに1件以上表示される
 * - C パターン: 姓で絞り込み → 特定レコードが結果に表示される
 *
 * **データソース**
 * - `data/tframe/staff_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - lastName: 検索条件（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('staff_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('スタッフ一覧検索');

Data(csvData).Scenario('スタッフ一覧で検索できる @admin', async ({ I, staffPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  staffPage.navigateToListPage();

  const hasCondition = current.lastName;
  if (hasCondition) staffPage.fillSearchConditions(current);

  staffPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('staff_ichiran_search', true);

  if (current.expectedName) {
    staffPage.verifyRecordInResults(current.expectedName);
  } else {
    staffPage.verifyResultsExist();
  }
});
