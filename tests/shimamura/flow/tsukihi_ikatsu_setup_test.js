/**
 * @fileoverview shimamura 月謝一括作成準備セットアップテスト #162
 *
 * **目的**
 * 月謝一括作成フローテストに必要な受講生（請求方法：銀行引落）を
 * testgcp 環境に準備し、クラスへ登録する。
 *
 * **処理フロー**
 * 1. 受講生の請求方法（bank_payment_type）・収納業者（shima_storage_id）を設定
 * 2. 受講生をクラスに登録（経理ビュー A/B 処理）
 *
 * **データソース**
 * - `data/shimamura/tsukihi_ikatsu_setup_data.csv`
 */
'use strict';

const {
  loadCsvWithProfile,
  withScenarioLabel,
  setBusinessLabels,
  attachBusinessContext,
} = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { runStudentPaymentSetup } = require('../../../pages/shimamura/flow/TsukihiIkatsuFlowPage');
const { runRegistrationFlow } = require('../../../pages/shimamura/flow/SyokaiFlowPage');

const csvData = withScenarioLabel(
  loadCsvWithProfile('tsukihi_ikatsu_setup_data', 'shimamura'),
  (row) => row.scenario
);

Feature('月謝一括作成準備（受講生・請求方法設定）');

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
    },
  });

  await runStudentPaymentSetup(I, current);

  const classInput = {
    lastName:        current.lastName,
    class_name01:    current.className,
    course_category: current.courseCategory,
    keiyaku_date:    current.keiyakuDate,
    kaishi_date:     current.kaishiDate,
  };
  await runRegistrationFlow(I, classMemberPageShimamura, classInput);
});
