// support/decisionTable.js と料金明細の仕様モデルの単体テスト（#287）。実行: npm run test:unit
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { expandTable, findCollapsedRule } = require('../../support/decisionTable');
const def = require('../../data/shimamura/sales_group_transfer_dt');
const { expandAll, evaluateCase, formatTrace } = require('../../support/shimamura/salesGroupTransferModel');

// 記法ガイド 第1部の例（送料判定）。ガイドの縮約版と同じになること
const shipping = {
  id: 'DT-01', conditions: ['C1', 'C2', 'C3'], actions: ['A1', 'A2', 'A3'],
  decide: (c) => (c.C1 || c.C3 ? ['A1'] : c.C2 ? ['A2'] : ['A3']),
  na: (c) => (c.C3 && !c.C2 ? '10,000円以上なら 5,000円以上' : null),
};

test('expandTable: 記法ガイドの送料判定の例を再現する', () => {
  const { full, collapsed } = expandTable(shipping);
  assert.strictEqual(full.length, 8);
  assert.deepStrictEqual(full.filter((r) => !r.valid).map((r) => r.no), [3, 7]);
  // ガイド: 実行 4 列 ＋ N/A 1 列、R1 は C2・C3 が DC で完全版 1,2,4（N/A 3）
  assert.strictEqual(collapsed.filter((c) => c.valid).length, 4);
  assert.strictEqual(collapsed.length, 5);
  assert.deepStrictEqual(collapsed[0].cube, [true, null, null]);
  assert.deepStrictEqual(collapsed[0].members, [1, 2, 4]);
  assert.deepStrictEqual(collapsed[0].naMembers, [3]);
  assert.deepStrictEqual(collapsed[4].naMembers, [7]);
});

test('findCollapsedRule: 条件の値から縮約版の列を引く', () => {
  const expanded = expandTable(shipping);
  assert.strictEqual(findCollapsedRule(shipping, expanded, { C1: true, C2: false, C3: false }).no, 1);
  assert.strictEqual(findCollapsedRule(shipping, expanded, { C1: false, C2: true, C3: false }).no, 3);
  assert.throws(() => findCollapsedRule(shipping, expanded, { C1: true }), /条件 C2/);
});

test('料金明細の表: 列数が仕様書と同じ', () => {
  const cache = expandAll(def);
  const sizes = Object.fromEntries(Object.entries(cache).map(([id, { expanded }]) => [id, [expanded.full.length, expanded.collapsed.length]]));
  assert.deepStrictEqual(sizes, {
    'DT-01': [8, 5], 'DT-02': [4, 3], 'DT-03': [32, 18], 'DT-04': [4, 3], 'DT-05': [16, 9],
  });
});

test('料金明細の仕様モデル: テストケースの期待結果', () => {
  const cache = expandAll(def);
  const summary = Object.fromEntries(def.testCases.map((tc) => {
    const { outcome } = evaluateCase(def, tc, cache);
    const detail = outcome.kind === 'alerts' ? outcome.alerts.join('+')
      : outcome.kind === 'serverErrors' ? outcome.errors.map((e) => `${e.row}:${e.actions.join('+')}`).join(' ')
        : outcome.kind === 'observed' ? outcome.sentPayments.join(',') : '';
    return [tc.id, `${outcome.kind} ${detail}`.trim()];
  }));
  assert.deepStrictEqual(summary, {
    // 段1: 1行・未入金
    'TC-01': 'alerts A1', 'TC-02': 'alerts A2', 'TC-03': 'alerts A2', 'TC-04': 'serverErrors 0:A9',
    'TC-05': 'serverErrors 0:A10', 'TC-06': 'serverErrors 0:A10', 'TC-07': 'saved',
    // 段2: 1行・現金で入金済み
    'TC-08': 'observed cash', 'TC-09': 'alerts A2', 'TC-10': 'serverErrors 0:A8', 'TC-11': 'serverErrors 0:A8+A9',
    'TC-12': 'serverErrors 0:A8+A10', 'TC-13': 'serverErrors 0:A8+A10',
    // 段3: 4行・混在
    'TC-14': 'alerts A2+A1', 'TC-15': 'serverErrors 1:A10', 'TC-16': 'saved', 'TC-17': 'serverErrors 0:A8',
    'TC-101': 'observed ,,,',
  });
});

test('料金明細の仕様モデル: 問い合わせのケースは DT-04 R3 を通る', () => {
  const tc = def.testCases.find((t) => t.id === 'TC-17');
  assert.match(formatTrace(evaluateCase(def, tc).trace), /DT-04 R3（行1）/);
});
