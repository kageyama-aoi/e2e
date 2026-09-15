/**
 * @fileoverview 講師謝礼計算 一括処理テスト
 *
 * **テスト内容**
 * - 既定の対象年月・校舎で講師謝礼計算を実行し、結果メッセージが許容範囲内であることを確認する。
 *   既存データがあっても上書き成功する（重複エラーにならない）ため、毎回「講師謝礼計算処理が
 *   正常に完了しました。N人の講師の謝礼情報を作成しました。」を返す（実機確認済み）。
 *
 * **対象画面**: `shareiDetail/sw/teRewardCalc`（culture のみ）
 * **プロファイル**: culture_beta 専用（Issue #219）
 * **データソース**: `data/tframe/te_reward_calc_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - targetYM: 対象年月（任意・select value。空なら既定値のまま）
 * - school_area_id / school_branch_id: 校舎（任意・select value。空なら既定値のまま）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('te_reward_calc_data', 'tframe'),
  (row) => row.scenario
);

Feature('講師謝礼計算');

Data(csvData).Scenario('講師謝礼計算を実行できる @admin', async ({ I, chosekinPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  chosekinPage.navigateToTeRewardCalcPage();
  chosekinPage.fillTeRewardCalcConditions(current);
  await chosekinPage.clickTeRewardCalcAndVerify();
  I.saveScreenshotWithTimestamp('te_reward_calc', true);
});
