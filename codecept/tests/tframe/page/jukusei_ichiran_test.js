/**
 * @fileoverview 受講生一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 空条件で検索 → 結果エリアに1件以上表示される
 * - C パターン: 姓などで絞り込み → 特定レコードが結果に表示される
 *
 * **データソース**
 * - `data/tframe/jukusei_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - lastName, firstName, idnumber, personStatus, school_area_id, school_branch_id: 検索条件（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('jukusei_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('受講生一覧検索');

Data(csvData).Scenario('受講生一覧で検索できる @admin', async ({ I, jukuseiPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  jukuseiPage.navigateToListPage();

  const hasCondition = current.lastName || current.firstName || current.idnumber ||
    current.personStatus || current.school_area_id || current.school_branch_id;
  if (hasCondition) jukuseiPage.fillSearchConditions(current);

  jukuseiPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('jukusei_ichiran_search', true);

  if (current.expectedName) {
    jukuseiPage.verifyRecordInResults(current.expectedName);
  } else {
    jukuseiPage.verifyResultsExist();
  }
});
