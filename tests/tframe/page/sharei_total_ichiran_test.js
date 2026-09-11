/**
 * @fileoverview 講師謝礼合計一覧 一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 空条件で検索（計上年は既定=当年のまま） → 実データ行が1件以上表示される
 * - C パターン: 謝礼項目「謝礼」で絞り込み → 実データ行が1件以上表示される
 *
 * **対象画面**: `shareiTotal/sw/_default`（culture のみ）
 * **プロファイル**: culture_beta 専用（Issue #214）
 * **データソース**: `data/tframe/sharei_total_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - keijouMonthYear: 計上年（任意・select value。空なら既定の当年のまま）
 * - shareiKomoku: 謝礼項目（任意・select value。001=謝礼 等）
 * - calType: 計算区分（任意・select value。1=謝礼項目計 / 2=消費税 / 3=源泉税）
 * - expectedName: 結果確認用テキスト（空の場合は「実データ行あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('sharei_total_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('講師謝礼合計一覧検索');

Data(csvData).Scenario('講師謝礼合計一覧で検索できる @admin', async ({ I, keiriIchiranPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  keiriIchiranPage.navigateToShareiTotalListPage();
  keiriIchiranPage.fillShareiTotalSearchConditions(current);
  keiriIchiranPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('sharei_total_ichiran_search', true);

  await keiriIchiranPage.verifyResultRowsExist();
  if (current.expectedName) {
    keiriIchiranPage.verifyRecordInResults(current.expectedName);
  }
});
