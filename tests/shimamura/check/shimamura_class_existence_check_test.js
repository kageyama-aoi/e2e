/**
 * @fileoverview しまむら：クラス存在チェックのE2Eテスト
 *
 * `syokai_touroku_data.csv`（または `--profile` に応じたCSV）に含まれる `className` が
 * 事前に「クラス一覧」から検索できることを確認します。
 *
 * 受講生登録フローの途中で「クラスが無い」ことに気付くのを避けるための事前検知用テストです。
 *
 * **処理フロー**
 * - 1. 担当者アカウントでログイン（beforeShimamura）
 * - 2. クラス一覧へ遷移（IchiranPage.navigateToClassListPage）
 * - 3. CSV の `className` を検索して、検索結果に表示されることを確認
 *
 * **前提条件**
 * - 環境変数 `SHIMAMURA_TANTOUSYA` が設定されていること
 * - `data/shimamura/syokai_touroku_data.csv` が存在すること
 * - 実行時に `--profile` を指定する場合は `env/.env.<profile>` が存在すること
 *
 * **最終更新日**
 * - 2026-09-10
 */
const { loadCsvWithProfile } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = loadCsvWithProfile('syokai_touroku_data', 'shimamura');

// className の重複チェックを避ける（同名クラスの繰り返し確認をしない）
const uniqueClassRows = Array.from(
  new Map(
    csvData
      .filter((row) => row && row.className)
      .map((row) => [row.className, row])
  ).values()
);

Feature('クラス存在チェック（事前検知）');

Before(beforeShimamura);

Data(uniqueClassRows).Scenario('クラス存在チェック（事前検知） @dev', async ({ I, ichiranPageShimamura, current }) => {
  const className = current.className;
  I.say(`--- クラス存在チェック開始: ${className} ---`);

  await ichiranPageShimamura.navigateToClassListPage();
  ichiranPageShimamura.fillClassListSearchConditions({ name: className });
  ichiranPageShimamura.clickClassListSearchAndWait();  // 0件なら結果リンク待ちで失敗＝クラス未登録
  ichiranPageShimamura.verifyClassListRecordInResults(className);

  I.say(`✅ クラス存在OK: ${className}`);
});
