/**
 * @fileoverview 料金明細の入金不具合（#279）の再現データ作成 #280
 *
 * **目的**
 * 同じ明細番号に入出金が2行以上あり、1行目だけ入金済み（支払方法はカード等に変更）の明細を作り、
 * その明細を料金明細 編集画面（入金モード）で開いたときに、保存したら送られる内容と
 * サーバーのチェックに当たりそうか（予測）を記録する。**明細画面での最後の保存はしない。**
 *
 * **処理フロー**
 * 1. 問合せ登録のフォーム送信で受講生を作る（請求方法=現金。受講生を1人消費する）
 * 2. 経理ビューでクラス（分類「スクール」）を適用して確定 → 月謝と運営管理費が同じ明細番号でできる
 *    （既定はフォーム送信。`SGT_UI=1` なら UI 操作）
 * 3. 料金明細 編集画面で1行目だけ現金で入金して保存
 * 4. 入出金の編集画面で1行目の支払方法を変える（既定 card。`SGT_FIRST_ROW_PAYMENT=cash` なら変えない）
 * 5. 同じ明細を開き直し、残りを「バランスを入力」→「入金分配」して送信内容を観察（保存しない）
 *
 * 結果は output/sales_group_transfer_setup/ に JSON で残る（明細番号・受講生番号・予測）。
 * 作った明細は観察ランナー（tests/shimamura/util/sales_group_transfer_observe.js）で何度でも見直せる。
 *
 * 実行例:
 *   npx codeceptjs run ./tests/shimamura/flow/sales_group_transfer_setup_test.js --profile shimamura.testgcp
 */
'use strict';

const fs = require('fs');
const path = require('path');
const repoRoot = require('../../../support/repoRoot');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { predictServerChecks } = require('../../../support/shimamura/salesGroupTransferCheck');
const flow = require('../../../pages/shimamura/flow/SalesGroupTransferFlowPage');

/** 分類「スクール」でコースが紐づいたクラス（月謝一括作成準備と同じ。月謝＋運営管理費ができる） */
const CLASS = { className: 'ピアノ水曜日_02', courseCategory: 'スクール' };
const FIRST_ROW_PAYMENT = process.env.SGT_FIRST_ROW_PAYMENT || 'card';
/** 経理ビューを UI 操作で通す（既定はフォーム送信版。比較・UI 経路の確認用） */
const BY_SUBMIT = process.env.SGT_UI !== '1';

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

Feature('料金明細の入金不具合 再現データ作成');

Before(beforeShimamura);

Scenario('同一明細番号で1行目だけ入金済みの明細を作り、入金分配の送信内容を観察する @setup', async ({
  I, contactRegisterPageShimamura, classMemberPageShimamura, salesGroupTransferPageShimamura,
}) => {
  const date = today();

  // 1〜2: 受講生を作ってクラスを適用
  const { contactId, lastName } = await flow.createStudent(contactRegisterPageShimamura);
  I.say(`【明細データ】受講生 ${lastName} 受講生番号=${contactId}`);
  await flow.enrollClass(classMemberPageShimamura, contactId, { ...CLASS, keiyakuDate: date, kaishiDate: date, bySubmit: BY_SUBMIT });

  const rows = await flow.grabTransactionRows(contactId);
  rows.forEach((r) => I.say(`  入出金: ${r.salesno} ${r.feeName} 予定=${r.inAmount} 入金日=${r.tDate} 方法=${r.paymentLabel}`));
  const salesno = flow.pickMultiRowSalesno(rows);
  if (!salesno) throw new Error(`同じ明細番号の行が2行以上ありません（クラスにコースが紐づいているか確認）: ${rows.length}行`);
  I.say(`【明細データ】対象の明細番号=${salesno}`);

  // 3: 1行目だけ入金
  const { paidTransactionId, paidFeeName } = await flow.payFirstRow(salesGroupTransferPageShimamura, { salesno, contactId, tDate: date });

  // 4: 1行目の支払方法を変える（裏技）
  if (FIRST_ROW_PAYMENT !== 'cash') {
    await flow.changeTransactionPaymentType({ transactionId: paidTransactionId, paymentType: FIRST_ROW_PAYMENT });
  }

  // 5: 開き直して、残りを入金分配した送信内容を観察（保存しない）
  const page = salesGroupTransferPageShimamura;
  await page.openTransferEdit({ salesno, contactId });
  const before = await page.grabScreenState();
  page.clickCopyBalance();
  page.clickDivideTransfer();
  const after = await page.grabScreenState();
  const preview = await page.grabSaveRequestPreview();
  const sentRows = (preview.salesDetails && preview.salesDetails.transactions) || [];
  const predictions = predictServerChecks(before.initial, sentRows);

  before.initial.forEach((r, i) => {
    const shown = after.rows[i] || {};
    I.say(`【観察】${r.fee_name} DB支払方法=${r.payment_type || '(空)'} 画面の支払方法=${shown.payment_type || '(空)'} 入金日=${shown.t_date}`);
  });
  predictions.forEach((p) => I.say(`【予測】${p.fee_name}: ${p.predicted.join(' / ') || 'チェックに当たらない'}`
    + `（差分 ${p.diffs.map((d) => `${d.field}:${d.db}→${d.sent}`).join(', ') || 'なし'}）`));

  const outDir = path.join(repoRoot, 'output', 'sales_group_transfer_setup');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${salesno}.json`);
  fs.writeFileSync(outFile, JSON.stringify({
    createdAt: new Date().toISOString(), contactId, lastName, salesno, paidTransactionId, paidFeeName,
    firstRowPayment: FIRST_ROW_PAYMENT, rows, before, after, preview, predictions,
  }, null, 2), 'utf8');
  I.say(`【明細データ】記録: ${path.relative(repoRoot, outFile)}`);
  I.saveScreenshotWithTimestamp('SALES_GROUP_TRANSFER_SETUP', true);
});
