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
  logScreenUrl,
  setBusinessLabels,
  attachBusinessContext,
  attachErrorScreenshot
} = require('../../../support/utils');
const { TIMEOUTS } = require('../../../support/shimamura/constants');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const BASE_URL = (process.env.BASE_URL || '').replace(/\/?$/, '/');

const S = {
  fileInput:  'input[name="import_file"]',
  button: {
    import: 'input[name="batch_import"]'
  },
  message: {
    success: '#top_message_div_id',
    error:   '#top_err_info_msg_div'
  }
};

const csvData = withScenarioLabel(
  loadCsvWithProfile('koushi_sharei_tsuika_data', 'shimamura'),
  (row) => row.scenario || '一括取込'
);

const errorData = withScenarioLabel(
  loadCsvWithProfile('koushi_sharei_tsuika_errors', 'shimamura'),
  (row) => row.scenario || 'バリデーションエラー'
);

async function navigateToTsuikaScreen(I) {
  I.say('【画面遷移】講師謝礼追加画面へ');
  I.amOnPage(BASE_URL + 'index.php?module=ShareiNichibetsu&action=EW_KoushiShareiTsuika_AN');
  I.waitForElement(S.fileInput, TIMEOUTS.SCREEN);
  await logScreenUrl(I, '講師謝礼追加画面');
}

async function executeImport(I, filePath) {
  I.say(`【ファイル選択】${filePath}`);
  I.attachFile(S.fileInput, filePath);
  I.say('【一括取込実行】講師謝礼一括取込ボタンをクリック');
  I.click(S.button.import);
  // 成功メッセージかエラーテキストが現れるまで動的に待機（空のまま存在する要素は無視）
  await I.waitForFunction(
    () => document.querySelector('#top_message_div_id')?.textContent.trim() ||
          document.querySelector('#top_err_info_msg_div')?.textContent.trim(),
    TIMEOUTS.RESULT
  );
}

async function verifyImportResult(I) {
  const errorText = await I.grabTextFrom(S.message.error);
  if (errorText.trim()) {
    throw new Error(`一括取込エラー: ${errorText.trim()}`);
  }
  I.say('【結果確認】エラーなし - 取込成功');
}

async function verifyImportError(I, expectedError) {
  I.waitForElement(S.message.error, TIMEOUTS.RESULT);
  I.see(expectedError, S.message.error);
  I.say(`【結果確認】期待エラーを確認: ${expectedError}`);
}

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

  await navigateToTsuikaScreen(I);
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

  await navigateToTsuikaScreen(I);
  await executeImport(I, current.import_file_path);
  await verifyImportError(I, current.expectedError);

  await attachErrorScreenshot(I, 'KOUSHI_SHAREI_TSUIKA_validation');
});
