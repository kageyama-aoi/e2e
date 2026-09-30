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
 *   ※ 前日データ欠損時の window.confirm() ポップアップは executeScript で自動承認（I.acceptPopup はポップアップ表示中にしか使えないため不可）
 *
 * **パターン**: B（1画面完結・FlowPage なし）
 */
'use strict';

const fs = require('fs');
const path = require('path');
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
const { verifyValidationErrors, clickAndWaitForReload } = require('../../../support/shimamura/utils');
const { TIMEOUTS, SELECTORS, BASE_URL } = require('../../../support/shimamura/constants');

// ── セレクタ定数 ─────────────────────────────────────────────
const S = {
  fileInput:   'input[name="import_file1"]', // ファイル選択 (type="file")
  importBtn:   'input[name="save_button"]',  // 買取保留/解除ファイル読込ボタン（#import_btn）
  error:       SELECTORS.ERROR_CONTAINER,
  resultTable: '.listView',
  historyTopRow: '.listView tr:nth-child(2)', // 取込履歴の先頭行（1行目は見出し。取込日時の降順）
};

// 取込成功時もエラーと同じ表示欄（#top_err_info_msg_div）に出る完了メッセージ（#265 で確認）
const IMPORT_DONE_MESSAGE = '買取保留・保留解除ファイルの取り込みが完了しました。';

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

function formatYmd(date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}

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
    if (kind === '1') buf.write(formatYmd(today), pos + SMBC_DATE_OFFSETS.headerCreatedDate, 'ascii');
    if (kind === '2') buf.write(formatYmd(tomorrow), pos + SMBC_DATE_OFFSETS.dataRecordDate, 'ascii');
  }
  const outRelPath = path.join('output', 'smbc_import', `smbc_state_import_${formatYmd(today)}.txt`);
  fs.mkdirSync(path.dirname(outRelPath), { recursive: true });
  fs.writeFileSync(outRelPath, buf);
  return outRelPath;
}

// ── ステップ関数 ─────────────────────────────────────────────

async function navigateToImportScreen(I) {
  I.say('【画面遷移】債権買取状態読込画面へ');
  I.amOnPage(BASE_URL + 'index.php?module=SmbcStateSummary&action=EWSMBCPurchaseStatusImport_AN');
  I.waitForElement(S.fileInput, TIMEOUTS.SCREEN);
  await logScreenUrl(I, '債権買取状態読込');
}

/**
 * 取込履歴の先頭行のテキスト（行が無ければ空文字）
 * @param {CodeceptJS.I} I
 * @returns {Promise<string>}
 */
async function grabHistoryTopRow(I) {
  return I.executeScript((sel) => {
    const row = document.querySelector(sel);
    return row ? row.innerText.replace(/\s+/g, ' ').trim() : '';
  }, S.historyTopRow);
}

async function selectAndImportFile(I, filePath, expectedErrors) {
  if (filePath) {
    I.say(`【ファイル選択】${filePath}`);
    I.attachFile(S.fileInput, filePath);
  } else {
    I.say('【ファイル選択】ファイルなし（スキップ）');
  }
  const topRowBefore = await grabHistoryTopRow(I);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // データ作成年月日が取込済み「以前」だと弾かれ、時刻も見ないため、正常な取込は1日1回しかできない（#265）
  if (!expectedErrors?.length && topRowBefore.startsWith(today)) {
    throw new Error('【ファイル読込】本日はすでに取込済みのため、正常系は明日以降に再実行してください（1日1回しか取り込めない #265）'
      + `\n  取込履歴の先頭: ${topRowBefore}`);
  }

  I.say('【ファイル読込】ボタンをクリック');
  // 前日データ欠損時に window.confirm() が出る場合があるため、クリック前にオーバーライドしておく
  // (I.acceptPopup() はポップアップ表示中にしか使えないため executeScript で対応)
  await I.executeScript(() => { window.confirm = () => true; });
  // ファイル選択欄は押す前から画面にあるため、それを待つと再描画前の画面で判定しうる（#243）。
  // 画面が読み込み直されるまで待つ
  await clickAndWaitForReload(I, S.importBtn);
  I.waitForElement(S.fileInput, TIMEOUTS.SCREEN);

  if (expectedErrors?.length > 0) {
    await verifyValidationErrors(I, expectedErrors, S.error);
    return;
  }
  // 成功時も表示欄に完了メッセージが出るため、「空であること」ではなく「完了メッセージだけであること」を確かめる
  const message = (await I.grabTextFromAll(S.error)).join(' ').trim();
  if (message !== IMPORT_DONE_MESSAGE) {
    throw new Error(`【ファイル読込】完了メッセージが出ていません: ${message || '（表示なし）'}`);
  }

  // エラーが無いだけでは取り込まれた証拠にならない。取込履歴の先頭に今日の行が増えたことを確かめる
  const topRowAfter = await grabHistoryTopRow(I);
  if (topRowAfter === topRowBefore || !topRowAfter.startsWith(today)) {
    throw new Error(`【ファイル読込】取込履歴に今回の行がありません（取込されていない）\n  前: ${topRowBefore}\n  後: ${topRowAfter}`);
  }
  I.say(`【ファイル読込】取込完了（取込履歴: ${topRowAfter}）`);
  await logScreenUrl(I, '債権買取状態読込_取込後');
}

// ── シナリオ ─────────────────────────────────────────────────

Data(csvData).Scenario('債権買取状態読込 正常系 @dev @normal', async ({ I, current }) => {
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
