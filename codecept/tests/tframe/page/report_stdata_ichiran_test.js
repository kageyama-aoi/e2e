/**
 * @fileoverview 受講生データ組合せレポート 一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 既定（都道府県）で検索 → 組合せ集計表に実データ行が1件以上表示される
 * - C パターン: 組合せ項目を「学年」に変えて検索 → 実データ行が1件以上表示される
 *
 * **対象画面**: `report/sw/stDataCombinedReport`
 * **プロファイル**: culture_beta 主対象（Issue #212。juku_beta でも可）
 * **データソース**: `data/tframe/report_stdata_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - searchItems: 組合せ項目（任意・select value。primary_address_state / grade / gender など）
 * - personStatus: 受講生ステイタス（任意・select value。空選択肢が無いため未指定なら既定「受講生」）
 * - expectedName: 結果確認用テキスト（空の場合は「実データ行あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('report_stdata_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('受講生データ組合せレポート一覧検索');

Data(csvData).Scenario('受講生データ組合せレポートで検索できる @admin', async ({ I, reportIchiranPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  reportIchiranPage.navigateToStDataCombinedListPage();
  reportIchiranPage.fillStDataCombinedSearchConditions(current);
  reportIchiranPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('report_stdata_ichiran_search', true);

  await reportIchiranPage.verifyResultRowsExist();
  if (current.expectedName) {
    reportIchiranPage.verifyRecordInResults(current.expectedName);
  }
});
