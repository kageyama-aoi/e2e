'use strict';

const { TIMEOUTS } = require('./constants');

/**
 * juku 環境のみ TFRAME_LANGUAGE=en が設定される。culture は常に日本語。
 * @returns {boolean}
 */
function isEnglish() {
  return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
}

/**
 * tframe 登録フォームを保存し、バリデーションエラーを検出する
 *
 * 保存ボタン押下後に #tf-message-summary にエラーテキストが出ていればテスト失敗にする。
 * エラーがなければ expectedName が画面に表示されるまで待機して成功とする。
 *
 * @param {CodeceptJS.I} I
 * @param {string} expectedName - 保存後の画面に表示されるはずの名称
 */
async function submitTframeFormAndVerify(I, expectedName) {
  I.click('#ewSaveButton');
  I.wait(TIMEOUTS.SAVE); // 保存レスポンスを待機（サーバーサイドバリデーション）

  const errorText = await I.executeScript(() => {
    const el = document.getElementById('tf-message-summary');
    return el ? el.innerText.trim() : '';
  });
  if (errorText) throw new Error(`登録バリデーションエラー:\n${errorText}`);

  I.waitForText(expectedName, 10);
}

/**
 * エリア→校舎の AJAX 連動ドロップダウンを選択する。
 * エリア選択後、校舎リストが AJAX で更新されるため待機を挟む。
 * @param {object} I - CodeceptJS の I
 * @param {object} opts
 * @param {string} [opts.areaSelector='#school_area_id']
 * @param {string} [opts.branchSelector='#school_branch_id']
 * @param {string} opts.area   - エリアの選択値（falsy ならスキップ）
 * @param {string} opts.branch - 校舎の選択値（falsy ならスキップ）
 */
function selectAreaThenBranch(I, { areaSelector = '#school_area_id', branchSelector = '#school_branch_id', area, branch }) {
  if (area) {
    I.selectOption(areaSelector, area);
    I.wait(TIMEOUTS.AJAX_SELECT); // AJAX: エリア選択後に校舎ドロップダウンを更新
  }
  if (branch) I.selectOption(branchSelector, branch);
}

module.exports = { isEnglish, submitTframeFormAndVerify, selectAreaThenBranch };
