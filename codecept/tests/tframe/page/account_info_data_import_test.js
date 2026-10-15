/**
 * @fileoverview 口座情報データ取込 ガード確認テスト
 *
 * **テスト内容**
 * - ファイル未選択、およびタイトル行（ヘッダー）が一致しないCSVを投入したときの
 *   ガードメッセージを確認する。正しいヘッダー仕様は未調査のため、実際の口座情報取込
 *   （実データ更新）はテスト対象外とする（Issue #220）。
 *
 * **対象画面**: `student/ew/accountInfoDataImport`（juku_beta のみ）
 * **プロファイル**: juku_beta 専用（`TFRAME_LANGUAGE=en` のため画面は常に英語表示）
 * **データソース**: `data/tframe/account_info_data_import_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - filePath: 取込ファイルのパス（空なら未選択のまま実行）
 * - expectedMessage: 期待するガードメッセージの部分文字列（juku_beta は常に英語UIのため英語表記）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('account_info_data_import_data', 'tframe'),
  (row) => row.scenario
);

Feature('口座情報データ取込');

Data(csvData).Scenario('口座情報データ取込のガードメッセージを確認できる @admin', ({ I, jukuseiPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  jukuseiPage.navigateToAccountInfoDataImportPage();
  jukuseiPage.selectAccountInfoDataImportFile(current);
  jukuseiPage.clickAccountInfoDataImportAndVerify(current.expectedMessage);
  I.saveScreenshotWithTimestamp('account_info_data_import', true);
});
