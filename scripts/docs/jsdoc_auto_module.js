/**
 * JSDoc プラグイン：ファイルパスから @module を自動で付ける。
 *
 * Page Object は `module.exports = { ... }` 形式のため、そのままだと JSDoc が
 * どのファイルのメソッドか判断できず、全メソッドが global.html に平らに並ぶ。
 * 生成時だけ各ファイルの先頭に `@module pages/shimamura/flow/SyokaiFlowPage` のような
 * 宣言を差し込み、左ナビをファイル単位にする（ソースファイル自体は書き換えない）。
 *
 * すでに @module を書いているファイルはそのまま使う。
 * JSDoc コメントが1つも無いファイルには付けない（中身が空のページをナビに並べないため）。
 * jsdoc.json の "plugins" から読み込まれる。#309
 */
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');

exports.handlers = {
  beforeParse(e) {
    if (/@module\b/.test(e.source) || !e.source.includes('/**')) return;
    // codecept/ は付けない（#337 で移す前と同じ pages/… の名前のままにして、docs からのリンクを壊さない）
    const moduleName = path
      .relative(path.join(repoRoot, 'codecept'), e.filename)
      .replace(/\\/g, '/')
      .replace(/\.js$/, '');
    e.source = `/** @module ${moduleName} */\n\n${e.source}`;
  },
};
