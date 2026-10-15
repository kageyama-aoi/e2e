/**
 * @fileoverview 翌月月謝一括作成 一括処理テスト
 *
 * **テスト内容**
 * - 既定の対象年月・校舎で一括作成を実行し、結果メッセージが許容範囲内であることを確認する。
 *   画面ツールチップに「あらかじめ翌月の月謝が作成されている場合、二重で作成されることはありません」
 *   とある通り冪等な処理のため、初回は「〜作成しました」（成功）、既に作成済みの再実行は
 *   「処理対象の月謝情報がありません。」（`tf-message-error` クラスだが実質は正常系）を返す。
 *   `verifyBulkActionResult`（support/tframe/utils.js）はこの両方を許容する。
 *
 * **対象画面**: `smsFee/ew/tuitionFeeBulkCreate`
 * **プロファイル**: culture_beta / juku_beta 両対応（Issue #219）
 * **データソース**: `data/tframe/tuition_fee_bulk_create_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - targetYearMonth: 対象年月（任意・select value。空なら既定値のまま）
 * - school_area_id / school_branch_id: 校舎（任意・select value。空なら既定値のまま）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('tuition_fee_bulk_create_data', 'tframe'),
  (row) => row.scenario
);

Feature('翌月月謝一括作成');

Data(csvData).Scenario('翌月月謝一括作成を実行できる @admin', async ({ I, keiriIchiranPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  keiriIchiranPage.navigateToTuitionFeeBulkCreatePage();
  keiriIchiranPage.fillTuitionFeeBulkCreateConditions(current);
  await keiriIchiranPage.clickTuitionFeeBulkCreateAndVerify();
  I.saveScreenshotWithTimestamp('tuition_fee_bulk_create', true);
});
