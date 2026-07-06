/**
 * @fileoverview しまむら：受講生退会処理のE2Eテスト
 *
 * CSVデータに基づいて複数の受講生に対する退会処理を自動実行します。
 *
 * **処理フロー**
 * - 1. 担当者アカウントでログイン（autoLogin）
 * - 2. `taikai_testdata.csv` を読み込み
 * - 3. 各レコードで受講生検索 → 退会処理画面 → 最終在籍年月を入力して更新
 *
 * **動的日付フィールド**
 * - `taikaiYear`/`taikaiMonth`（退会最終在籍年月）は退会処理側のルール「先月まで許容・先々月以前はNG」に
 *   対応するため、CSV記載値が範囲外の場合は `resolveDynamicDateIfPast`（graceMonths: 1）で
 *   本日日付に自動補正される（置換発生時は `I.say` でログに記録される）。
 *
 * **前提条件**
 * - 環境変数 `SHIMAMURA_TANTOUSYA` が設定されていること
 * - `data/shimamura/taikai_testdata.csv` が存在すること
 * - 実行時に `--profile` を指定する場合は `env/.env.<profile>` が存在すること
 *
 * **最終更新日**
 * - 2026-01-27
 */
const { loadCsvWithProfile } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { resolveDynamicDateIfPast } = require('../../../support/shimamura/utils');
const { fillTaikaiFormAndSubmit } = require('../../../pages/shimamura/flow/SyokaiFlowPage');

Feature('退会処理 (@dev)');

Before(beforeShimamura);

/**
 * 一連の退会処理フローを実行する
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} classMemberPageShimamura - ClassMember ページオブジェクト
 * @param {Object} data - テストデータ
 * @param {string} data.idnumber - 受講生番号
 * @param {string} data.taikaiYear - 最終在籍年
 * @param {string} data.taikaiMonth - 最終在籍月
 */
async function runTaikaiFlow(I, classMemberPageShimamura, { idnumber, taikaiYear, taikaiMonth }) {
  I.say(`--- テスト開始: 対象受講生 ${idnumber} ---`);

  // 管理タブ -> 受講生検索へ
  await classMemberPageShimamura.navigateToAdminTab(I, '受講生', '受講生検索');

  // 受講生検索 → 詳細 → 退会画面へ
  // （経理処理未完了データの警告解消は navigateToTaikaiScreen 内で行う）
  await classMemberPageShimamura.searchStudentAndOpenDetail(idnumber);
  await classMemberPageShimamura.navigateToTaikaiScreen();

  // 退会入力 & 更新（フォーム操作は SyokaiFlowPage.js と共通化）
  // 退会処理は「先月まで許容・先々月以前はNG」のため graceMonths: 1 で補正
  const resolvedTaikaiDate = resolveDynamicDateIfPast(
    I,
    `${taikaiYear}-${String(taikaiMonth).padStart(2, '0')}-01`,
    'taikaiYear/taikaiMonth',
    { graceMonths: 1 }
  );
  const [resolvedYear, resolvedMonth] = resolvedTaikaiDate.split('-');
  await fillTaikaiFormAndSubmit(I, { taikaiYear: resolvedYear, taikaiMonth: resolvedMonth });

  // スクリーンショット（idnumber付きだと追いやすい）
  I.saveScreenshotWithTimestamp(`CLASS_MEMBER_TAIKAI_${idnumber}.png`);

  I.say(`--- テスト正常終了: 退会処理 idnumber=${idnumber} ---`);
}



Scenario('受講生退会 @dev', async ({ I, classMemberPageShimamura }) => {

  const testDataList = loadCsvWithProfile('taikai_testdata', 'shimamura');

  I.say(`CSVテストデータ件数: ${testDataList.length}件`);

  for (const data of testDataList) {
    const { idnumber, taikaiYear, taikaiMonth } = data;

    if (!idnumber) {
      I.say('⚠️ idnumber が空の行をスキップ');
      continue;
    }

    await runTaikaiFlow(I, classMemberPageShimamura, {
      idnumber,
      taikaiYear,
      taikaiMonth,
    });
  }

  I.say('=== 全テストデータ分の退会処理シナリオ完了 ===');
});
