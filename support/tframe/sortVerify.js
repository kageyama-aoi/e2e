/**
 * @fileoverview tframe 一覧画面の並び順検証（純粋関数・ブラウザ非依存）
 *
 * 一覧画面の列ヘッダソートは「第1キー＝クリックした列」「第2キー＝画面ごとに裏で決まったキー」
 * の2段で並ぶ。抽出した行配列がこの規則どおりに並んでいるかを判定する（#223）。
 *
 * 比較規則（culture_beta のコース一覧で実機確認）:
 * - 文字列は Unicode コードポイント順（DB のバイナリ照合と同じ。localeCompare は使わない）
 * - 数値は数値比較
 * - 空値は昇順で先頭・降順で末尾（MySQL の NULL の並びに合わせる）
 */

/**
 * 2値を比較する（a<b なら負、a>b なら正、同値なら0）
 * @param {string} a
 * @param {string} b
 * @param {string} [type='string'] - 'string' | 'number'
 * @returns {number}
 */
function compareValues(a, b, type = 'string') {
  const emptyA = a == null || a === '';
  const emptyB = b == null || b === '';
  if (emptyA || emptyB) return (emptyA ? 0 : 1) - (emptyB ? 0 : 1);

  if (type === 'number') return Number(a) - Number(b);

  const ca = Array.from(String(a));
  const cb = Array.from(String(b));
  const len = Math.min(ca.length, cb.length);
  for (let i = 0; i < len; i++) {
    const diff = ca[i].codePointAt(0) - cb[i].codePointAt(0);
    if (diff !== 0) return diff;
  }
  return ca.length - cb.length;
}

/**
 * 行配列が「第1キー（指定方向）→ 第2キー（固定方向）」の順に並んでいるか検証する。
 *
 * @param {Array<Object>} rows - 画面から抽出した行（`{列キー: 値}`）
 * @param {object} spec
 * @param {string} spec.key       - 第1キーの列キー
 * @param {string} spec.type      - 第1キーの型（'string' | 'number'）
 * @param {string} spec.dir       - 第1キーの方向（'asc' | 'desc'）
 * @param {{key: string, type: string, dir: string}} spec.secondary - 第2キー（画面ごとの裏設定）
 * @returns {{violations: Array<string>, tiePairs: number}} 違反内容と、第2キーで判定した隣接ペア数
 */
function findSortViolations(rows, { key, type, dir, secondary }) {
  const sign = dir === 'desc' ? -1 : 1;
  const secSign = secondary.dir === 'desc' ? -1 : 1;
  const violations = [];
  let tiePairs = 0;

  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const cur = rows[i];
    const primary = sign * compareValues(prev[key], cur[key], type);
    if (primary > 0) {
      violations.push(`${i}行目→${i + 1}行目 第1キー(${key} ${dir}): "${prev[key]}" → "${cur[key]}"`);
      continue;
    }
    if (primary < 0) continue;

    tiePairs++;
    const sec = secSign * compareValues(prev[secondary.key], cur[secondary.key], secondary.type);
    if (sec > 0) {
      violations.push(
        `${i}行目→${i + 1}行目 第2キー(${secondary.key} ${secondary.dir}) ※第1キー同値 "${cur[key]}": ` +
        `"${prev[secondary.key]}" → "${cur[secondary.key]}"`
      );
    }
  }
  return { violations, tiePairs };
}

module.exports = { compareValues, findSortViolations };
