/**
 * @fileoverview 問合せデータ取込 テスト
 *
 * **テスト内容**
 * - 正常系: ヘッダー付きCSVを投入すると「マッピングを保存して取込」ボタンのある
 *   列マッピング確認画面（ステップ2）へ進むことを確認する。実データ（受講生）を作成して
 *   しまう「マッピングを保存して取込」は押さず、「ファイル選択画面に戻る」で安全に離脱する。
 * - 異常系: ファイル未選択時のガードメッセージ（「ファイルを選択してください。」）を確認する。
 *
 * **対象画面**: `student/ew/stInquiryDataImport`（juku_beta のみ）
 * **プロファイル**: juku_beta 専用（`TFRAME_LANGUAGE=en` のため画面は常に英語表示。Issue #220）
 * **データソース**:
 * - `data/tframe/st_inquiry_data_import_data.csv`（正常系）
 * - `data/tframe/st_inquiry_data_import_validation_data.csv`（異常系）
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - filePath: 取込ファイルのパス（正常系は必須・異常系は空で未選択ケース）
 * - expectedMessage: 異常系CSVのみ。期待するガードメッセージの部分文字列（英語UIのため英語表記）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const normalCsvData = withScenarioLabel(
  loadCsvWithProfile('st_inquiry_data_import_data', 'tframe'),
  (row) => row.scenario
);
const validationCsvData = withScenarioLabel(
  loadCsvWithProfile('st_inquiry_data_import_validation_data', 'tframe'),
  (row) => row.scenario
);

Feature('問合せデータ取込');

Data(normalCsvData).Scenario('問合せデータ取込でマッピング確認画面まで進める @admin', ({ I, jukuseiPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  jukuseiPage.navigateToStInquiryDataImportPage();
  jukuseiPage.selectStInquiryDataImportFile(current);
  jukuseiPage.clickStInquiryDataImport();
  jukuseiPage.verifyStInquiryDataImportMappingStepAndGoBack();
  I.saveScreenshotWithTimestamp('st_inquiry_data_import_mapping', true);
});

Data(validationCsvData).Scenario('問合せデータ取込のガードメッセージを確認できる @admin', ({ I, jukuseiPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  jukuseiPage.navigateToStInquiryDataImportPage();
  jukuseiPage.selectStInquiryDataImportFile(current);
  jukuseiPage.clickStInquiryDataImport();
  jukuseiPage.verifyStInquiryDataImportGuardMessage(current.expectedMessage);
  I.saveScreenshotWithTimestamp('st_inquiry_data_import_guard', true);
});
