/**
 * @fileoverview コース別商品一覧検索テスト（culture_beta のみ）
 *
 * **テスト内容**
 * - B パターン: 空条件で検索 → 結果エリアに1件以上表示される
 * - C パターン: 商品名で絞り込み → 結果エリアに1件以上表示される
 *
 * **データソース**
 * - `data/tframe/proByCourse_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - name: コース名で絞り込み（任意）
 * - productName: 商品名で絞り込み（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('proByCourse_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('コース別商品一覧検索');

Data(csvData).Scenario('コース別商品一覧で検索できる @admin', async ({ I, coursePage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  coursePage.navigateToProByCourseListPage();

  const hasCondition = current.name || current.productName;
  if (hasCondition) coursePage.fillProByCourseSearchConditions(current);

  coursePage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('proByCourse_ichiran_search', true);

  if (current.expectedName) {
    coursePage.verifyRecordInResults(current.expectedName);
  } else {
    coursePage.verifyResultsExist();
  }
});
