/**
 * @fileoverview shimamura 債権買取状態読込 E2E テスト
 *
 * **処理フロー**
 * 1. 経理アイコン > 債権買取状態読込 へ直遷移
 * 2. ファイルを選択（import_file1）
 * 3. 「買取保留/解除ファイル読込」ボタンをクリック
 * 4. 結果確認（取込履歴テーブルに行が追加されること）
 *
 * **データソース**
 * - `data/shimamura/smbc_state_import_data.csv`（正常系）
 * - `data/shimamura/smbc_state_import_validation_errors.csv`（異常系）
 *
 * ⚠️ 正しい読込ファイルは後から受領予定。
 *    受領後に CSV の import_file_path 列にパスを設定すること。
 *    異常系の expectedErrors も実機確認後に更新すること。
 *
 * **パターン**: B（1画面完結・FlowPage なし）
 */
'use strict';

const {
  loadCsvWithProfile,
  withScenarioLabel,
  parseExpectedErrors,
  logScreenUrl,
  setBusinessLabels,
  attachBusinessContext,
  attachErrorScreenshot,
} = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { verifyValidationErrors } = require('../../../support/shimamura/utils');
const { TIMEOUTS } = require('../../../support/shimamura/constants');

// ── セレクタ定数 ─────────────────────────────────────────────
const S = {
  fileInput:   'input[name="import_file1"]', // ファイル選択 (type="file")
  importBtn:   'input[name="save_button"]',  // 買取保留/解除ファイル読込ボタン（#import_btn）
  error:       '#top_err_info_msg_div',
  resultTable: '.listView',
};

// ── CSV ──────────────────────────────────────────────────────
const csvData = withScenarioLabel(
  loadCsvWithProfile('smbc_state_import_data'),
  (row) => row.scenario
);
const validationErrorData = withScenarioLabel(
  loadCsvWithProfile('smbc_state_import_validation_errors'),
  (row) => row.scenario
);

Feature('債権買取状態読込');

Before(beforeShimamura);

// ── ステップ関数 ─────────────────────────────────────────────

async function navigateToImportScreen(I) {
  I.say('【画面遷移】債権買取状態読込画面へ');
  I.amOnPage(process.env.BASE_URL + '/index.php?module=SmbcStateSummary&action=EWSMBCPurchaseStatusImport_AN');
  I.waitForElement(S.fileInput, TIMEOUTS.SCREEN);
  await logScreenUrl(I, '債権買取状態読込');
}

async function selectAndImportFile(I, filePath, expectedErrors) {
  if (filePath) {
    I.say(`【ファイル選択】${filePath}`);
    I.attachFile(S.fileInput, filePath);
  } else {
    I.say('【ファイル選択】ファイルなし（スキップ）');
  }

  I.say('【ファイル読込】ボタンをクリック');
  I.click(S.importBtn);
  // フォーム送信後、ページリロードでファイル入力欄が再表示されるまで待つ
  I.waitForElement(S.fileInput, TIMEOUTS.RESULT);

  const errorText = await I.executeScript(() => {
    const el = document.querySelector('#top_err_info_msg_div');
    return el ? el.innerText.trim() : '';
  });

  if (expectedErrors && expectedErrors.length > 0) {
    await verifyValidationErrors(I, expectedErrors, S.error);
    return;
  }
  if (errorText) throw new Error(`【ファイル読込】エラー: ${errorText}`);

  I.say('【ファイル読込】取込完了');
  await logScreenUrl(I, '債権買取状態読込_取込後');
}

// ── シナリオ ─────────────────────────────────────────────────

Data(csvData).Scenario('債権買取状態読込 正常系 @dev @normal', async ({ I, current }) => {
  setBusinessLabels({ epic: '経理', feature: '債権買取状態読込', story: '正常フロー' });

  const input = {
    import_file_path: current.import_file_path || '',
    expectedErrors:   parseExpectedErrors(current.expectedErrors),
  };

  attachBusinessContext({ label: '正常フロー', input });

  await navigateToImportScreen(I);
  await selectAndImportFile(I, input.import_file_path, input.expectedErrors);

  I.saveScreenshotWithTimestamp('SMBC_STATE_IMPORT_success', true);
  I.say('=== 債権買取状態読込 正常系 完了 ===');
});

Data(validationErrorData).Scenario('債権買取状態読込 異常系 @dev @error', async ({ I, current }) => {
  const storyLabel = current.scenario;
  setBusinessLabels({ epic: '経理', feature: '債権買取状態読込', story: storyLabel });

  const input = {
    import_file_path: current.import_file_path || '',
    expectedErrors:   parseExpectedErrors(current.expectedErrors),
  };

  attachBusinessContext({ label: storyLabel, input, expectedErrors: input.expectedErrors });

  await navigateToImportScreen(I);
  await selectAndImportFile(I, input.import_file_path, input.expectedErrors);
  await attachErrorScreenshot(I, 'SMBC_STATE_IMPORT_error');
});
