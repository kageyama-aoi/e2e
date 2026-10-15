/**
 * @fileoverview 調整金一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 空条件で検索 → 結果エリアに1件以上表示される
 * - C パターン: 年度で絞り込み → 結果エリアに1件以上表示される
 *
 * **データソース**
 * - `data/tframe/chosekin_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - keijouMonthYear, keijouMonthMonth: 検索条件（任意）
 * - expectedName: 結果確認用テキスト（調整金は名前検索フィールドなし・常に空）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('chosekin_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('調整金一覧検索');

Data(csvData).Scenario('調整金一覧で検索できる @admin', async ({ I, chosekinPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  chosekinPage.navigateToListPage();

  const hasCondition = current.keijouMonthYear || current.keijouMonthMonth;
  if (hasCondition) chosekinPage.fillSearchConditions(current);

  chosekinPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('chosekin_ichiran_search', true);

  if (current.expectedName) {
    chosekinPage.verifyRecordInResults(current.expectedName);
  } else {
    chosekinPage.verifyResultsExist();
  }
});
