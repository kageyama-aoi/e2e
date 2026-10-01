'use strict';

/**
 * 料金明細 編集画面（入金入力モード）の観察ランナー（保存しない・データを変えない）
 *
 * このファイルは通常のテストスイートには含まれない（`_test.js` 非末尾）。
 * 同じ明細番号で2行以上ある明細を開き、「入金分配」の前後で
 *   - 各行の画面の値（入力欄の .value）
 *   - 保存したら送られるはずの JSON（hidden sales_details。prepareForm を呼んで読むだけ）
 *   - DB の元の値との差分と、サーバーのチェック（Check2/3/5）に当たりそうか（予測）
 *   - 出た alert の文言
 * をログと JSON ファイル（output/sales_group_transfer_observe/）に残す。既定では保存ボタンは押さない
 * （`OBS_SAVE=1` のときだけ、最後に保存して本物の結果を記録する。**データが変わる**）。
 *
 * 実行例（引数は環境変数。値は ASCII だけなので文字化けしない）:
 *   SALESNO=14000000482 SALESNO_CONTACT_ID=29TK202510046 OBS_IN_AMOUNT=1000 \
 *     npx codeceptjs run ./tests/shimamura/util/sales_group_transfer_observe.js --profile shimamura.testgcp
 *
 * | 環境変数 | 意味 | 省略時 |
 * |---|---|---|
 * | SALESNO | 明細番号（record） | 14000000482（testgcp の確認用データ：ピアノルーム10月・11月、2行とも入金済み） |
 * | SALESNO_CONTACT_ID | 受講生番号（salesno_contactid） | 29TK202510046 |
 * | OBS_T_DATE | 上段の入金日 | 画面の初期値（当日） |
 * | OBS_IN_AMOUNT | 上段の入金額 | 「バランスを入力」を押す（合計バランスを写す。0 なら空のまま） |
 * | OBS_COMMISSION | 上段の手数料 | 入れない |
 * | OBS_PAYMENT_TYPE | 上段の支払方法（option の value） | cash |
 * | OBS_SIMULATE_SHIMEBI | 締日を模擬（YYYY-MM-DD。ブラウザ側で応答を書き換えるだけ） | 模擬しない |
 * | OBS_MODE | `manual` なら入金分配を使わず、入金日が空の入力欄の行へ直接入力する（入金日=上段の入金日・入金額=入金予定額・支払方法=現金）。問い合わせの「分配しなくても起きるか」の確認用（#284） | 入金分配（divide） |
 * | OBS_SAVE | `1` なら最後に保存して、保存後の画面とメッセージを記録する（**データが変わる**。締日の模擬中は使えない） | 保存しない |
 *
 * 入金済みの明細で OBS_IN_AMOUNT を入れると、分配しきれない余りが最後の行に足される経路
 * （Issue の仮説 B）を観察できる。
 * OBS_SIMULATE_SHIMEBI に「ある行の入金日より後の日付」を入れると、その行が締日前の文字表示行になり、
 * 保存前チェックの例外（仮説 D）と支払方法が空で送られる件（仮説 E）を観察できる。
 */

const fs = require('fs');
const path = require('path');
const repoRoot = require('../../../support/repoRoot');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { predictServerChecks } = require('../../../support/shimamura/salesGroupTransferCheck');

const TARGET = {
  salesno: process.env.SALESNO || '14000000482',
  contactId: process.env.SALESNO_CONTACT_ID || '29TK202510046',
  simulateShimebi: process.env.OBS_SIMULATE_SHIMEBI || undefined,
};
const TOP_INPUT = {
  tDate: process.env.OBS_T_DATE || undefined,
  inAmount: process.env.OBS_IN_AMOUNT || undefined,
  commission: process.env.OBS_COMMISSION || undefined,
  paymentType: process.env.OBS_PAYMENT_TYPE || 'cash',
};
const SAVE = process.env.OBS_SAVE === '1';
const MODE = process.env.OBS_MODE || 'divide';
if (!['divide', 'manual'].includes(MODE)) throw new Error(`OBS_MODE は divide か manual: ${MODE}`);
if (SAVE && TARGET.simulateShimebi) throw new Error('OBS_SAVE と OBS_SIMULATE_SHIMEBI は同時に使えません（模擬した画面で保存しない）');

