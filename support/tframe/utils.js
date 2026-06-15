'use strict';

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
  I.wait(2); // 保存レスポンスを待機（サーバーサイドバリデーション）

  const errorText = await I.executeScript(() => {
    const el = document.getElementById('tf-message-summary');
    return el ? el.innerText.trim() : '';
  });
  if (errorText) throw new Error(`登録バリデーションエラー:\n${errorText}`);

  I.waitForText(expectedName, 10);
}

module.exports = { isEnglish, submitTframeFormAndVerify };
