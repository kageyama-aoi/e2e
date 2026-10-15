/**
 * @fileoverview アカウント一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 空条件で検索 → 結果エリアに1件以上表示される
 * - C パターン: 法人名で絞り込み → 特定レコードが結果に表示される
 *
 * **データソース**
 * - `data/tframe/account_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - name: 検索条件（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('account_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('アカウント一覧検索');

Data(csvData).Scenario('アカウント一覧で検索できる @admin', async ({ I, accountPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  accountPage.navigateToListPage();

  const hasCondition = current.name || current.idnumber;
  if (hasCondition) accountPage.fillSearchConditions(current);

  accountPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('account_ichiran_search', true);

  if (current.expectedName) {
    accountPage.verifyRecordInResults(current.expectedName);
  } else {
    accountPage.verifyResultsExist();
  }
});
