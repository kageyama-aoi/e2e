'use strict';

/**
 * 日付の整形と月の計算（プロダクト共通）。
 * `String(d.getMonth() + 1).padStart(2, '0')` を各ファイルで手書きしない（#301）。
 */

/**
 * 数値・文字列を2桁にゼロ埋めする（例: 5 → '05'、'12' → '12'）。
 * @param {(number|string)} n
 * @returns {string}
 */
function pad2(n) {
  return String(n).trim().padStart(2, '0');
}

/**
 * 日付を書式どおりの文字列にする。使える記号: YYYY（年）MM（月）DD（日）hh（時）mm（分）ss（秒）。
 * それ以外の文字はそのまま残る。
 * @param {Date} date
 * @param {string} pattern 例: 'YYYY-MM-DD'、'YYYYMM'、'YYYY/MM'、'MMDDhhmm'
 * @returns {string}
 * @example formatDate(new Date(2026, 0, 5, 9, 3, 7), 'YYYY-MM-DD hh:mm:ss') // '2026-01-05 09:03:07'
 */
function formatDate(date, pattern) {
  const parts = {
    YYYY: String(date.getFullYear()),
    MM: pad2(date.getMonth() + 1),
    DD: pad2(date.getDate()),
    hh: pad2(date.getHours()),
    mm: pad2(date.getMinutes()),
    ss: pad2(date.getSeconds()),
  };
  return pattern.replace(/YYYY|MM|DD|hh|mm|ss/g, (token) => parts[token]);
}

/**
 * base の月から offset か月ずらした月の1日（0時）を返す。
 * 今日の日付のまま月だけずらすと、月末（例: 1/31 の翌月）で翌々月にずれるため、必ず1日にそろえる。
 * @param {number} [offset=0] 例: 1＝来月、-1＝先月
 * @param {Date} [base=new Date()]
 * @returns {Date}
 */
function firstOfMonth(offset = 0, base = new Date()) {
  return new Date(base.getFullYear(), base.getMonth() + offset, 1);
}

module.exports = { pad2, formatDate, firstOfMonth };
