/**
 * @fileoverview shimamura：受講生 有効性データ出力 E2E テスト
 *
 * 有効性データ出力画面からCSVをダウンロードし、内容を検証します。
 *
 * **画面遷移**
 * - Student モジュール → サイドバー「有効性データ」グループ展開 → 「有効性データ出力」クリック
 *
 * **データソース**
 * - `data/shimamura/validity_data_output_data.csv`
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const repoRoot = require('../../../support/repoRoot');

const csvData = withScenarioLabel(
  loadCsvWithProfile('validity_data_output_data', 'shimamura'),
  (row) => row.scenario
);

Feature('受講生 有効性データ出力');

Before(beforeShimamura);

Data(csvData).Scenario('有効性データをCSV出力できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  const savePath = path.join(repoRoot, 'output', 'downloads', `validity_data_${Date.now()}.csv`);

  await ichiranPageShimamura.navigateToValidityDataOutputPage();
  I.saveScreenshotWithTimestamp('validity_data_output_before.png');

  await ichiranPageShimamura.downloadValidityDataCsv(savePath);
  I.saveScreenshotWithTimestamp('validity_data_output_after.png');

  // 固定長ファイル検証: 改行なし・120バイト/レコード・区分コード 1=ヘッダー 2=データ 8=トレーラー 9=エンド
  const RECORD_LEN = 120;
  const buf = fs.readFileSync(savePath);

  assert.strictEqual(buf.length % RECORD_LEN, 0, `ファイルサイズが${RECORD_LEN}の倍数であること`);
  const totalRecords = buf.length / RECORD_LEN;
  assert.ok(totalRecords >= 4, 'ヘッダー・データ・トレーラー・エンドの最低4レコードが存在すること');

  assert.strictEqual(String.fromCharCode(buf[0]), '1', '第1レコードがヘッダー区分（1）であること');
  assert.strictEqual(String.fromCharCode(buf[(totalRecords - 2) * RECORD_LEN]), '8', '末尾から2番目がトレーラー区分（8）であること');
  assert.strictEqual(String.fromCharCode(buf[(totalRecords - 1) * RECORD_LEN]), '9', '最終レコードがエンドレコード区分（9）であること');

  const dataCount = totalRecords - 3; // ヘッダー1 + トレーラー1 + エンド1 を除く
  assert.ok(dataCount > 0, 'データレコードが1件以上存在すること');

  // トレーラーのバイト1〜7（7桁）= データ件数と照合
  const trailerStart = (totalRecords - 2) * RECORD_LEN;
  const trailerCount = parseInt(buf.slice(trailerStart + 1, trailerStart + 8).toString('ascii').trim(), 10);
  assert.strictEqual(trailerCount, dataCount, `トレーラー件数(${trailerCount})とデータレコード数(${dataCount})が一致すること`);

  I.say(`✅ 固定長ファイル: ${totalRecords} レコード（データ ${dataCount} 件、トレーラー計上 ${trailerCount} 件）を確認`);
});
