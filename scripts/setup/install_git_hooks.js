/**
 * git の hooksPath をリポジトリ同梱の .githooks/ に向ける。
 *
 * package.json の postinstall から呼ばれる（`npm install` 時に自動実行）。
 * core.hooksPath はローカル設定でコミットされないため、クローンごとに 1 度必要。
 * git が無い / リポジトリ外などで失敗しても install は止めない。
 */
'use strict';

const { execFileSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], {
    cwd: repoRoot,
    stdio: 'ignore',
  });
  console.log('git hooks: core.hooksPath → .githooks');
} catch (e) {
  console.log('git hooks: 設定をスキップ（git 未検出またはリポジトリ外）');
}
