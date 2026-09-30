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
 * - ヘッダーなし・20列・SHIFT-JIS。12列目=計上日(YYYYMMDD)、13列目=対象月(YYYYMM)
 * - 日付の制約: 計上日はシステム年月の当月以降／計上日の年月＝対象月の翌月
 * - 正常系はサンプル `koushi_sharei_import_sample.csv` の日付を「計上日＝今日・対象月＝前月」に書き換えた
 *   一時ファイルを output/ に作って取り込む（{@link buildDatedImportFile}。固定日付は月が変わると弾かれる #99）
 * - 取込で testgcp に講師謝礼が1件登録される（講師「E2Eテスト 内部課税」99901・TESTモール太田店）
 * - 取込前に講師・店舗の実在を確かめる（{@link verifyImportMastersExist}）。存在しないと画面には「エラーが発生しました。」としか出ないため
 * - 2026-09-30 時点、講師・店舗・日付が正しくても「エラーが発生しました。」で取り込めない（列の仕様が不明な項目あり #99）
 *
 * **前提条件**
 * - 環境変数 `SHIMAMURA_TANTOUSYA` が設定されていること
 */
'use strict';

const fs = require('fs');
const path = require('path');
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
  verifyImportMastersExist,
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

// 取込CSVの列位置（0始まり）。SHIFT-JIS の全角文字にカンマ(0x2C)は現れないので、バイト列のまま分割してよい
const IMPORT_COLUMNS = { keijoubi: 11, taishoTsuki: 12 };

function formatYm(date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * サンプルの取込CSVを、計上日＝今日・対象月＝前月 に書き換えて output/ に保存する（#99）
 * @param {string} templatePath - codecept 実行ディレクトリからの相対パス
 * @returns {string} 生成したファイルの相対パス（I.attachFile に渡せる形）
 */
function buildDatedImportFile(templatePath) {
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const keijoubi = `${formatYm(today)}${String(today.getDate()).padStart(2, '0')}`;
  // latin1 は 1バイト＝1文字で往復できるため、SHIFT-JIS のバイト列を壊さずに列を差し替えられる
  const cols = fs.readFileSync(templatePath).toString('latin1').split(',');
  cols[IMPORT_COLUMNS.keijoubi] = keijoubi;
  cols[IMPORT_COLUMNS.taishoTsuki] = formatYm(lastMonth);
  const outRelPath = path.join('output', 'koushi_sharei_import', `koushi_sharei_import_${keijoubi}.csv`);
  fs.mkdirSync(path.dirname(outRelPath), { recursive: true });
  fs.writeFileSync(outRelPath, Buffer.from(cols.join(','), 'latin1'));
  return outRelPath;
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

  await verifyImportMastersExist(I, current.import_file_path);
  await navigateToTsuikaImportScreen(I);
  await executeImport(I, buildDatedImportFile(current.import_file_path));
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
