/**
 * @fileoverview リポジトリルートの絶対パスを返す。
 *
 * `__dirname` を直接使って `..` を数えるとファイル移動時に壊れるため、
 * このモジュールをインポートして使うこと。
 *
 * @example
 * const repoRoot = require('../../support/repoRoot');
 * const dir = path.join(repoRoot, config.output);
 */

const path = require('path');

// support/ の一段上 = リポジトリルート (e2e/)
module.exports = path.resolve(__dirname, '..');
