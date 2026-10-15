/**
 * @fileoverview 料金マスタ一覧検索テスト
 *
 * ※ juku_test 環境のみ対応
 *
 * **テスト内容**
 * - B パターン: 空条件で検索 → 結果エリアに1件以上表示される
 * - C パターン: 名前で絞り込み → 特定レコードが結果に表示される
 *
 * **データソース**
 * - `data/tframe/ryokin_master_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - name: 検索条件（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('ryokin_master_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('料金マスタ一覧検索');

Data(csvData).Scenario('料金マスタ一覧で検索できる @admin', async ({ I, ryokinMasterPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  ryokinMasterPage.navigateToListPage();

  const hasCondition = current.name;
  if (hasCondition) ryokinMasterPage.fillSearchConditions(current);

  ryokinMasterPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('ryokin_master_ichiran_search', true);

  if (current.expectedName) {
    ryokinMasterPage.verifyRecordInResults(current.expectedName);
  } else {
    ryokinMasterPage.verifyResultsExist();
  }
});
