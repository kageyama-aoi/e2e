/**
 * @fileoverview 連絡一覧 一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 全期間・空条件で検索 → 検索結果テーブルが描画される
 *   （実機確認時点でこの環境には連絡データが1件も無く、実データ行の存在までは確認できない。
 *   `verifyResultsExist`（thead行にもマッチする弱いチェック）を使う。データが投入された環境では
 *   `verifyResultRowsExist` 相当への差し替えを検討する）
 *
 * **対象画面**: `contact/sw/_default`（juku のみ）
 * **プロファイル**: juku_beta 専用（Issue #214）
 * **データソース**: `data/tframe/contact_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - lastName: 受講生姓での絞り込み（任意）
 * - courseCategory: コースカテゴリ（任意・select value）
 * - status: 開封状態（任意・select value。0=未開封 / 1=開封済）
 * - scheduleDateFrom / scheduleDateTo: スケジュール開始日レンジ（既定が「本日」のみのため広げる）
 * - createdDateFrom / createdDateTo: 作成日レンジ（既定が「本日」のみのため広げる）
 *   **注意**: スケジュール開始日・作成日は「どちらか一方は7日以内」というバリデーションがあり、
 *   両方を広い範囲にすると検索が拒否される（結果テーブルが描画されずタイムアウト）。
 *   本CSVはスケジュール開始日のみ広げ、作成日は未指定（既定=当日）のままにしている。
 * - expectedName: 結果確認用テキスト（未使用。データ不在のため空のまま運用）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('contact_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('連絡一覧検索');

Data(csvData).Scenario('連絡一覧で検索できる @admin', async ({ I, emailIchiranPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  emailIchiranPage.navigateToContactListPage();
  emailIchiranPage.fillContactSearchConditions(current);
  emailIchiranPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('contact_ichiran_search', true);

  emailIchiranPage.verifyResultsExist();
  if (current.expectedName) {
    emailIchiranPage.verifyRecordInResults(current.expectedName);
  }
});
