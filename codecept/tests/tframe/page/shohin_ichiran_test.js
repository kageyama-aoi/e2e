/**
 * @fileoverview 商品一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 空条件で検索 → 結果エリアに1件以上表示される
 * - C パターン: 商品名で絞り込み → 特定レコードが結果に表示される
 *
 * **データソース**
 * - `data/tframe/shohin_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - name: 検索条件（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('shohin_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('商品一覧検索');

Data(csvData).Scenario('商品一覧で検索できる @admin', async ({ I, shohinPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  shohinPage.navigateToListPage();

  const hasCondition = current.name;
  if (hasCondition) shohinPage.fillSearchConditions(current);

  shohinPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('shohin_ichiran_search', true);

  if (current.expectedName) {
    shohinPage.verifyRecordInResults(current.expectedName);
  } else {
    shohinPage.verifyResultsExist();
  }
});
