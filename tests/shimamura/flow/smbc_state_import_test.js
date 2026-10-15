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
 * **正常系の取込ファイル**（#265）
 *   サンプル smbc_state_import_sample.txt は、取込済みのデータ作成年月日「以前」のファイルを弾く仕様のため
 *   一度しか取り込めない。実行のたびに日付だけ今日に書き換えた一時ファイルを output/ に作って取り込む
 *   （{@link buildDatedImportFile}）。取込で testgcp の受講生の債権買取状態が変わることは許容済み。
 *
 * **エラーテスト用ファイル**（data/shimamura/ に配置済み）
 *   - smbc_err_no_header.txt    : ヘッダーレコード未存在
 *   - smbc_err_header_short.txt : ヘッダーレコード桁数不正
 *   - smbc_err_no_end.txt       : エンドレコード未存在
 *   ※ 前日データ欠損時の確認ダイアログは acceptConfirmDialogs で自動承認（Page Object 側）
 *
 * **画面操作**: `pages/shimamura/screens/SmbcStateImportPage.js`（inject: smbcStateImportPageShimamura）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const {
  loadCsvWithProfile,
  withScenarioLabel,
  parseExpectedErrors,
  setBusinessLabels,
  attachBusinessContext,
  attachErrorScreenshot,
} = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { formatDate } = require('../../../support/dateFormat');

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

// ── 取込ファイルの日付書き換え（#265） ─────────────────────────

// 固定長 251 バイト＋CRLF/レコード。ヘッダーのカナ名が SHIFT-JIS のため、文字列にせず Buffer のまま書き換える
const SMBC_RECORD_BYTES = 251 + 2;
const SMBC_DATE_OFFSETS = {
  headerCreatedDate: 86, // ヘッダー: データ作成年月日（YYYYMMDD）。取込済みより後でないと取り込めない
  dataRecordDate:    45, // データレコード: 日付（YYYYMMDD）。サンプルではデータ作成日の翌日
};

/**
 * サンプルの取込ファイルを、データ作成年月日＝今日・データレコードの日付＝明日 に書き換えて output/ に保存する。
 * @param {string} templatePath - codecept 実行ディレクトリからの相対パス
 * @returns {string} 生成したファイルの相対パス（I.attachFile に渡せる形）
 */
function buildDatedImportFile(templatePath) {
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const buf = fs.readFileSync(templatePath);
  for (let pos = 0; pos < buf.length; pos += SMBC_RECORD_BYTES) {
    const kind = String.fromCharCode(buf[pos]); // 先頭1バイト＝データ区分（1:ヘッダー 2:データ 8:トレーラー 9:エンド）
    if (kind === '1') buf.write(formatDate(today, 'YYYYMMDD'), pos + SMBC_DATE_OFFSETS.headerCreatedDate, 'ascii');
    if (kind === '2') buf.write(formatDate(tomorrow, 'YYYYMMDD'), pos + SMBC_DATE_OFFSETS.dataRecordDate, 'ascii');
  }
  const outRelPath = path.join('output', 'smbc_import', `smbc_state_import_${formatDate(today, 'YYYYMMDD')}.txt`);
  fs.mkdirSync(path.dirname(outRelPath), { recursive: true });
  fs.writeFileSync(outRelPath, buf);
  return outRelPath;
}

// ── シナリオ ─────────────────────────────────────────────────

Data(csvData).Scenario('債権買取状態読込 正常系 @dev @normal', async ({ I, current, smbcStateImportPageShimamura }) => {
  setBusinessLabels({ epic: '経理', feature: '債権買取状態読込', story: '正常フロー' });

  const input = {
    import_file_path: current.import_file_path || '',
    expectedErrors:   parseExpectedErrors(current.expectedErrors),
  };

  // 固定のサンプルは一度しか取り込めないため、日付を今日にした一時ファイルを取り込む（#265）
  if (input.import_file_path) {
    input.import_file_path = buildDatedImportFile(input.import_file_path);
  }
  attachBusinessContext({ label: '正常フロー', input });

  await smbcStateImportPageShimamura.open();
  await smbcStateImportPageShimamura.importFile(input.import_file_path, input.expectedErrors);

  I.saveScreenshotWithTimestamp('SMBC_STATE_IMPORT_success', true);
  I.say('=== 債権買取状態読込 正常系 完了 ===');
});

Data(validationErrorData).Scenario('債権買取状態読込 異常系 @dev @error', async ({ I, current, smbcStateImportPageShimamura }) => {
  const storyLabel = current.scenario;
  setBusinessLabels({ epic: '経理', feature: '債権買取状態読込', story: storyLabel });

  const input = {
    import_file_path: current.import_file_path || '',
    expectedErrors:   parseExpectedErrors(current.expectedErrors),
  };

  attachBusinessContext({ label: storyLabel, input, expectedErrors: input.expectedErrors });

  await smbcStateImportPageShimamura.open();
  await smbcStateImportPageShimamura.importFile(input.import_file_path, input.expectedErrors);
  await attachErrorScreenshot(I, 'SMBC_STATE_IMPORT_error');
});
