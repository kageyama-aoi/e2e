/**
 * @fileoverview shimamura 本日の入出金 検索テスト
 *
 * **テスト内容**
 * - 開いた時点で日付範囲が今日に絞られている
 * - 検索すると結果のページ送りが表示される（当日の入出金が無ければ0件でよい）
 *
 * **注意**
 * - 入出金一覧を「入出金日＝今日」で絞った画面なので、件数は実行日の入出金データしだい。
 *   結果の中身は入出金一覧のテスト（transaction_ichiran_test.js）で見る
 */

const { beforeShimamura } = require('../../../support/shimamura/hooks');

Feature('本日の入出金検索');

Before(beforeShimamura);

Scenario('本日の入出金は今日で絞られた状態で開き、検索できる @dev', async ({ I, ichiranPageShimamura }) => {
  await ichiranPageShimamura.navigateToTransactionTodayPage();
  await ichiranPageShimamura.verifyTransactionTodayPreset();
  await ichiranPageShimamura.clickTransactionTodaySearchAndWait();
  I.saveScreenshotWithTimestamp('transaction_today_ichiran_search', true);
});