Feature('shimamura 料金明細 編集画面（入金）の観察');

Before(beforeShimamura);

Scenario('入金分配の前後で画面の値と送信 JSON を記録する（OBS_SAVE=1 のときだけ保存）', async ({ I, salesGroupTransferPageShimamura }) => {
  const page = salesGroupTransferPageShimamura;
  await page.openTransferEdit(TARGET);

  const before = await page.grabScreenState();
  I.say(`【観察】締日=${before.shimebi} / 行数=${before.rows.length}`);
  logRows(I, '分配前', before.rows);
  const previewBefore = await page.grabSaveRequestPreview();

  if (MODE === 'manual') {
    // 入金分配を使わず、未入金（入金日が空）の入力欄の行へ直接入力する
    const tDate = TOP_INPUT.tDate || before.top.top_t_date;
    for (const row of before.rows.filter((r) => r.editable && !r.t_date)) {
      I.say(`【観察】手入力 #${row.index} ${row.description} 入金日=${tDate} 入金額=${row.in_amount}`);
      await page.fillRowPayment(row.index, { tDate, actualInAmount: row.in_amount, paymentType: 'cash' });
    }
  } else {
    page.fillTopInput(TOP_INPUT);
    if (TOP_INPUT.inAmount === undefined) page.clickCopyBalance();
    page.clickDivideTransfer();
  }

  const after = await page.grabScreenState();
  logRows(I, '分配後', after.rows);
  const previewAfter = await page.grabSaveRequestPreview();
  const sentRows = (previewAfter.salesDetails && previewAfter.salesDetails.transactions) || [];
  const predictions = predictServerChecks(before.initial, sentRows);

  I.say(`【観察】上段=${JSON.stringify(after.top)}`);
  I.say(`【観察】保存前チェック flag=${previewAfter.checkFlag} 例外=${previewAfter.checkError || 'なし'}`);
  after.alerts.forEach((msg) => I.say(`【観察】alert: ${msg}`));
  predictions.forEach((p) => {
    I.say(`【観察】${p.fee_name}（DB入金済み=${p.paidInDb}）差分=${p.diffs.map((d) => `${d.field}:${d.db}→${d.sent}`).join(', ') || 'なし'}`);
    I.say(`        予測: ${p.predicted.join(' / ') || 'チェックに当たらない'}`);
  });

  let saveResult = null;
  if (SAVE) {
    I.say('【観察】OBS_SAVE=1 のため保存する（データが変わる）');
    saveResult = await page.clickSaveAndGrabResult();
  }

  const outDir = path.join(repoRoot, 'output', 'sales_group_transfer_observe');
  fs.mkdirSync(outDir, { recursive: true });
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const outFile = path.join(outDir, `${TARGET.salesno}_${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify({
    target: TARGET, mode: MODE, topInput: TOP_INPUT, before, previewBefore, after, previewAfter, predictions, saveResult,
  }, null, 2), 'utf8');
  I.say(`【観察】記録: ${path.relative(repoRoot, outFile)}`);
  I.saveScreenshotWithTimestamp('SALES_GROUP_TRANSFER_OBSERVE', true);
});

/**
 * 行の値を1行ずつログに出す。
 * @param {CodeceptJS.I} I
 * @param {string} label
 * @param {Array<Object>} rows
 */
function logRows(I, label, rows) {
  rows.forEach((r) => {
    I.say(`【${label}】#${r.index}${r.editable ? '' : '(締日前・表示のみ)'} ${r.description}`
      + ` 予定=${r.in_amount} 締切=${r.due_date} 入金日=${r.t_date} 入金額=${r.actual_in_amount}`
      + ` 手数料=${r.commission} バランス=${r.balance} 支払=${r.payment_type}`);
  });
}
