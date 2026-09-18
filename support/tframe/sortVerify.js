/**
 * @fileoverview tframe 一覧の並び順検証（純粋関数・ブラウザ非依存）
 *
 * 一覧の列ヘッダソートは「第1キー＝クリックした列」「第2キー＝画面ごとに裏で決まったキー」
 * の2段で並ぶ。抽出した行配列がこの規則どおりに並んでいるかを判定する（#223 / #225）。
 *
 * 列の型（sortSpec.columns の値）:
 * - 'string'   : Unicode コードポイント順（DB のバイナリ照合。例: コース一覧のコース名）
 * - 'stringCi' : 英字の大文字小文字を区別しないコードポイント順（例: 講師 ID、校舎名）
 * - 'number'   : 数値順
 * - 'grouped'  : 表示値とは別の裏の値で並ぶ列（氏名＝フリガナ順、区分＝内部コード順など）。
 *                順序は判定できないので「同じ値が連続して固まっていること」だけを検証する
 *
 * 空値の扱い: 表示が空の行は DB 上 NULL / 空文字 / 非表示値の区別が画面から付かず、
 * 並ぶ位置が画面ごとに一定しないため、第1キー・第2キーとも判定対象から外す。
 */

/**
 * 2値を比較する（a<b なら負、a>b なら正、同値なら0）。空値は最小として扱う。
 * @param {string} a
 * @param {string} b
 * @param {string} [type='string'] - 'string' | 'stringCi' | 'number'
 * @returns {number}
 */
function compareValues(a, b, type = 'string') {
  const emptyA = isEmpty(a);
  const emptyB = isEmpty(b);
  if (emptyA || emptyB) return (emptyA ? 0 : 1) - (emptyB ? 0 : 1);

  if (type === 'number') return Number(a) - Number(b);

  const fold = (s) => (type === 'stringCi' ? String(s).replace(/[A-Z]/g, (c) => c.toLowerCase()) : String(s));
  const ca = Array.from(fold(a));
  const cb = Array.from(fold(b));
  const len = Math.min(ca.length, cb.length);
  for (let i = 0; i < len; i++) {
    const diff = ca[i].codePointAt(0) - cb[i].codePointAt(0);
    if (diff !== 0) return diff;
  }
  return ca.length - cb.length;
}

/**
 * 表示が空かどうか
 * @param {*} v
 * @returns {boolean}
 */
function isEmpty(v) {
  return v == null || v === '';
}

/**
 * 行配列が「第1キー（指定方向）→ 第2キー（固定方向）」の順に並んでいるか検証する。
 *
 * @param {Array<Object>} rows - 画面から抽出した行（`{列キー: 値}`）
 * @param {object} spec
 * @param {string} spec.key  - 第1キーの列キー
 * @param {string} spec.type - 第1キーの型（'string' | 'stringCi' | 'number' | 'grouped'）
 * @param {string} spec.dir  - 第1キーの方向（'asc' | 'desc'）
 * @param {({key: string, type: string, dir: string}|null)} spec.secondary - 第2キー。第2キーの無い画面は null（判定しない）
 * @returns {{violations: Array<string>, tiePairs: number, emptyRows: number}}
 *   違反内容、第2キーで判定した隣接ペア数、空値のため判定から外した行数
 */
