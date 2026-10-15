/**
 * JSDoc 生成後の後処理：左ナビの幅を広げる。
 *
 * モジュール名がファイルパスそのまま（例 pages/shimamura/screens/ichiran/studentScreens）で長く、
 * docdash 既定の 250px では末尾が切れてファイルを見分けられないため。
 * docdash には独自 CSS を読み込ませる設定が無いので、生成された styles/jsdoc.css に追記する。
 * `npm run docs:jsdoc` の postdocs:jsdoc から呼ばれる。#309
 */
const fs = require('fs');
const path = require('path');

const NAV_WIDTH = '380px';
const cssPath = path.resolve(__dirname, '..', '..', 'docs', 'generated', 'html', 'styles', 'jsdoc.css');

const extraCss = `
/* #309 scripts/docs/jsdoc_widen_nav.js が追記 */
@media (min-width: 681px) {
  nav { width: ${NAV_WIDTH}; }
  #main { width: calc(100% - ${NAV_WIDTH} - 10px); }
  footer { margin-left: ${NAV_WIDTH}; }
}
`;

fs.appendFileSync(cssPath, extraCss);
console.log(`[jsdoc] ナビ幅を ${NAV_WIDTH} に広げました: ${cssPath}`);
