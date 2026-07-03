/**
 * @fileoverview shimamura 月謝一括作成準備セットアップテスト #162
 *
 * **目的**
 * 月謝一括作成フローテストに必要な受講生（請求方法：銀行引落）を
 * testgcp 環境に準備し、クラスへ登録する。
 *
 * **処理フロー**
 * 1. 候補生一覧から候補生を検索 → 「受講生へ移動」で昇格
 * 2. 受講生詳細で請求方法（bank_payment_type）・収納業者（shima_storage_id）を設定
 * 3. 受講生をクラスに登録（経理ビュー A/B 処理）
 *
 * **データソース**
 * - `data/shimamura/gessya_ikkatu_setup_data.csv`
 */
'use strict';

const fs = require('fs');
const {
  loadCsvWithProfile,
  withScenarioLabel,
  setBusinessLabels,
  attachBusinessContext,
} = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { runStudentPaymentSetup, verifyKanrihiFee, verifyKanrihiWinnerByClassName, resolveRelativeMonth, SESSION_FILE } = require('../../../pages/shimamura/flow/GessyaIkkatuFlowPage');
const {
  ShouldBeOnKeirisyoriScreenA,
  ShouldBeOnKeirisyoriScreenB,
  ShouldBeOnKeirisyoriScreenE,
  ShouldBeOnTaikai,
} = require('../../../pages/shimamura/flow/SyokaiFlowPage');

function buildClassInput(row, suffix = '') {
  return {
    class_name01:    row[`className${suffix}`],
    course_category: row[`courseCategory${suffix}`],
    keiyaku_date:    row[`keiyakuDate${suffix}`],
    kaishi_date:     row[`kaishiDate${suffix}`],
  };
}

const csvData = withScenarioLabel(
  loadCsvWithProfile('gessya_ikkatu_setup_data', 'shimamura'),
  (row) => row.scenario
);

Feature('月謝一括作成準備（受講生・請求方法設定）');

BeforeSuite(() => {
  // setup再実行時にセッションファイルをリセット（前回の受講生UUIDを破棄）
  try { fs.writeFileSync(SESSION_FILE, JSON.stringify([], null, 2)); } catch {}
});

Before(beforeShimamura);

Data(csvData).Scenario('受講生の請求方法を設定しコースに登録する @setup @dev', async ({ I, classMemberPageShimamura, current }) => {
  setBusinessLabels({
    epic:    '月謝一括作成',
    feature: '月謝一括作成準備',
    story:   current.scenario,
  });
  attachBusinessContext({
    label: current.scenario,
    input: {
      lastName:          current.lastName,
      bank_payment_type: current.bank_payment_type,
      shima_storage_id:  current.shima_storage_id,
      discount:          current.discount,
    },
  });

  // Step1: 候補生検索 → 受講生へ移動（昇格） → 請求方法編集
  const recordId = await runStudentPaymentSetup(I, classMemberPageShimamura, current);

  // Step2: 経理ビューA/B でクラス登録（1クラス目）
  await ShouldBeOnKeirisyoriScreenA(I, classMemberPageShimamura);
  await ShouldBeOnKeirisyoriScreenB(I, buildClassInput(current));
  await ShouldBeOnKeirisyoriScreenE(I);

  // Step3: 2クラス目（UNNパターン等、className2 が指定されている場合のみ）
  // 経理ビューEから戻った後は既に経理ビューAにいるため skipNav: true でサイドバーナビをスキップ
  if (current.className2 && current.className2.trim()) {
    I.say(`【クラス登録 2本目】${current.className2}（${current.courseCategory2}）`);
    await ShouldBeOnKeirisyoriScreenA(I, classMemberPageShimamura, { skipNav: true });
    await ShouldBeOnKeirisyoriScreenB(I, buildClassInput(current, '2'));
    await ShouldBeOnKeirisyoriScreenE(I);
  }

  // Step3.5: 運営管理費の金額確認（expectedKanrihi が指定されている場合のみ）
  // 同一店舗内の複数スクールコース登録により、最大額1件のみ確定していることを検証する
  // expectedLoserClass 指定時（同額tie-breakパターン）は、金額の一致だけでは勝者を区別できないため
  // 未払いバナーのクラス別内訳で判定する verifyKanrihiWinnerByClassName を使う
  if (current.expectedKanrihi && String(current.expectedKanrihi).trim() && recordId) {
    const now = new Date();
    if (current.expectedLoserClass && String(current.expectedLoserClass).trim()) {
      await verifyKanrihiWinnerByClassName(I, recordId, {
        targetYear:  now.getFullYear(),
        targetMonth: now.getMonth() + 1,
        expectedWinnerClass: current.expectedWinnerClass,
        expectedLoserClass:  current.expectedLoserClass,
        expectedKanrihiBase: current.expectedKanrihi,
      });
    } else {
      const hasDiscountFlag = current.discount && String(current.discount).trim() === '1';
      await verifyKanrihiFee(I, recordId, {
        targetYear:  now.getFullYear(),
        targetMonth: now.getMonth() + 1,
        expectedKanrihiBase: current.expectedKanrihi,
        expectedClassName:   current.expectedWinnerClass,
        expectedDiscount:    hasDiscountFlag ? true : undefined,
      });
    }
  }

  // Step4: 退会処理（taikaiMonth が指定されている場合のみ）
  if (current.taikaiMonth && String(current.taikaiMonth).trim()) {
    const resolved = resolveRelativeMonth(current.taikaiYear, current.taikaiMonth);
    I.say(`【退会処理】${current.taikaiMonth} → ${resolved.year}/${resolved.month}`);
    await ShouldBeOnTaikai(I, classMemberPageShimamura, {
      taikaiYear:  resolved.year,
      taikaiMonth: resolved.month,
    });
  }
});
