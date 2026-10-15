// support/shimamura/salesGroupTransferCheck.js の単体テスト。実行: npm run test:unit
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { normalize, isPaidInDb, predictServerChecks } = require('../../support/shimamura/salesGroupTransferCheck');

// testgcp の明細番号 14000000482 と同じ形（10月・11月とも現金で入金済み）
const paidRow = (id, tDate) => ({
  id, fee_name: `料金${id}`, due_date: '2026-10-01', t_date: tDate,
  in_amount: '6600', actual_in_amount: '6600', commission: '0', payment_type: 'cash',
});
const unpaidRow = (id) => ({
  id, fee_name: `料金${id}`, due_date: '2026-10-01', t_date: null,
  in_amount: '6600', actual_in_amount: '0', commission: '0', payment_type: null,
});

test('normalize: null は空文字、数字のカンマは外す、"" と "0" は別物', () => {
  assert.strictEqual(normalize(null), '');
  assert.strictEqual(normalize('6,600'), '6600');
  assert.strictEqual(normalize(6600), '6600');
  assert.strictEqual(normalize('2026-10-01'), '2026-10-01');
  assert.notStrictEqual(normalize(''), normalize('0'));
});

test('isPaidInDb: 入金額・入金日・支払方法のどれかがあれば入金済み', () => {
  assert.strictEqual(isPaidInDb(paidRow('a', '2026-10-02')), true);
  assert.strictEqual(isPaidInDb(unpaidRow('b')), false);
  assert.strictEqual(isPaidInDb({ ...unpaidRow('c'), payment_type: 'cash' }), true);
});

test('predictServerChecks: 何も変えなければ何にも当たらない', () => {
  const db = [paidRow('a', '2026-10-02'), paidRow('b', '2026-10-01')];
  const sent = db.map((r) => ({ ...r, actual_in_amount: '6,600' }));
  const result = predictServerChecks(db, sent);
  assert.deepStrictEqual(result.map((r) => r.predicted), [[], []]);
});

test('predictServerChecks: 入金済みの行の入金額が増えると Check2（分配の余りが最後の行に足される経路）', () => {
  const db = [paidRow('a', '2026-10-02'), paidRow('b', '2026-10-01')];
  const sent = [{ ...db[0] }, { ...db[1], actual_in_amount: '7600' }];
  const [first, last] = predictServerChecks(db, sent);
  assert.deepStrictEqual(first.predicted, []);
  assert.deepStrictEqual(last.diffs, [{ field: 'actual_in_amount', db: '6600', sent: '7600' }]);
  assert.deepStrictEqual(last.predicted, ['Check2 既に入金済みのため、入金処理は不可です']);
});

test('predictServerChecks: カード入金済みの行が「現金」で送られると Check2', () => {
  const db = [{ ...paidRow('a', '2026-06-10'), payment_type: 'credit' }];
  const sent = [{ ...db[0], payment_type: 'cash' }];
  assert.deepStrictEqual(predictServerChecks(db, sent)[0].predicted, ['Check2 既に入金済みのため、入金処理は不可です']);
});

test('predictServerChecks: 未入金の行で入金額だけ入れ支払方法が空なら Check3 と Check5', () => {
  const db = [unpaidRow('a')];
  const sent = [{ ...db[0], t_date: '', actual_in_amount: '6600', payment_type: '' }];
  assert.deepStrictEqual(predictServerChecks(db, sent)[0].predicted, [
    'Check3 入金時には、支払方法を設定してください',
    'Check5 入金日は必須項目です',
  ]);
});

test('predictServerChecks: DB に無い id の行はそう書いて返す', () => {
  assert.deepStrictEqual(predictServerChecks([], [{ id: 'x' }])[0].predicted, ['DB に対応する行なし']);
});
