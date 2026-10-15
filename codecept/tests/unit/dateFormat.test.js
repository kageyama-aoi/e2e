// support/dateFormat.js の単体テスト。実行: npm run test:unit
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { pad2, formatDate, firstOfMonth } = require('../../support/dateFormat');

test('pad2: 1桁は0を足す・2桁はそのまま・文字列の前後の空白は落とす', () => {
  assert.strictEqual(pad2(5), '05');
  assert.strictEqual(pad2(12), '12');
  assert.strictEqual(pad2(' 3 '), '03');
});

test('formatDate: 記号を置き換え、それ以外の文字は残す', () => {
  const d = new Date(2026, 0, 5, 9, 3, 7); // 2026-01-05 09:03:07
  assert.strictEqual(formatDate(d, 'YYYY-MM-DD'), '2026-01-05');
  assert.strictEqual(formatDate(d, 'YYYYMMDD'), '20260105');
  assert.strictEqual(formatDate(d, 'YYYY/MM'), '2026/01');
  assert.strictEqual(formatDate(d, 'MMDDhhmm'), '01050903');
  assert.strictEqual(formatDate(d, 'YYYYMMDD_hhmmss'), '20260105_090307');
});

test('firstOfMonth: 月末から1か月後でも翌月の1日になる', () => {
  const jan31 = new Date(2026, 0, 31);
  assert.strictEqual(formatDate(firstOfMonth(1, jan31), 'YYYY-MM-DD'), '2026-02-01');
  assert.strictEqual(formatDate(firstOfMonth(2, new Date(2026, 11, 31)), 'YYYY-MM-DD'), '2027-02-01');
});

test('firstOfMonth: 年をまたいで前後する', () => {
  assert.strictEqual(formatDate(firstOfMonth(-1, new Date(2026, 0, 15)), 'YYYY-MM'), '2025-12');
  assert.strictEqual(formatDate(firstOfMonth(1, new Date(2026, 11, 15)), 'YYYY-MM'), '2027-01');
  assert.strictEqual(formatDate(firstOfMonth(0, new Date(2026, 9, 15)), 'YYYY-MM-DD'), '2026-10-01');
});
