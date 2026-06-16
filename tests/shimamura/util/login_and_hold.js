'use strict';

/**
 * shimamura ログイン & 手動操作モード
 *
 * このファイルは通常のテストスイートには含まれない（_test.js 非末尾）。
 * GUIランチャーの「Login & Hold」ボタンからのみ起動する。
 *
 * ログイン完了後に I.pause() でブラウザを開いたまま停止する。
 * ターミナルに "resume" と入力するか Ctrl+C × 2 で終了。
 */

const { beforeShimamura } = require('../../../support/shimamura/hooks');

Feature('shimamura ログイン & 手動操作モード');

Before(beforeShimamura);

Scenario('shimamura にログインしてブラウザを渡す', async ({ I }) => {
  I.say('✅ ログイン完了 — ブラウザを手動で操作してください');
  I.say('このターミナルに "resume" と入力すると終了します (Ctrl+C × 2 でも終了)');
  I.pause();
});
