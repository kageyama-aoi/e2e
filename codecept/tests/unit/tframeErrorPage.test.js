// scripts/html/tframe_error_page.js の単体テスト（#368）
const test = require('node:test');
const assert = require('node:assert');
const { isTframeErrorPage } = require('../../../scripts/html/tframe_error_page');

// #355 で消した写し（ryokin_master_list.html 等）と同じ形
const ERROR_PAGE = `
<div class="site-error">
  <h1>An internal server error occurred.</h1>
  <p><span id="timer">2</span> 秒後にホームに戻ります</p>
</div>`;

test('エラーページを見分ける', () => {
  assert.strictEqual(isTframeErrorPage(ERROR_PAGE), true);
});

test('普通の画面はエラーページとみなさない', () => {
  assert.strictEqual(isTframeErrorPage('<div id="rootWidget"><form id="tf-form"></form></div>'), false);
});

test('空・undefined はエラーページとみなさない（保存するかは呼び出し側で決める）', () => {
  assert.strictEqual(isTframeErrorPage(''), false);
  assert.strictEqual(isTframeErrorPage(undefined), false);
});
