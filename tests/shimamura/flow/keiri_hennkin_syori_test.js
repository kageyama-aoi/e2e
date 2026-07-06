/**
 * @fileoverview しまむら：経理 返金処理（ひな形）E2Eテスト
 *
 * **処理フロー（ひな形）**
 * - 1. 担当者アカウントでログイン（autoLogin）
 * - 2. 管理 > 経理（機能一覧）へ遷移
 * - 3. 月謝一括作成へ遷移
 * - 4. 返金処理の条件入力（仮）
 * - 5. 作成・確認・確定（仮）
 *
 * **データソース**
 * - `keiri_hennkin_syori_data.csv`（または `--profile` に応じたファイル）
 *
 * **異常系の指定（CSV）**
 * - `expectedErrors`: `|` 区切りの期待エラー文言
 *
 * **前提条件**
 * - 環境変数 `SHIMAMURA_TANTOUSYA` が設定されていること
 * - 実行時に `--profile` を指定する場合は `env/.env.<profile>` が存在すること
 *
 * **最終更新日**
 * - 2026-02-04
 */
const {
  loadCsvWithProfile,
  withScenarioLabel,
  parseEnvBoolean,
  parseExpectedErrors,
  logScreenUrl,
  setBusinessLabels,
  attachBusinessContext,
  attachErrorScreenshot
} = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { verifyValidationErrors } = require('../../../support/shimamura/utils');
const { SELECTORS } = require('../../../support/shimamura/constants');

Feature('経理返金処理（ひな形）');

const csvDataRaw = loadCsvWithProfile('keiri_hennkin_syori_data', 'shimamura');
const validationErrorDataRaw = loadCsvWithProfile('keiri_hennkin_syori_validation_errors', 'shimamura');

const csvData = withScenarioLabel(csvDataRaw, (row) => {
  return row.label || row.targetMonth || 'データ行';
});

const validationErrorData = withScenarioLabel(validationErrorDataRaw, (row) => {
  return row.label || row.breakTarget || 'バリデーションエラー';
});


function isPauseEnabled() {
  return parseEnvBoolean('PAUSE_ON_KEIRI');
}

Before(beforeShimamura);

const S = {
  screen: { name: '月謝一括作成' },
  fields: {
    targetMonth: '#billing_month',
    targetSchool: '#school_id'
  },
  buttons: {
    search: '検索',
    create: '作成',
    confirm: '確認',
    finalize: '確定'
  },
  result: {
    table: '.listView'
  },
  error: {
    container: SELECTORS.ERROR_CONTAINER
  }
};

/**
 * 月謝一括作成画面での入力（仮）
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} input - 入力値（仮）
 */
async function fillBatchCreateForm(I, input) {
  I.say('【月謝一括作成】条件入力（仮）');
  I.fillField(S.fields.targetMonth, input.targetMonth);
  I.selectOption(S.fields.targetSchool, input.targetSchool);
  I.click(S.buttons.search);
}

/**
 * 月謝一括作成のテストシナリオ（正常系）
 */
Data(csvData).Scenario('経理：返金処理 正常系 @dev @normal', async ({ I, classMemberPageShimamura, current }) => {
  I.say('--- テスト開始: 経理 返金処理（正常系） ---');

  setBusinessLabels({
    epic: '経理',
    feature: '返金処理',
    story: '正常フロー'
  });

  const input = {
    targetMonth: current.targetMonth || '2026-02',
    targetSchool: current.targetSchool || 'すべて',
    expectedErrors: parseExpectedErrors(current.expectedErrors)
  };

  attachBusinessContext({
    label: '正常フロー',
    input,
    expectedErrors: input.expectedErrors
  });

  I.say('【管理メニュー】経理 → 経理メニュー');
  await classMemberPageShimamura.navigateToAdminTab(I, '経理', '月謝一括作成');
  await logScreenUrl(I, '経理メニュー');
  await classMemberPageShimamura.openRefundListFromKeiriMenu();

  // まずは月謝一括作成の画面遷移のみ確認するため、必要に応じて一時停止
  if (isPauseEnabled()) {
    // pause();
  }

  await fillBatchCreateForm(I, input);

  I.say('【月謝一括作成】結果確認（仮）');
  I.waitForElement(S.result.table, 10);

  I.say('【月謝一括作成】作成→確認→確定（仮）');
  I.click(S.buttons.create);
  I.click(S.buttons.confirm);
  I.click(S.buttons.finalize);

  // 最終確認のスクリーンショット
  I.saveScreenshotWithTimestamp('KEIRI_BATCH_CREATE_Template.png');

  I.say('--- テスト終了: 経理 返金処理（正常系） ---');
});

/**
 * 月謝一括作成のテストシナリオ（異常系）
 */
Data(validationErrorData).Scenario('経理：返金処理 異常系 @dev @error', async ({ I, classMemberPageShimamura, current }) => {
  I.say('--- テスト開始: 経理 返金処理（異常系） ---');
  I.say(`【異常系】${current.label || 'バリデーションエラー'}`);

  const storyLabel = current.label || 'バリデーションエラー';
  setBusinessLabels({
    epic: '経理',
    feature: '返金処理',
    story: storyLabel
  });

  const input = {
    targetMonth: current.targetMonth || '',
    targetSchool: current.targetSchool || 'すべて',
    expectedErrors: parseExpectedErrors(current.expectedErrors)
  };

  attachBusinessContext({
    label: storyLabel,
    input,
    expectedErrors: input.expectedErrors
  });

  I.say('【管理メニュー】経理 → 経理メニュー');
  await classMemberPageShimamura.navigateToAdminTab(I, '経理', '月謝一括作成');
  await logScreenUrl(I, '経理メニュー');
  await classMemberPageShimamura.openRefundListFromKeiriMenu();

  if (isPauseEnabled()) {
    // pause();
  }
  await fillBatchCreateForm(I, input);

  I.say('【月謝一括作成】作成（異常系）');
  I.click(S.buttons.create);
  await verifyValidationErrors(I, input.expectedErrors, S.error.container);
  await attachErrorScreenshot(I, 'KEIRI_HENNIKIN_VALIDATION_ERROR');

  I.say('--- テスト終了: 経理 返金処理（異常系） ---');
});
