'use strict';

/**
 * デシジョンテーブルの汎用エンジン（#287）。
 *
 * 社内の「デシジョンテーブル記法ガイド」（https://claude.ai/artifact/D7A86P23kkpLM2eMiYQrvr）の手順を機械的に行う。
 * - STEP 4: 条件の Y/N の全組み合わせ（完全版）を並べる（1行目を半分ずつ Y→N …）
 * - STEP 5/6: 列ごとに結果を決め、起こりえない列は N/A（理由つき）にする
 * - STEP 7: 結果が同じ列を DC でまとめる（縮約）。N/A の列は DC の範囲に入ってよい（管理行に記録）
 *
 * 表の定義は次の形（例は data/shimamura/sales_group_transfer_dt.js）:
 * `{ id: 'DT-01', conditions: ['C1', 'C2'], actions: ['A1', 'A2'], decide(c) => ['A1'], na(c) => (理由 or null) }`
 * `c` は `{ C1: true, C2: false }` のように条件 ID → 真偽値。
 */

/**
 * 完全版の列（条件の真偽値の組）をガイドの順で返す。
 * @param {number} n 条件の数
 * @returns {Array<Array<boolean>>}
 */
function fullVectors(n) {
  const out = [];
  for (let i = 0; i < 2 ** n; i++) {
    out.push(Array.from({ length: n }, (_, k) => ((i >> (n - 1 - k)) & 1) === 0));
  }
  return out;
}

/**
 * cube（真偽値または null＝DC の並び）に含まれる列をすべて返す。
 * @param {Array<(boolean|null)>} cube
 * @returns {Array<Array<boolean>>}
 */
function cubeMembers(cube) {
  return cube.reduce((acc, v) => {
    const opts = v === null ? [true, false] : [v];
    return acc.flatMap((prefix) => opts.map((o) => [...prefix, o]));
  }, [[]]);
}

const key = (vec) => vec.map((v) => (v ? 'Y' : 'N')).join('');

/**
 * 条件 ID の並びと真偽値の並びから、`{C1: true, …}` を作る。
 * @param {Array<string>} ids
 * @param {Array<boolean>} vec
 * @returns {Object<string, boolean>}
 */
function toConditionMap(ids, vec) {
  return Object.fromEntries(ids.map((id, i) => [id, vec[i]]));
}

/**
 * 表を展開・縮約する。
 * @param {{conditions: Array<string>, actions: Array<string>, decide: Function, na: (Function|undefined)}} table
 * @returns {{full: Array<Object>, collapsed: Array<Object>}}
 *   full: `{no, vec, valid, naReason, actions}`（no は完全版のルール番号）
 *   collapsed: `{no, cube, valid, members: Array<number>, naMembers: Array<number>, actions}`（no は縮約版のルール番号）
 */
