/**
 * tframe の取得スクリプトが、エラーページを画面の写し（scripts/html/snapshots/tframe/）として保存しないための判定。
 *
 * 環境に無い画面（例: culture_beta の料金マスタ）を開くと、tframe は
 * 「An internal server error occurred.」と「N 秒後にホームに戻ります」だけのページを返す。
 * これを写しとして git に入れてしまったことがある（#355 で 4 本消した）ので、保存の前にここで弾く（#368）。
 *
 * 読み込み元: fetch_tframe_forms.js・fetch_tframe_chosekin_person_id.js
 */
'use strict';

/** エラーページにだけ出る文言（どれか 1 つでも含めばエラーページとみなす） */
const ERROR_PAGE_MARKERS = [
  'An internal server error occurred',
  '秒後にホームに戻ります',
];

/**
 * 取得した HTML が tframe のエラーページかどうか
 * @param {string} html
 * @returns {boolean}
 */
function isTframeErrorPage(html) {
  const text = String(html || '');
  return ERROR_PAGE_MARKERS.some((marker) => text.includes(marker));
}

module.exports = { ERROR_PAGE_MARKERS, isTframeErrorPage };
