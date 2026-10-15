'use strict';

/**
 * 料金明細 編集画面（入金入力モード）の送信内容を、DB の元の値と突き合わせる（ブラウザ不要の純粋関数）。
 *
 * サーバー側（Save_shimamura.php）のチェック仕様は、ユーザーから共有された資料による
 * （2026-10-01 時点・ソースは未確認）。ここでの判定は「保存したらこのチェックに当たりそう」という
 * **予測**であって、実際の保存結果ではない。
 *
 * - Check 2 既入金保護（mod_error）: DB で入金済み（actual_in_amount != 0 / t_date != '' / payment_type != ''）の行で
 *   比較6項目のどれかが変わっている →「既に入金済みのため、入金処理は不可です」
 * - Check 3 支払方法未設定（type_error）: 送信値で入金日か入金額が入っているのに支払方法が空 →「入金時には、支払方法を設定してください」
 * - Check 5 変更あり・入金日空欄（change_error）: 送信値の入金日が空で、比較6項目のどれかが変わっている →「入金日は必須項目です」
 */

/** サーバーが比較する6項目 */
const CHECK_FIELDS = ['in_amount', 'due_date', 't_date', 'actual_in_amount', 'commission', 'payment_type'];

/**
 * 比較用に値をそろえる。null/undefined は空文字、数字のカンマは外す。
 * `''` と `'0'` は同じ扱いにしない（サーバーがどちらで比べるか未確認のため、差として出す）。
 * @param {*} value
 * @returns {string}
 */
function normalize(value) {
  if (value === null || value === undefined) return '';
  const s = String(value).trim();
  return /^-?[\d,]+$/.test(s) ? s.replace(/,/g, '') : s;
}

/**
 * DB 上で入金済み扱いか（Check 2 の対象になるか）。
 * @param {Object} dbRow transaction_array.transactions の1件
 * @returns {boolean}
 */
function isPaidInDb(dbRow) {
  const actual = normalize(dbRow.actual_in_amount);
  return (actual !== '' && Number(actual) !== 0)
    || normalize(dbRow.t_date) !== ''
    || normalize(dbRow.payment_type) !== '';
}

/**
 * 送信 JSON の各行を DB の行（id で対応づけ）と比べ、差分と当たりそうなチェックを返す。
 *
 * @param {Array<Object>} dbRows 画面に渡された DB の値（transaction_array.transactions）
 * @param {Array<Object>} sentRows 送信される行（sales_details.transactions）
 * @returns {Array<{id: string, fee_name: string, paidInDb: boolean, diffs: Array<{field: string, db: string, sent: string}>, predicted: Array<string>}>}
 */
function predictServerChecks(dbRows, sentRows) {
  return sentRows.map((sent) => {
    const db = dbRows.find((r) => r.id === sent.id);
    if (!db) {
      return { id: sent.id, fee_name: '', paidInDb: false, diffs: [], predicted: ['DB に対応する行なし'] };
    }
    const diffs = CHECK_FIELDS
      .map((field) => ({ field, db: normalize(db[field]), sent: normalize(sent[field]) }))
      .filter((d) => d.db !== d.sent);
    const paidInDb = isPaidInDb(db);
    const sentTDate = normalize(sent.t_date);
    const sentActual = normalize(sent.actual_in_amount);
    const predicted = [];
    if (paidInDb && diffs.length > 0) predicted.push('Check2 既に入金済みのため、入金処理は不可です');
    if ((sentTDate !== '' || sentActual !== '') && normalize(sent.payment_type) === '') {
      predicted.push('Check3 入金時には、支払方法を設定してください');
    }
    if (sentTDate === '' && diffs.length > 0) predicted.push('Check5 入金日は必須項目です');
    return { id: sent.id, fee_name: db.fee_name || '', paidInDb, diffs, predicted };
  });
}

module.exports = { CHECK_FIELDS, normalize, isPaidInDb, predictServerChecks };
