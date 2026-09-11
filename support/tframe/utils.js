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

/**
 * tframe の「ポップアップピッカー」（受講生・講師・コース等を選ぶモーダル）を開き、
 * 検索結果1件目の行を選択する。
 *
 * このモーダルは新規タブではなく**ページ内モーダル**として開く（`switchToNextTab` は使えない）。
 * 結果行には `<a>` が無く、1列目のラジオボタン（`input[type=radio]`）に選択・モーダルクローズ
 * の挙動が仕込まれている。開いた時点で対象種別ごとの既定の絞り込み（受講生ステイタス等）で
 * 結果が表示済みのため、追加の検索操作は不要（#216 で実機確認）。
 *
 * @param {CodeceptJS.I} I
 * @param {object} opts
 * @param {string} opts.startSelector   - ポップアップを開くボタンのセレクタ（例: '#personId_start'）
 * @param {string} opts.displaySelector - 選択後に値が入る表示用 input のセレクタ
 *                                        （例: '#personId_display'。モーダルが閉じたことの確認に使う）
 */
function selectFirstFromPopupPicker(I, { startSelector, displaySelector }) {
  I.click(startSelector);
  I.waitForElement('.tf-data-table-table tbody tr', 15);
  // ラジオボタンはカスタムCSSで見た目上は非表示（span でスタイリング）になっており、
  // Playwright の可視性チェックに引っかかって通常クリックがタイムアウトする。
  // 選択・モーダルクローズは input のネイティブ click イベントで発火するため、
  // executeScript で直接 click() する（#216 で実機確認）。
  I.executeScript(() => {
    const table = document.querySelector('.tf-data-table-table');
    const row = Array.from(table.querySelectorAll('tbody tr')).find((tr) => tr.innerText.trim());
    const radio = row.querySelector('input[type="radio"]');
    radio.click();
  });
  I.waitForElement(displaySelector, 10);
  I.wait(1); // 表示用フィールド更新と隠しフィールド（実際に送信される値）の反映に短いラグがあるため
}

module.exports = { isEnglish, submitTframeFormAndVerify, selectAreaThenBranch, selectFirstFromPopupPicker };