function findSortViolations(rows, { key, type, dir, secondary }) {
  const sign = dir === 'desc' ? -1 : 1;
  const violations = [];
  let tiePairs = 0;

  // 行番号（1始まり）を保ったまま空値行を除外する
  const targets = rows.map((row, i) => ({ row, no: i + 1 })).filter(({ row }) => !isEmpty(row[key]));
  const seenGroups = new Set();

  for (let i = 0; i < targets.length; i++) {
    const { row: cur, no } = targets[i];
    if (i === 0) {
      seenGroups.add(cur[key]);
      continue;
    }
    const { row: prev, no: prevNo } = targets[i - 1];
    const where = `${prevNo}行目→${no}行目`;

    let primary;
    if (type === 'grouped') {
      primary = prev[key] === cur[key] ? 0 : -1;
      if (primary !== 0 && seenGroups.has(cur[key])) {
        violations.push(`${where} 第1キー(${key} ${dir}): "${cur[key]}" が連続せず再出現（裏の値で並ぶ列のため連続性のみ判定）`);
      }
      seenGroups.add(cur[key]);
    } else {
      if (type === 'number' && (Number.isNaN(Number(prev[key])) || Number.isNaN(Number(cur[key])))) {
        // NaN は比較結果が常に false になり、崩れた並びを素通りさせてしまうため違反として扱う
        violations.push(`${where} 第1キー(${key} ${dir}): 数値でない値 "${prev[key]}" / "${cur[key]}"（型 number の定義を見直す）`);
        continue;
      }
      primary = sign * compareValues(prev[key], cur[key], type);
      if (primary > 0) {
        violations.push(`${where} 第1キー(${key} ${dir}): "${prev[key]}" → "${cur[key]}"`);
        continue;
      }
    }
    if (primary !== 0 || !secondary) continue;
    if (isEmpty(prev[secondary.key]) || isEmpty(cur[secondary.key])) continue;

    tiePairs++;
    const secSign = secondary.dir === 'desc' ? -1 : 1;
    if (secSign * compareValues(prev[secondary.key], cur[secondary.key], secondary.type) > 0) {
      violations.push(
        `${where} 第2キー(${secondary.key} ${secondary.dir}) ※第1キー同値 "${cur[key]}": ` +
        `"${prev[secondary.key]}" → "${cur[secondary.key]}"`
      );
    }
  }
  return { violations, tiePairs, emptyRows: rows.length - targets.length };
}

/** 列の型の推定順（厳しい型から試し、昇順・降順とも違反0の最初の型を採用する） */
const TYPE_CANDIDATES = ['number', 'string', 'stringCi', 'grouped'];

/**
 * 実機で採取した「列ごと・方向ごとの1ページ目」から sortSpec の案を推定する（#226 調査ツール用）。
 * 1ページ分の標本からの推定なので、最終判断は目視で行うこと。
 *
 * @param {Object<string, Array<Object>>} samples - キー `"<列キー>|asc"` / `"<列キー>|desc"` → 行配列
 * @returns {{columns: Object<string, string>, secondaryCandidates: Array<Object>}}
 *   columns: 列キー → 推定型（どの型でも違反が出る列は 'unknown'）
 *   secondaryCandidates: 第2キー候補 `{key, dir, type, pairs, strictPairs}`（strictPairs の多い順）。
 *   pairs=第1キー同値の隣接ペア数、strictPairs=そのうち候補の値が異なり順序の裏付けになったペア数
 */
function inferSortSpec(samples) {
  const byColumn = {};
  Object.entries(samples).forEach(([k, rows]) => {
    const [col, dir] = k.split('|');
    (byColumn[col] = byColumn[col] || []).push({ dir, rows });
  });

  const columns = {};
  Object.entries(byColumn).forEach(([col, list]) => {
    columns[col] = TYPE_CANDIDATES.find((type) => list.every(({ dir, rows }) =>
      findSortViolations(rows, { key: col, type, dir, secondary: null }).violations.length === 0)) || 'unknown';
  });

  const allKeys = new Set();
  Object.values(samples).forEach((rows) => rows.forEach((r) => Object.keys(r).forEach((key) => allKeys.add(key))));

  const secondaryCandidates = [];
  allKeys.forEach((key) => {
    const type = columns[key] && columns[key] !== 'grouped' && columns[key] !== 'unknown' ? columns[key] : 'string';
    ['asc', 'desc'].forEach((dir) => {
      const sign = dir === 'desc' ? -1 : 1;
      let pairs = 0;
      let strictPairs = 0;
      let bad = 0;
      Object.entries(byColumn).forEach(([col, list]) => {
        if (col === key) return;
        list.forEach(({ rows }) => {
          for (let i = 1; i < rows.length; i++) {
            const [a, b] = [rows[i - 1], rows[i]];
            if (isEmpty(a[col]) || a[col] !== b[col]) continue;
            if (isEmpty(a[key]) || isEmpty(b[key])) continue;
            pairs++;
            const c = sign * compareValues(a[key], b[key], type);
            if (c > 0) bad++;
            else if (c < 0) strictPairs++;
          }
        });
      });
      if (bad === 0 && strictPairs > 0) secondaryCandidates.push({ key, dir, type, pairs, strictPairs });
    });
  });
  secondaryCandidates.sort((x, y) => y.strictPairs - x.strictPairs);
  return { columns, secondaryCandidates };
}

module.exports = { compareValues, findSortViolations, inferSortSpec };
