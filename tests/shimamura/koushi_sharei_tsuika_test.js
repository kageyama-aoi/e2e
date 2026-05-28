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
} = require('../../support/utils');
const { beforeShimamura } = require('../../support/shimamura/hooks');
const { TIMEOUTS } = require('../../support/shimamura/constants');

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
  loadCsvWithProfile('koushi_sharei_tsuika_data'),
  (row) => row.scenario || '一括取込'
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
  I.wait(TIMEOUTS.RESULT);
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

  I.saveScreenshotWithTimestamp('KOUSHI_SHAREI_TSUIKA_result');
  await attachErrorScreenshot(I, 'KOUSHI_SHAREI_TSUIKA');

  I.say('【結果確認】スクリーンショット保存完了');
});
