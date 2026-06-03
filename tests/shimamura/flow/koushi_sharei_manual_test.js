/**
 * @fileoverview shimamura 講師謝礼手動入力登録 E2Eテスト
 *
 * **処理フロー**
 * - 1. 担当者アカウントでログイン
 * - 2. 講師謝礼追加画面へ直接遷移
 * - 3. 講師選択（別タブポップアップ → 先頭結果をクリック）
 * - 4. 計上日・対象月・謝礼項目・金額を入力
 * - 5. 保存ボタンをクリック → 結果確認
 *
 * **データソース**
 * - `data/shimamura/koushi_sharei_manual_data.csv`（正常系）
 * - `data/shimamura/koushi_sharei_manual_validation_errors.csv`（異常系）
 *
 * **前提条件**
 * - 環境変数 `SHIMAMURA_TANTOUSYA` が設定されていること
 * - テスト環境に少なくとも1件の講師データが存在すること
 */
'use strict';

const {
  loadCsvWithProfile,
  withScenarioLabel,
  parseExpectedErrors,
  setBusinessLabels,
  attachBusinessContext,
  attachErrorScreenshot
} = require('../../support/utils');
const { beforeShimamura } = require('../../support/shimamura/hooks');
const {
  runKoushiShareiManualFlow,
  runKoushiShareiValidationFlow
} = require('../../pages/shimamura/KoushiShareiFlowPage');

const csvData = withScenarioLabel(
  loadCsvWithProfile('koushi_sharei_manual_data'),
  (row) => row.scenario || '手動登録'
);

const validationErrorData = withScenarioLabel(
  loadCsvWithProfile('koushi_sharei_manual_validation_errors'),
  (row) => row.scenario || 'バリデーションエラー'
);

Feature('講師謝礼手動入力登録');

Before(beforeShimamura);

Data(csvData).Scenario('講師謝礼を1件登録できる @dev @normal', async ({ I, current }) => {
  setBusinessLabels({
    epic:    '経理・謝礼',
    feature: '講師謝礼手動入力',
    story:   current.scenario || '正常登録'
  });

  const input = {
    keijoubi:      current.keijoubi,
    from_datetime: current.from_datetime,
    sharei_komoku: current.sharei_komoku,
    houshugaku:    current.houshugaku,
    student_count: current.student_count,
    bikou:         current.bikou,
    expectedErrors: []
  };

  attachBusinessContext({ label: current.scenario, input });

  await runKoushiShareiManualFlow(I, input);

  I.saveScreenshotWithTimestamp('KOUSHI_SHAREI_MANUAL_success');
});

Data(validationErrorData).Scenario('講師謝礼登録のバリデーションエラー @dev @error', async ({ I, current }) => {
  const storyLabel = current.scenario || 'バリデーションエラー';
  setBusinessLabels({
    epic:    '経理・謝礼',
    feature: '講師謝礼手動入力',
    story:   storyLabel
  });

  const input = {
    keijoubi:      current.keijoubi,
    from_datetime: current.from_datetime,
    sharei_komoku: current.sharei_komoku,
    houshugaku:    current.houshugaku,
    expectedErrors: parseExpectedErrors(current.expectedErrors)
  };

  attachBusinessContext({ label: storyLabel, input, expectedErrors: input.expectedErrors });

  await runKoushiShareiValidationFlow(I, input);

  await attachErrorScreenshot(I, 'KOUSHI_SHAREI_MANUAL_validation');
});
