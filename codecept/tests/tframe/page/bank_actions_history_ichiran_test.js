/**
 * @fileoverview 口座振替データ履歴 一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 空条件で検索 → 結果エリアに実データ行が1件以上表示される
 * - C パターン: 読込/作成を「作成」で絞り込み → 実データ行が1件以上表示される
 *
 * **対象画面**: `bankActionsHistory/sw/_default`
 * **プロファイル**: culture_beta 主対象（Issue #213）
 * **データソース**: `data/tframe/bank_actions_history_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - inputType: 読込/作成（任意・select value。export=作成 / import=読込）
 * - expectedName: 結果確認用テキスト（空の場合は「実データ行あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('bank_actions_history_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('口座振替データ履歴一覧検索');

Data(csvData).Scenario('口座振替データ履歴で検索できる @admin', async ({ I, keiriIchiranPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  keiriIchiranPage.navigateToBankActionsHistoryListPage();
  keiriIchiranPage.fillBankActionsHistorySearchConditions(current);
  keiriIchiranPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('bank_actions_history_ichiran_search', true);

  await keiriIchiranPage.verifyResultRowsExist();
  if (current.expectedName) {
    keiriIchiranPage.verifyRecordInResults(current.expectedName);
  }
});
