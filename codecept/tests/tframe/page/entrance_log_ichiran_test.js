/**
 * @fileoverview 入退記録一覧 一覧検索テスト
 *
 * **テスト内容**
 * - B パターン: 全期間・空条件で検索 → 実データ行が1件以上表示される
 *
 * **対象画面**: `entranceLog/sw/_default`（juku のみ）
 * **プロファイル**: juku_beta 専用（Issue #214）
 * **データソース**: `data/tframe/entrance_log_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - dateFrom / dateTo: 入退日時レンジ（既定が「本日」のみのため広げる。YYYY-MM-DD HH:mm）
 * - lastName: 受講生姓での絞り込み（任意）
 * - school_area_id / school_branch_id: 校舎（任意。空なら既定の「関東」のまま）
 * - expectedName: 結果確認用テキスト（空の場合は「実データ行あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('entrance_log_ichiran_search_data', 'tframe'),
  (row) => row.scenario
);

Feature('入退記録一覧検索');

Data(csvData).Scenario('入退記録一覧で検索できる @admin', async ({ I, calendarPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  calendarPage.navigateToEntranceLogListPage();
  calendarPage.fillEntranceLogSearchConditions(current);
  calendarPage.clickSearchAndWait();
  I.saveScreenshotWithTimestamp('entrance_log_ichiran_search', true);

  await calendarPage.verifyEntranceLogResultRowsExist();
  if (current.expectedName) {
    calendarPage.verifyRecordInResults(current.expectedName);
  }
});
