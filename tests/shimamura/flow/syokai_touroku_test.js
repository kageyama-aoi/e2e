/**
 * @fileoverview しまむら：新規受講生登録と経理処理のE2Eテスト
 *
 * データ駆動（Data Driven）でCSVからテストデータを読み込み実行します。
 *
 * **データソース**
 * - `syokai_touroku_data.csv`（または `--profile` に応じたファイル）
 *
 * **前提条件**
 * - 環境変数 `SHIMAMURA_TANTOUSYA` が設定されていること
 * - 実行時に `--profile` を指定する場合は `env/.env.<profile>` が存在すること
 */
const {
  loadCsvWithProfile,
  withScenarioLabel,
  parseExpectedErrors,
  setBusinessLabels,
  attachBusinessContext,
  attachErrorScreenshot
} = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { runRegistrationFlow, ShouldBeOnKeirisyoriScreenE, ShouldBeOnTaikai } = require('../../../pages/shimamura/SyokaiFlowPage');

const csvData = withScenarioLabel(loadCsvWithProfile('syokai_touroku_data', 'shimamura'), (row) => {
  return row.className || row.class_name01 || row.lastName || row.last_name || 'データ行';
});

const validationErrorData = withScenarioLabel(loadCsvWithProfile('syokai_touroku_validation_errors', 'shimamura'), (row) => {
  return row.label || row.breakTarget || 'バリデーションエラー';
});

Feature('Dev sandbox (@dev)');

Before(beforeShimamura);

Data(csvData).Scenario('新規受講生登録 @dev @normal', async ({ I, classMemberPageShimamura, current }) => {
  I.say('=== 経理処理 開始 ===');
  setBusinessLabels({ epic: '受講生管理', feature: '新規受講生登録＋経理処理', story: '正常登録フロー' });

  const input = {
    lastName: current.lastName,
    class_name01: current.className,
    course_category: current.courseCategory,
    keiyaku_date: current.keiyakuDate,
    kaishi_date: current.kaishiDate,
    mid_month: current.mid_month,
    remaining_classes: current.remaining_classes,
    breakTarget: current.breakTarget,
    breakValue: current.breakValue,
    expectedErrors: parseExpectedErrors(current.expectedErrors)
  };

  attachBusinessContext({ label: '正常登録フロー', input, breakTarget: input.breakTarget, breakValue: input.breakValue, expectedErrors: input.expectedErrors });

  await runRegistrationFlow(I, classMemberPageShimamura, input);

  I.say('=== 確認完了 処理 開始 ===');
  await ShouldBeOnKeirisyoriScreenE(I);
  I.say('=== 確認完了 処理 終了 ===');
  I.say('=== 退会処理 開始 ===');
  await ShouldBeOnTaikai(I, classMemberPageShimamura, { taikaiYear: current.taikaiYear, taikaiMonth: current.taikaiMonth });
  I.say('=== 退会処理 終了 ===');

  I.saveScreenshotWithTimestamp('CLASS_MEMBER_REGISTRATION_Success.png');
  I.say('=== 経理処理 終了 ===');
});

Data(validationErrorData).Scenario('経理日付バリデーションエラー @dev @error', async ({ I, classMemberPageShimamura, current }) => {
  I.say('=== 経理処理 開始 ===');
  const storyLabel = current.label || '経理日付エラー';
  setBusinessLabels({ epic: '受講生管理', feature: '新規受講生登録＋経理処理', story: storyLabel });

  const input = {
    lastName: current.lastName,
    class_name01: current.className,
    course_category: current.courseCategory,
    keiyaku_date: current.keiyakuDate,
    kaishi_date: current.kaishiDate,
    mid_month: current.mid_month,
    remaining_classes: current.remaining_classes,
    breakTarget: current.breakTarget,
    breakValue: current.breakValue,
    expectedErrors: parseExpectedErrors(current.expectedErrors)
  };

  attachBusinessContext({ label: storyLabel, input, breakTarget: input.breakTarget, breakValue: input.breakValue, expectedErrors: input.expectedErrors });

  await runRegistrationFlow(I, classMemberPageShimamura, input);

  await attachErrorScreenshot(I, 'ACCOUNTING_VALIDATION_ERROR');
  I.say('=== 経理処理 終了 ===');
});
