// support/runOutputPaths.js の単体テスト（#230）。実行: npm run test:unit
// ファイル名は *.test.js（codecept は *_test.js だけを拾うため、E2E としては実行されない）
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  sanitizePathSegment,
  detectRunTargetFromArgs,
  buildRunTimestamp,
  resolveRunOutputPaths,
} = require('../../support/runOutputPaths');

test('sanitizePathSegment: パスに使えない文字と空白を _ にする', () => {
  assert.strictEqual(sanitizePathSegment('shimamura.testgcp'), 'shimamura.testgcp');
  assert.strictEqual(sanitizePathSegment('a/b\\c:d*e?f"g<h>i|j'), 'a_b_c_d_e_f_g_h_i_j');
  assert.strictEqual(sanitizePathSegment('a  b'), 'a_b');
  assert.strictEqual(sanitizePathSegment(''), 'default');
  assert.strictEqual(sanitizePathSegment(undefined), 'default');
});

test('detectRunTargetFromArgs: *_test.js の引数からファイル名を取る', () => {
  const argv = ['node', 'codeceptjs', 'run', './tests/shimamura/flow/smbc_state_import_test.js', '--profile', 'shimamura.testgcp'];
  assert.strictEqual(detectRunTargetFromArgs(argv), 'smbc_state_import_test');
  assert.strictEqual(detectRunTargetFromArgs(['run', 'tests\\tframe\\page\\koshi_test.js']), 'koshi_test');
});

test('detectRunTargetFromArgs: *_test.js が無ければ run の直後の引数を使う', () => {
  // * はパスに使えない文字なので _ になる
  assert.strictEqual(detectRunTargetFromArgs(['node', 'codeceptjs', 'run', './tests/shimamura/**/*.js']), '_');
  assert.strictEqual(detectRunTargetFromArgs(['node', 'codeceptjs', 'run', 'smoke']), 'smoke');
});

test('detectRunTargetFromArgs: 対象が無い・run の直後がオプションなら all', () => {
  assert.strictEqual(detectRunTargetFromArgs(['node', 'codeceptjs', 'run', '--grep', '@wip']), 'all');
  assert.strictEqual(detectRunTargetFromArgs([]), 'all');
  assert.strictEqual(detectRunTargetFromArgs(undefined), 'all');
});

test('buildRunTimestamp: YYYYMMDD_HHMMSS（ゼロ埋め）', () => {
  assert.strictEqual(buildRunTimestamp(new Date(2026, 0, 2, 3, 4, 5)), '20260102_030405');
  assert.strictEqual(buildRunTimestamp(new Date(2026, 11, 31, 23, 59, 59)), '20261231_235959');
});

test('resolveRunOutputPaths: プロファイル/日時_テスト名 のパスを返す', () => {
  const paths = resolveRunOutputPaths({
    env: { PROFILE: 'shimamura.testgcp' },
    argv: ['node', 'codeceptjs', 'run', './tests/shimamura/flow/gessya_ikkatu_test.js'],
    now: new Date(2026, 8, 30, 18, 4, 41),
  });
  assert.deepStrictEqual(paths, {
    runProfile: 'shimamura.testgcp',
    runDirName: '20260930_180441_gessya_ikkatu_test',
    runtimeOutputDir: './output/shimamura.testgcp/20260930_180441_gessya_ikkatu_test',
    runtimeAllureResultsDir: './allure-results/shimamura.testgcp/20260930_180441_gessya_ikkatu_test',
  });
});

test('resolveRunOutputPaths: プロファイル無しは default、小文字 profile も読む', () => {
  const now = new Date(2026, 8, 30, 0, 0, 0);
  assert.strictEqual(resolveRunOutputPaths({ env: {}, argv: [], now }).runProfile, 'default');
  assert.strictEqual(resolveRunOutputPaths({ env: { profile: 'taskreport' }, argv: [], now }).runProfile, 'taskreport');
});
