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
 * **エラーテスト用ファイル**（data/shimamura/ に配置済み）
 *   - smbc_err_no_header.txt    : ヘッダーレコード未存在
 *   - smbc_err_header_short.txt : ヘッダーレコード桁数不正
 *   - smbc_err_no_end.txt       : エンドレコード未存在
 *   ※ 前日データ欠損時の window.confirm() ポップアップは executeScript で自動承認（I.acceptPopup はポップアップ表示中にしか使えないため不可）
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
const { verifyValidationErrors, assertNoShimamuraError } = require('../../../support/shimamura/utils');
const { TIMEOUTS, SELECTORS } = require('../../../support/shimamura/constants');

// ── セレクタ定数 ─────────────────────────────────────────────
const S = {
  fileInput:   'input[name="import_file1"]', // ファイル選択 (type="file")
  importBtn:   'input[name="save_button"]',  // 買取保留/解除ファイル読込ボタン（#import_btn）
  error:       SELECTORS.ERROR_CONTAINER,
  resultTable: '.listView',
};

// ── CSV ──────────────────────────────────────────────────────
const csvData = withScenarioLabel(
  loadCsvWithProfile('smbc_state_import_data', 'shimamura'),
  (row) => row.scenario
);
const validationErrorData = withScenarioLabel(
  loadCsvWithProfile('smbc_state_import_validation_errors', 'shimamura'),
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
  // 前日データ欠損時に window.confirm() が出る場合があるため、クリック前にオーバーライドしておく
  // (I.acceptPopup() はポップアップ表示中にしか使えないため executeScript で対応)
  await I.executeScript(() => { window.confirm = () => true; });
  I.click(S.importBtn);
  // フォーム送信後、ページリロードでファイル入力欄が再表示されるまで待つ
  I.waitForElement(S.fileInput, TIMEOUTS.RESULT);

  if (expectedErrors?.length > 0) {
    await verifyValidationErrors(I, expectedErrors, S.error);
    return;
  }
  await assertNoShimamuraError(I, '【ファイル読込】');
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
