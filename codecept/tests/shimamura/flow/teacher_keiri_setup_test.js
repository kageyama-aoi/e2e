/**
 * @fileoverview shimamura 講師バリエーション準備セットアップテスト #144
 *
 * **目的**
 * 講師謝礼フローテストに必要な講師バリエーション（内部/外注 × 課税/免税）を
 * testgcp 環境に登録し、経理タブ（EW_AccountingTab_AN）に口座・課税区分を設定する。
 *
 * **処理フロー**
 * 1. 講師コードで既存レコードを検索
 * 2. 未登録の場合のみ新規登録（基本タブ: 姓・名・所属・ステイタス）
 * 3. 経理タブを設定（契約形態・支払方法・口座種別・口座番号・口座名義・課税区分・報酬区分）
 *
 * **データソース**
 * - `data/shimamura/teacher_variants.csv`
 *
 * **パターン**
 * | シナリオ | 所属 | 課税区分 |
 * |---|---|---|
 * | 内部_課税 | 内部講師（10） | 課税事業者（1） |
 * | 内部_免税 | 内部講師（10） | 免税事業者（0） |
 * | 外注_課税 | 外注講師（20） | 課税事業者（1） |
 * | 外注_免税 | 外注講師（20） | 免税事業者（0） |
 */
'use strict';

const {
  loadCsvWithProfile,
  withScenarioLabel,
  setBusinessLabels,
  attachBusinessContext,
} = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { runTeacherKeiriSetup } = require('../../../pages/shimamura/flow/TeacherKeiriFlowPage');

const csvData = withScenarioLabel(
  loadCsvWithProfile('teacher_variants', 'shimamura'),
  (row) => row.scenario
);

Feature('講師バリエーション準備（経理タブ設定）');

Before(beforeShimamura);

Data(csvData).Scenario('講師を登録し経理タブを設定する @dev @setup', async ({ I, current }) => {
  setBusinessLabels({
    epic:    '講師管理',
    feature: '講師バリエーション準備',
    story:   current.scenario,
  });
  attachBusinessContext({
    label: current.scenario,
    input: {
      idnumber:  current.idnumber,
      belong:    current.belong,
      tax_class: current.tax_class,
    },
  });

  await runTeacherKeiriSetup(I, current);
});
