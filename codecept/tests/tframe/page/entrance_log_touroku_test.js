/**
 * @fileoverview 入退記録編集（新規登録）テスト
 *
 * **テスト内容**
 * - 管理者ログイン後、入退記録編集画面で受講生ポップアップから先頭の結果を選択し
 *   フォームを入力して新規登録する
 *
 * **対象画面**: `entranceLog/ew/_default`（juku のみ）
 * **データソース**: `data/tframe/entrance_log_touroku_data.csv`
 *
 * **CSV カラム一覧**
 * - 必須: cardInputDate（入退日時）
 * - 任意: school_area_id, school_branch_id
 * - 受講生はポップアップの既定の絞り込みで表示される先頭の結果を選ぶ（`selectEntranceLogStudent`。#216）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('entrance_log_touroku_data', 'tframe'),
  () => '先頭の受講生を選択'
);

Feature('入退記録編集');

Data(csvData).Scenario('管理者ログイン後に入退記録を新規登録できる @admin', async ({ I, loginKannrisyaPage, calendarPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  calendarPage.navigateToEntranceLogRegisterPage();
  calendarPage.selectEntranceLogStudent();
  calendarPage.fillEntranceLogForm(current);
  I.saveScreenshotWithTimestamp('entrance_log_touroku_input', true);

  await calendarPage.submitEntranceLogForm();
  I.saveScreenshotWithTimestamp('entrance_log_touroku_saved', true);
});
