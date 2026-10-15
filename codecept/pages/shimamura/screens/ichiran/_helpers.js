'use strict';

/**
 * @fileoverview shimamura 一覧画面定義（screens/ichiran/*Screens.js）で共有する小ヘルパー
 */

const { I } = inject();

/**
 * select[name="X"] は値があるときだけ選択する（fill 定義を短くするための小ヘルパー）
 * @param {string} name - select 要素の name 属性
 * @param {string} value - 選択する値（空なら何もしない）
 */
function selectIfSet(name, value) {
  if (value) I.selectOption(`select[name="${name}"]`, value);
}

module.exports = { selectIfSet };
