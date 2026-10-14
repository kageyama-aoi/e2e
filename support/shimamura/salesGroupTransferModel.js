'use strict';

/**
 * 料金明細 編集画面（入金入力モード）の仕様モデル（#287）。
 *
 * テストケース（初期状態＋操作）を受け取り、デシジョンテーブルの定義
 * （data/shimamura/sales_group_transfer_dt.js）の decide を
 *   DT-04（各行の支払方法の送る値）→ DT-01（画面側チェック）→ DT-03（行ごとのサーバーチェック）→ DT-02（明細全体）
 * の順に当てて、期待結果と、通ったルール（縮約版の R 番号）を返す。
 * テストはこの期待結果と実際の画面を比べ、生成スクリプトは通ったルールを仕様書のテストケース一覧に書く。
 *
 * 値は定義ファイルの記号のまま扱う（t: TODAY/OTHER/INVALID/''、a: FULL/'0'、p: cash/card/''、due: DUE/OTHER）。
 */

const { expandTable, findCollapsedRule } = require('../decisionTable');

const SELECT_OPTIONS = ['cash', '']; // この画面の支払方法の選択肢（payment_types）
const isZero = (a) => a === '0' || a === '';

/**
 * @param {Object} def 定義（sales_group_transfer_dt.js）
 * @returns {Object<string, {table: Object, expanded: Object}>}
 */
function expandAll(def) {
  return Object.fromEntries(def.tables.map((t) => [t.id, { table: t, expanded: expandTable(t) }]));
}

/**
 * テストケースを評価する。
 * @param {Object} def 定義
 * @param {Object} tc テストケース
 * @param {Object} [cache] expandAll の結果（省略時は作る）
 * @returns {{outcome: Object, trace: Array<{table: string, rule: number, row: (number|undefined), actions: Array<string>}>, rows: Array<Object>}}
 *   outcome.kind: 'alerts'（画面側で止まる）/ 'serverErrors'（行ごとのエラーで戻る）/ 'saved' / 'observed' / 'unknown'
 */
function evaluateCase(def, tc, cache = expandAll(def)) {
  const fixture = def.fixtures[tc.fixture];
  if (!fixture) throw new Error(`${tc.id}: 初期状態がありません ${tc.fixture}`);
  const trace = [];
  const apply = (tableId, c, row) => {
    const { table, expanded } = cache[tableId];
    const col = findCollapsedRule(table, expanded, c);
    if (!col.valid) throw new Error(`${tc.id}: ${tableId} の N/A の組み合わせになった（行 ${row}）`);
    trace.push({ table: tableId, rule: col.no, row, actions: col.actions });
    return col.actions;
  };

  // DT-04: 各行の支払方法の送る値（締日より前に入金済みで編集できない行は、締日を模擬したときだけ）
  const rows = fixture.rows.map((db, i) => {
    const textOnly = Boolean(tc.simulateShimebi) && db.t !== '';
    const acts = apply('DT-04', { C11: textOnly, C12: SELECT_OPTIONS.includes(db.p) }, i);
    const p = acts.includes('A12') ? db.p : acts.includes('A13') ? SELECT_OPTIONS[0] : '';
    const sent = { t: db.t, a: textOnly && isZero(db.a) ? '' : db.a, p, due: db.due };
    const edit = (tc.edit || {})[i];
    if (edit) {
      if (textOnly) throw new Error(`${tc.id}: 締日より前に入金済みの行（${i}）は編集できません`);
      Object.assign(sent, edit);
    }
    return { index: i, db, sent, textOnly };
  });

  if (tc.mode === 'observe') {
    return { outcome: { kind: 'observed', sentPayments: rows.map((r) => r.sent.p) }, trace, rows };
  }

  // DT-01: 画面側チェック
  const inputRows = rows.filter((r) => !r.textOnly);
  const lastInput = inputRows.length ? inputRows[inputRows.length - 1].index : -1;
  const client = apply('DT-01', {
    C1: rows.some((r) => r.textOnly && r.index < lastInput),
    C2: inputRows.some((r) => r.sent.t === 'INVALID'),
    C3: inputRows.some((r) => !isZero(r.sent.a) && r.sent.t === ''),
  });
  if (client.includes('A1') || client.includes('A2')) {
    // alert は「入金日を入力してください。」→「入金日の入力形式が不正です。」の順に出る
    const alerts = ['A2', 'A1'].filter((a) => client.includes(a));
    return { outcome: { kind: 'alerts', alerts }, trace, rows };
  }
  if (client.includes('A4')) return { outcome: { kind: 'unknown' }, trace, rows };

  // DT-03: 行ごとのサーバーチェック（入金予定額・手数料はこの画面のテストでは変えない）
  const rowResults = rows.map((r) => {
    const { db, sent } = r;
    const acts = apply('DT-03', {
      C6: !isZero(db.a) || db.t !== '' || db.p !== '',
      C7: ['t', 'a', 'p', 'due'].some((k) => sent[k] !== db[k]),
      C8: sent.t === '',
      C9: sent.t !== '' || !isZero(sent.a),
      C10: sent.p === '',
    }, r.index);
    return { row: r.index, actions: acts.filter((a) => ['A8', 'A9', 'A10'].includes(a)) };
  });
  const errors = rowResults.filter((r) => r.actions.length);

  // DT-02: 明細全体（POS 送信済みの行はテストでは作らない）
  const whole = apply('DT-02', { C4: false, C5: errors.length > 0 });
  if (whole.includes('A6')) return { outcome: { kind: 'serverErrors', errors }, trace, rows };
  return { outcome: { kind: 'saved' }, trace, rows };
}

/**
 * 通ったルールを「DT-01 R5 → DT-02 R2 → DT-03 R4（行1）・R13（行2〜4）／DT-04 R2」の形にまとめる。
 * 行番号は画面の上からの1始まり。
 * @param {Array<{table: string, rule: number, row: (number|undefined)}>} trace
 * @returns {string}
 */
function formatTrace(trace) {
  const order = ['DT-04', 'DT-01', 'DT-02', 'DT-03'];
  return order.filter((t) => trace.some((x) => x.table === t)).map((t) => {
    const items = trace.filter((x) => x.table === t);
    const byRule = new Map();
    items.forEach((x) => {
      if (!byRule.has(x.rule)) byRule.set(x.rule, []);
      if (x.row !== undefined) byRule.get(x.rule).push(x.row + 1);
    });
    const parts = [...byRule].map(([rule, rowsOf]) => (rowsOf.length ? `R${rule}（行${compactRows(rowsOf)}）` : `R${rule}`));
    return `${t} ${parts.join('・')}`;
  }).join(' → ');
}

function compactRows(nums) {
  const s = [...new Set(nums)].sort((a, b) => a - b);
  if (s.length > 1 && s[s.length - 1] - s[0] === s.length - 1) return `${s[0]}〜${s[s.length - 1]}`;
  return s.join('・');
}

module.exports = { expandAll, evaluateCase, formatTrace };
