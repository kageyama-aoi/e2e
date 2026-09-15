/**
 * @fileoverview 講師謝礼合計計算 一括処理テスト
 *
 * **テスト内容**
 * - 講師謝礼計算（`shareiDetail/sw/teRewardCalc`）を先に実行してから、同じ計上年月で
 *   講師謝礼合計計算を実行し、結果メッセージが許容範囲内であることを確認する。
 *   先に謝礼計算を行わないと「処理対象の講師謝礼情報がありません。」（`tf-message-error`
 *   クラスだが実質は正常系）になるため、Arrange として謝礼計算を挟む（実機確認済み）。
 *
 * **対象画面**: `shareiTotal/sw/teRewardTotalCalc`（culture のみ）
 * **プロファイル**: culture_beta 専用（Issue #219）
 * **データソース**: `data/tframe/te_reward_total_calc_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario: シナリオラベル（必須）
 * - postingYearMonth: 計上年月（任意・select value。空なら既定値のまま。
 *   既定値は講師謝礼計算画面の targetYM の既定値と同じ選択肢順のため一致する想定）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('te_reward_total_calc_data', 'tframe'),
  (row) => row.scenario
);

Feature('講師謝礼合計計算');

Data(csvData).Scenario('講師謝礼合計計算を実行できる @admin', async ({ I, chosekinPage, keiriIchiranPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  // Arrange: 同じ計上年月の講師謝礼データを用意する
  chosekinPage.navigateToTeRewardCalcPage();
  await chosekinPage.clickTeRewardCalcAndVerify();

  keiriIchiranPage.navigateToTeRewardTotalCalcPage();
  keiriIchiranPage.fillTeRewardTotalCalcConditions(current);
  await keiriIchiranPage.clickTeRewardTotalCalcAndVerify();
  I.saveScreenshotWithTimestamp('te_reward_total_calc', true);
});
