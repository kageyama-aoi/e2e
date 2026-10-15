/**
 * @fileoverview 対応履歴一覧検索テスト（受講生・講師）
 *
 * **テスト内容**
 * - 受講生メニュー（menuModule=student）: 空検索 / 件名で絞り込み
 * - 講師メニュー（menuModule=teacher）: 空検索 / 件名で絞り込み
 *
 * **データソース**
 * - `data/tframe/infoHistory_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - menuModule: student または teacher
 * - name: 件名で絞り込み（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('infoHistory_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('対応履歴一覧検索');

Data(csvData).Scenario('対応履歴一覧で検索できる @admin', async ({ I, infoHistoryPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  infoHistoryPage.navigateToListPage(current.menuModule);

  const hasCondition = current.name;
  if (hasCondition) infoHistoryPage.fillSearchConditions(current);

  infoHistoryPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('infoHistory_ichiran_search', true);

  if (current.expectedName) {
    infoHistoryPage.verifyRecordInResults(current.expectedName);
  } else {
    infoHistoryPage.verifyResultsExist();
  }
});
