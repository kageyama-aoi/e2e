/**
 * @fileoverview リポジトリルートの絶対パスを返す。
 *
 * `__dirname` を直接使って `..` を数えるとファイル移動時に壊れるため、
 * このモジュールをインポートして使うこと。
 *
 * @example
 * const repoRoot = require('../../../support/repoRoot');  // codecept/tests/<product>/ から
 * const dir = path.join(repoRoot, config.output);
 */

const path = require('path');

// codecept/support/ の二段上 = リポジトリルート (e2e/)。#337 で support/ を codecept/ の下へ移した
module.exports = path.resolve(__dirname, '..', '..');
