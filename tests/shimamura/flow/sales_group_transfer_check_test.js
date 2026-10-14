/**
 * @fileoverview 料金明細 編集画面（入金入力モード）の保存時チェック・正常保存のテスト（#287）
 *
 * **テストケースはデシジョンテーブルの定義から読む**（data/shimamura/sales_group_transfer_dt.js）。
 * 期待結果は仕様モデル（support/shimamura/salesGroupTransferModel.js）が表から決めるので、ここには書かない。
 * 仕様書 docs/shimamura/concepts/料金明細入金チェックの仕様.md の ⑤ が同じ定義から生成した一覧。
 *
 * **データ**
 * 明細（同じ明細番号に4行・1行目だけ入金済み）を SalesGroupTransferFlowPage で作る。
 * - エラーになるケース・観察だけのケースはデータを変えないので、初期状態ごとに1つ作って使い回す
 * - 保存が成功するケース（`mutates: true`）は、毎回新しい明細を作る
 * 1回の実行で testgcp の受講生を3人ほど使う。
 *
 * **印**
 * - `@known-bug`: 問い合わせの不具合（カード入金の行が「現金」で送られる）。今の動きを期待値にしている。直ったら落ちる
 *
 * 実行例:
 *   npx codeceptjs run ./tests/shimamura/flow/sales_group_transfer_check_test.js --profile shimamura.testgcp
 *   npx codeceptjs run ./tests/shimamura/flow/sales_group_transfer_check_test.js --profile shimamura.testgcp --grep "TC-15"
 */
'use strict';

const assert = require('assert');
const { withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const def = require('../../../data/shimamura/sales_group_transfer_dt');
const { expandAll, evaluateCase, formatTrace } = require('../../../support/shimamura/salesGroupTransferModel');
const flow = require('../../../pages/shimamura/flow/SalesGroupTransferFlowPage');

const cache = expandAll(def);
/** 初期状態ごとに作った明細（データを変えないケースで使い回す） */
const sharedStatements = {};

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (s, n) => { const d = new Date(`${s}T00:00:00`); d.setDate(d.getDate() + n); return ymd(d); };

/**
 * 定義の記号を画面に入れる値にする。
 * @param {string} field t / a / p / due
 * @param {string} symbol
 * @param {Object} row 画面の行（grabScreenState().rows[i]）
 * @returns {string}
 */
function resolveValue(field, symbol, row) {
  const today = ymd(new Date());
  if (field === 't') return { TODAY: today, OTHER: addDays(today, -1), INVALID: '2026-13-01', '': '' }[symbol];
  if (field === 'a') return symbol === 'FULL' ? row.in_amount : symbol;
  if (field === 'due') return symbol === 'OTHER' ? addDays(row.due_date, 1) : row.due_date;
  return symbol; // p: cash / ''
}

const FIELD_ARG = { t: 'tDate', a: 'actualInAmount', p: 'paymentType', due: 'dueDate' };

const cases = withScenarioLabel(def.testCases, (tc) => `${tc.id} ${tc.title} ${(tc.tags || []).join(' ')}`.trim());

Feature('料金明細 編集画面（入金）の保存時チェック');

Before(beforeShimamura);

Data(cases).Scenario('デシジョンテーブルのテストケース', async ({
  I, current, contactRegisterPageShimamura, classMemberPageShimamura, salesGroupTransferPageShimamura,
}) => {
  const tc = current;
  const page = salesGroupTransferPageShimamura;
  const { outcome, trace } = evaluateCase(def, tc, cache);
  I.say(`【${tc.id}】通るルール: ${formatTrace(trace)}`);
  if (outcome.kind === 'unknown') throw new Error(`${tc.id}: 期待結果が決まらないケースはテストにしない（定義を見直す）`);

  // 明細を用意する（データを変えないケースは使い回す）
  const fixture = def.fixtures[tc.fixture];
  const pages = { contactRegisterPageShimamura, classMemberPageShimamura, salesGroupTransferPageShimamura };
  let statement = tc.mutates ? null : sharedStatements[tc.fixture];
  if (!statement) {
    statement = await flow.createPaidFirstRowStatement(pages, { firstRowPayment: fixture.firstRowPayment });
    if (!tc.mutates) sharedStatements[tc.fixture] = statement;
  }

  await page.openTransferEdit({
    salesno: statement.salesno,
    contactId: statement.contactId,
    simulateShimebi: tc.simulateShimebi ? addDays(ymd(new Date()), 1) : undefined,
  });
  const state = await page.grabScreenState();
  assert.strictEqual(state.rows.length, fixture.rows.length, `${tc.id}: 明細の行数が初期状態と違う`);
  assert.strictEqual(state.initial[0].payment_type, fixture.firstRowPayment, `${tc.id}: 1行目の支払方法が初期状態と違う（前のケースでデータが変わった可能性）`);

  // 操作
  for (const [rowIndex, edit] of Object.entries(tc.edit || {})) {
    const row = state.rows[Number(rowIndex)];
    const values = Object.fromEntries(Object.entries(edit).map(([k, v]) => [FIELD_ARG[k], resolveValue(k, v, row)]));
    I.say(`【${tc.id}】行${Number(rowIndex) + 1}（${row.description}）に入力: ${JSON.stringify(values)}`);
    await page.fillRowPayment(row.index, values);
  }

  // 結果の確認
  if (outcome.kind === 'observed') {
    const preview = await page.grabSaveRequestPreview();
    const sent = preview.salesDetails.transactions.map((t) => t.payment_type || '');
    assert.deepStrictEqual(sent, outcome.sentPayments, `${tc.id}: 送る支払方法`);
    return;
  }

  const result = await page.clickSaveAndGrabResult();
  // 期待どおりでないのに保存されたら、使い回している明細はもう使えない
  if (result.saved && outcome.kind !== 'saved') delete sharedStatements[tc.fixture];

  if (outcome.kind === 'alerts') {
    const expected = outcome.alerts.map((id) => def.actions.find((a) => a.id === id).alert);
    assert.deepStrictEqual(result.alerts, expected, `${tc.id}: alert`);
    assert.strictEqual(result.saved, false, `${tc.id}: 画面側で止まるはずが保存された`);
  } else if (outcome.kind === 'serverErrors') {
    assert.strictEqual(result.saved, false, `${tc.id}: エラーになるはずが保存された`);
    const text = result.messages.join(' ');
    for (const e of outcome.errors) {
      for (const id of e.actions) {
        const msg = def.actions.find((a) => a.id === id).message.replace('{fee}', state.initial[e.row].fee_name);
        assert.ok(text.includes(msg), `${tc.id}: メッセージ「${msg}」が出ていない。実際: ${text}`);
      }
    }
    // 期待していない行のエラーが出ていないこと（料金名で見る）
    const errorRows = new Set(outcome.errors.map((e) => e.row));
    state.initial.forEach((r, i) => {
      if (!errorRows.has(i)) assert.ok(!text.includes(`(料金名:${r.fee_name})`), `${tc.id}: 行${i + 1}（${r.fee_name}）にエラーが出た: ${text}`);
    });
  } else if (outcome.kind === 'saved') {
    assert.strictEqual(result.saved, true, `${tc.id}: 保存できるはずがエラー: ${result.messages.join(' / ') || result.alerts.join(' / ')}`);
  }
});
