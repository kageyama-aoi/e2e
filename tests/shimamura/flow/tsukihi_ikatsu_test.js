/**
 * @fileoverview shimamura 月謝一括作成テスト #162
 *
 * **目的**
 * 月謝一括作成画面から月謝を作成し、来月分の料金が作成されたことを経理ビューで確認する。
 *
 * **前提条件**
 * - tsukihi_ikatsu_setup_test.js による受講生の請求方法設定・クラス登録が完了していること
 *
 * **処理フロー**
 * 1. 月謝一括作成画面へ遷移
 * 2. 月謝作成ボタンをクリック（confirm 承認 + 完了待ち）
 * 3. テスト受講生の経理ビューへ移動し来月分の料金が作成されていることを確認
 */
'use strict';

const { setBusinessLabels } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { runMonthlyFeeCreation, verifyMonthlyFees } = require('../../../pages/shimamura/flow/TsukihiIkatsuFlowPage');

Feature('月謝一括作成');

Before(beforeShimamura);

Scenario('月謝一括作成を実行して月謝が作成される @dev', async ({ I, classMemberPageShimamura }) => {
  setBusinessLabels({
    epic:    '月謝一括作成',
    feature: '月謝一括作成 実行',
    story:   '月謝一括作成の実行',
  });

  await runMonthlyFeeCreation(I);
  await verifyMonthlyFees(I, classMemberPageShimamura);
});