function expandTable(table) {
  const n = table.conditions.length;
  const full = fullVectors(n).map((vec, i) => {
    const c = toConditionMap(table.conditions, vec);
    const naReason = table.na ? table.na(c) : null;
    return {
      no: i + 1, vec, valid: !naReason, naReason,
      actions: naReason ? [] : [...table.decide(c)].sort((a, b) => table.actions.indexOf(a) - table.actions.indexOf(b)),
    };
  });
  const byKey = new Map(full.map((r) => [key(r.vec), r]));
  const actKey = (r) => r.actions.join(',');

  // 同じ結果の有効な列だけを含む cube を候補にする。DC は有効な列どうしをまとめるときだけ使う
  // （cube が「中の有効な列を囲む最小の範囲」と一致するものに限る）。N/A はその範囲に入ったときだけ含める
  // （ガイド STEP 7: 送料判定の R3 は R1 の DC の範囲に入るので含め、R7 は独立した N/A 列のまま）。
  const candidates = [];
  const tri = (k) => (k === 0 ? [[]] : tri(k - 1).flatMap((p) => [[...p, true], [...p, false], [...p, null]]));
  for (const cube of tri(n)) {
    const mem = cubeMembers(cube).map((v) => byKey.get(key(v)));
    const valids = mem.filter((r) => r.valid);
    if (valids.length === 0) continue;
    if (new Set(valids.map(actKey)).size !== 1) continue;
    const tight = cube.every((v, i) => (v === null) === (new Set(valids.map((r) => r.vec[i])).size === 2));
    if (!tight) continue;
    candidates.push({ cube, mem: new Set(mem.map((r) => r.no)) });
  }
  const validNos = full.filter((r) => r.valid).map((r) => r.no);

  // 有効な列を、重ならない cube の最少個数で覆う（列数は最大 32 程度なので深さ優先で十分）
  let best = null;
  const dfs = (chosen, covered) => {
    if (best && chosen.length >= best.length) return;
    const rest = validNos.filter((no) => !covered.has(no));
    if (rest.length === 0) { best = [...chosen]; return; }
    const target = rest[0];
    const cands = candidates
      .filter((c) => c.mem.has(target) && ![...c.mem].some((no) => covered.has(no)))
      .sort((a, b) => b.mem.size - a.mem.size);
    for (const c of cands) dfs([...chosen, c], new Set([...covered, ...c.mem]));
  };
  dfs([], new Set());

  // 残った N/A は N/A だけの cube でまとめる
  const covered = new Set(best.flatMap((c) => [...c.mem]));
  let naLeft = full.filter((r) => !r.valid && !covered.has(r.no)).map((r) => r.no);
  const naCubes = [];
  while (naLeft.length) {
    const target = naLeft[0];
    const cand = tri(n)
      .map((cube) => ({ cube, mem: new Set(cubeMembers(cube).map((v) => byKey.get(key(v)).no)) }))
      .filter((c) => c.mem.has(target) && [...c.mem].every((no) => naLeft.includes(no)))
      .sort((a, b) => b.mem.size - a.mem.size)[0];
    naCubes.push(cand);
    naLeft = naLeft.filter((no) => !cand.mem.has(no));
  }

  const order = (c) => c.cube.map((v) => ({ true: 0, null: 1, false: 2 }[String(v)]));
  const cmp = (a, b) => {
    const x = order(a); const y = order(b);
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i];
    return 0;
  };
  const collapsed = [...best.sort(cmp), ...naCubes].map((c, i) => {
    const members = [...c.mem].sort((a, b) => a - b);
    const validMembers = members.filter((no) => full[no - 1].valid);
    return {
      no: i + 1,
      cube: c.cube,
      valid: validMembers.length > 0,
      members: validMembers,
      naMembers: members.filter((no) => !full[no - 1].valid),
      actions: validMembers.length ? full[validMembers[0] - 1].actions : [],
    };
  });

  // 検算: 完全版の全ルールが管理行にちょうど1回ずつ現れる（ガイド STEP 7 の確認）
  const all = collapsed.flatMap((c) => [...c.members, ...c.naMembers]).sort((a, b) => a - b);
  if (all.join() !== full.map((r) => r.no).join()) throw new Error(`縮約の検算に失敗: ${table.id}`);
  return { full, collapsed };
}

/**
 * 条件の値（`{C1: true, …}`）が当たる縮約版の列を返す。
 * @param {Object} table 表の定義
 * @param {{collapsed: Array<Object>}} expanded expandTable の結果
 * @param {Object<string, boolean>} c
 * @returns {Object} 縮約版の列
 */
function findCollapsedRule(table, expanded, c) {
  const vec = table.conditions.map((id) => {
    if (typeof c[id] !== 'boolean') throw new Error(`${table.id}: 条件 ${id} の値がありません`);
    return c[id];
  });
  const hit = expanded.collapsed.find((col) => col.cube.every((v, i) => v === null || v === vec[i]));
  if (!hit) throw new Error(`${table.id}: 当たる列がありません ${key(vec)}`);
  return hit;
}

module.exports = { fullVectors, cubeMembers, toConditionMap, expandTable, findCollapsedRule };
