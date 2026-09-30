/**
 * @fileoverview shimamura 月謝一括作成テスト #162
 *
 * **目的**
 * 月謝一括作成画面から月謝を作成し、来月分の料金が作成されたことを経理ビューで確認する。
 *
 * **前提条件**
 * - gessya_ikkatu_setup_test.js による受講生の請求方法設定・クラス登録が完了していること
 *
 * **処理フロー**
 * 1. 月謝一括作成画面へ遷移
 * 2. 月謝作成ボタンをクリック（confirm 承認 + 完了待ち）
 * 3. テスト受講生の経理ビューへ移動し来月分の料金が作成されていることを確認
 *
 * **二重作成防止（SKP・Phase 3 #166）** `@skp`
 * 1. 月謝一括作成を実行（来月分が無ければここで作られる）→ 受講生ごとに来月の会費合計と料金名を控える
 * 2. もう一度月謝一括作成を実行 → 会費合計・料金名が変わらず、同じ料金名が2つ無いことを確認
 * ※ 月謝一括作成は testgcp 全体の一括処理。このシナリオは2回実行する
 */
'use strict';

const { setBusinessLabels } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const {
  runMonthlyFeeCreation,
  verifyMonthlyFees,
  loadActiveSessionStudents,
  grabMonthFeeSummary,
  assertNoDuplicateFees,
} = require('../../../pages/shimamura/flow/GessyaIkkatuFlowPage');

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

Scenario('月謝一括作成を2回実行しても来月分の料金が重複しない @dev @skp', async ({ I }) => {
  setBusinessLabels({
    epic:    '月謝一括作成',
    feature: '月謝一括作成 実行',
    story:   '二重作成防止（SKP）',
  });

  const students = loadActiveSessionStudents();
  if (students.length === 0) {
    throw new Error('【SKP】確認できる受講生がいません。gessya_ikkatu_setup_test.js を退会なしの行で先に実行してください');
  }
  const now  = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const targetYearMonth = `${next.getFullYear()}/${String(next.getMonth() + 1).padStart(2, '0')}`;

  I.say('【SKP】1回目の月謝一括作成');
  await runMonthlyFeeCreation(I);
  const before = {};
  for (const s of students) {
    before[s.recordId] = await grabMonthFeeSummary(I, s.recordId, targetYearMonth);
    if (before[s.recordId].feeNames.length === 0) {
      throw new Error(`【SKP】${s.lastName} ${s.firstName} の ${targetYearMonth} の料金が1回目で作られていません`);
    }
  }

  I.say('【SKP】2回目の月謝一括作成');
  await runMonthlyFeeCreation(I);
  for (const s of students) {
    const after = await grabMonthFeeSummary(I, s.recordId, targetYearMonth);
    assertNoDuplicateFees(I, { name: `${s.lastName} ${s.firstName}`, targetYearMonth, before: before[s.recordId], after });
  }
});
