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

  const content = await ichiranPageShimamura.downloadValidityDataCsv(savePath);
  I.saveScreenshotWithTimestamp('validity_data_output_after.png');

  const lines = content.split('\n').filter(l => l.trim() !== '');
  assert.ok(lines.length > 0, 'CSVにヘッダ行が存在すること');
  I.say(`✅ CSV: ${lines.length} 行を確認`);
});
