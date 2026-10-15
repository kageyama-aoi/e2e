// support/shimamura/constants.js の pageUrl の単体テスト。実行: npm run test:unit
'use strict';

const test = require('node:test');
const assert = require('node:assert');

// BASE_URL は require 時に読まれるので、先に env を決めてから読み込む
process.env.BASE_URL = 'https://example.com/testgcp';
const { pageUrl, BASE_URL } = require('../../support/shimamura/constants');

test('BASE_URL は末尾スラッシュ付きに整う', () => {
  assert.strictEqual(BASE_URL, 'https://example.com/testgcp/');
});

test('pageUrl: module・action の後ろに、書いた順でパラメータが並ぶ', () => {
  assert.strictEqual(
    pageUrl({ module: 'Student', action: 'CarteView', return_module: 'Student', record: 'abc-123' }),
    'https://example.com/testgcp/index.php?module=Student&action=CarteView&return_module=Student&record=abc-123',
  );
});

test('pageUrl: 値は符号化される・空文字もキーとして残る', () => {
  assert.strictEqual(
    pageUrl({ module: 'Student', action: 'DWAddClsCarteKeiri_AN', record: 'a&b', sel_class_id: '' }),
    'https://example.com/testgcp/index.php?module=Student&action=DWAddClsCarteKeiri_AN&record=a%26b&sel_class_id=',
  );
});
