/**
 * @fileoverview shimamura 講師謝礼一括取込 E2Eテスト
 *
 * **処理フロー**
 * - 1. 担当者アカウントでログイン
 * - 2. 講師謝礼追加画面へ直接遷移（URL直アクセス）
 * - 3. CSVファイルを選択（import_file）
 * - 4. 「講師謝礼一括取込」ボタンをクリック
 * - 5. 結果（成功メッセージ / エラー）を確認
 *
 * **データソース**
 * - `data/shimamura/koushi_sharei_tsuika_data.csv`
 *   - `import_file_path`: アップロードするCSVのパス（リポジトリルートからの相対パス）
 *
 * **取込CSVのフォーマット**
 * - `data/shimamura/koushi_sharei_import_sample.csv` を差し替えて使用する
 * - フォーマットは実機で確認の上、ヘッダー行・データ行を修正すること
 *
 * **前提条件**
 * - 環境変数 `SHIMAMURA_TANTOUSYA` が設定されていること
 */
'use strict';

const {
  loadCsvWithProfile,
  withScenarioLabel,
  setBusinessLabels,
  attachBusinessContext,
  attachErrorScreenshot
} = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const {
  navigateToTsuikaImportScreen,
  executeImport,
  verifyImportResult,
  verifyImportError,
} = require('../../../pages/shimamura/flow/KoushiShareiFlowPage');

const csvData = withScenarioLabel(
  loadCsvWithProfile('koushi_sharei_tsuika_data', 'shimamura'),
  (row) => row.scenario || '一括取込'
);

const errorData = withScenarioLabel(
  loadCsvWithProfile('koushi_sharei_tsuika_errors', 'shimamura'),
  (row) => row.scenario || 'バリデーションエラー'
);

Feature('講師謝礼一括取込');

Before(beforeShimamura);

Data(csvData).Scenario('講師謝礼一括取込を実行できる @dev', async ({ I, current }) => {
  setBusinessLabels({
    epic:    '経理・謝礼',
    feature: '講師謝礼一括取込',
    story:   current.scenario || '一括取込'
  });

  attachBusinessContext({
    label: current.scenario || '一括取込',
    input: { import_file_path: current.import_file_path }
  });

  await navigateToTsuikaImportScreen(I);
  await executeImport(I, current.import_file_path);
  await verifyImportResult(I);

  I.saveScreenshotWithTimestamp('KOUSHI_SHAREI_TSUIKA_result');
});

Data(errorData).Scenario('講師謝礼一括取込のバリデーションエラー @dev @error', async ({ I, current }) => {
  setBusinessLabels({
    epic:    '経理・謝礼',
    feature: '講師謝礼一括取込',
    story:   current.scenario || 'バリデーションエラー'
  });

  attachBusinessContext({
    label: current.scenario || 'バリデーションエラー',
    input: { import_file_path: current.import_file_path, expectedError: current.expectedError }
  });

  await navigateToTsuikaImportScreen(I);
  await executeImport(I, current.import_file_path);
  await verifyImportError(I, current.expectedError);

  await attachErrorScreenshot(I, 'KOUSHI_SHAREI_TSUIKA_validation');
});
