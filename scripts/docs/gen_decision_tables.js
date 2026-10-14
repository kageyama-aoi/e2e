#!/usr/bin/env node
/**
 * デシジョンテーブルの定義ファイルから、仕様書（Markdown）の表を生成する（#287）。
 *
 * 使い方:
 *   node scripts/docs/gen_decision_tables.js                               # 下の REGISTRY の全部を再生成（npm run docs:decision-tables）
 *   node scripts/docs/gen_decision_tables.js --check                       # ずれていれば終了コード 1（書き換えない）
 *   node scripts/docs/gen_decision_tables.js <定義.js> <仕様書.md> [--check] # 1組だけ
 * 新しい画面の表を足したら REGISTRY に1行足す（pre-commit が定義・仕様書の変更時に再生成する）。
 *
 * 仕様書に置く目印（それぞれ START〜END の間を生成結果で置き換える）:
 *   <!-- AUTOGEN:DT-ITEMS START --> … <!-- AUTOGEN:DT-ITEMS END -->   条件・動作の一覧
 *   <!-- AUTOGEN:DT-01 START --> … <!-- AUTOGEN:DT-01 END -->         表ごと（完全版・縮約版・管理行・テスト行・注記）
 *   <!-- AUTOGEN:TC-LIST START --> … <!-- AUTOGEN:TC-LIST END -->     テストケース一覧（定義に model がある場合）
 *
 * 表の作り方は社内「デシジョンテーブル記法ガイド」に従う（support/decisionTable.js）。
 * 定義ファイルの形は data/shimamura/sales_group_transfer_dt.js を参照。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { expandTable } = require('../../support/decisionTable');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

/** 定義ファイルと仕様書の組（リポジトリルートからのパス） */
const REGISTRY = [
  { def: 'data/shimamura/sales_group_transfer_dt.js', doc: 'docs/shimamura/concepts/料金明細入金チェックの仕様.md' },
];

const yn = (v) => (v === null ? 'DC' : v ? 'Y' : 'N');
const cell = (s) => String(s).replace(/\|/g, '\\|');

/** 条件・動作の一覧 */
function renderItems(def) {
  const lines = ['| ID | 種類 | 表 | 見出し | 根拠 |', '|---|---|---|---|---|'];
  def.tables.forEach((t) => {
    t.conditions.forEach((id) => {
      const c = def.conditions.find((x) => x.id === id);
      lines.push(`| ${id} | 条件 | ${t.id} | ${cell(c.label)} | ${c.basis || ''} |`);
    });
    t.actions.forEach((id) => {
      const a = def.actions.find((x) => x.id === id);
      lines.push(`| ${id} | ${id.startsWith('S') ? '呼出' : '動作'} | ${t.id} | ${cell(a.label)} | ${a.basis || ''} |`);
    });
  });
  return lines.join('\n');
}

const labelOf = (def, id) => {
  const item = def.conditions.find((x) => x.id === id) || def.actions.find((x) => x.id === id);
  return `${id} ${item.label}`;
};

function rowsFor(def, table, columns, valueOf, actionCell, groupLabel) {
  const out = [];
  table.conditions.forEach((id, i) => {
    out.push(`| ${i === 0 ? '条件' : ''} | ${cell(labelOf(def, id))} | ${columns.map((col) => valueOf(col, i)).join(' | ')} |`);
  });
  table.actions.forEach((id, i) => {
    const grp = id.startsWith('S') ? '呼出' : i === 0 ? '動作' : '';
    out.push(`| ${grp} | ${cell(labelOf(def, id))} | ${columns.map((col) => actionCell(col, id)).join(' | ')} |`);
  });
  return out;
}

/**
 * 表1つ分（完全版・縮約版）。coverage は縮約版の列番号 → TC の一覧、excluded は列番号 → 理由。
 */
function renderTable(def, table, expanded, coverage, excluded) {
  const { full, collapsed } = expanded;
  const out = [`入口: ${table.entry}`, ''];
  const reasons = [];
  const noteNo = (r) => { let k = reasons.indexOf(r); if (k < 0) { reasons.push(r); k = reasons.length - 1; } return k + 1; };
  const fullStatus = full.map((r) => (r.valid ? '有効' : `N/A※${noteNo(r.naReason)}`));

  out.push(`<details><summary>${table.id} ${table.title}（完全版 ${full.length} 列）</summary>`, '');
  out.push(`| 分類 | 行 | ${full.map((r) => r.no).join(' | ')} |`, `|${'---|'.repeat(full.length + 2)}`);
  out.push(`| 区分 | | ${fullStatus.join(' | ')} |`);
  out.push(...rowsFor(def, table, full, (r, i) => yn(r.vec[i]), (r, id) => (r.valid ? (r.actions.includes(id) ? 'X' : '—') : '')));
  out.push('');
  reasons.forEach((r, i) => out.push(`※${i + 1} ${r}  `));
  out.push('', '</details>', '');

  const validCount = collapsed.filter((c) => c.valid).length;
  out.push(`**${table.id} ${table.title}**（縮約版：有効 ${validCount} 列 ＋ N/A ${collapsed.length - validCount} 列）`, '');
  out.push(`| 分類 | 行 | ${collapsed.map((c) => c.no).join(' | ')} |`, `|${'---|'.repeat(collapsed.length + 2)}`);
  out.push(`| 区分 | | ${collapsed.map((c) => (c.valid ? '有効' : 'N/A' + [...new Set(c.naMembers.map((no) => `※${noteNo(full[no - 1].naReason)}`))].join(''))).join(' | ')} |`);
  out.push(...rowsFor(def, table, collapsed, (c, i) => yn(c.cube[i]), (c, id) => (c.valid ? (c.actions.includes(id) ? 'X' : '—') : '')));
  out.push(`| 管理 | 完全版のルール | ${collapsed.map((c) => c.members.join(', ') + (c.naMembers.length ? `${c.members.length ? ' ' : ''}(N/A: ${c.naMembers.join(', ')})` : '')).join(' | ')} |`);
  const exNotes = [];
  out.push(`| テスト | テストケース | ${collapsed.map((c) => {
    if (!c.valid) return '';
    if (coverage.get(c.no)) return coverage.get(c.no).join(', ');
    if (excluded.get(c.no)) {
      let k = exNotes.indexOf(excluded.get(c.no));
      if (k < 0) { exNotes.push(excluded.get(c.no)); k = exNotes.length - 1; }
      return `対象外†${k + 1}`;
    }
    return '未カバー';
  }).join(' | ')} |`);
  out.push('');
  exNotes.forEach((r, i) => out.push(`†${i + 1} ${r}  `));
  if (exNotes.length) out.push('');
  (table.notes || []).forEach((n) => out.push(`- ${n}`));
  return out.join('\n').trimEnd();
}

const SYMBOL_TEXT = {
  t: { TODAY: '今日', OTHER: '別の日', INVALID: '形式不正（2026-13-01）', '': '空' },
  a: { FULL: '入金予定額', 0: '0' },
  p: { cash: '現金', card: 'カード', '': '空' },
  due: { OTHER: '別の日' },
};
const FIELD_TEXT = { t: '入金日', a: '入金額', p: '支払方法', due: '締切日' };

function describeEdit(tc) {
  const parts = Object.entries(tc.edit || {}).map(([row, e]) => `行${Number(row) + 1}: `
    + Object.entries(e).map(([k, v]) => `${FIELD_TEXT[k]}=${SYMBOL_TEXT[k][v] ?? v}`).join('・'));
  const mode = tc.mode === 'observe' ? '（保存しない）' : ' → 保存';
  const shimebi = tc.simulateShimebi ? '締日を模擬して開く。' : '';
  return (shimebi + (parts.join(' ／ ') || '何も変えない') + mode).replace(/^。/, '');
}

function describeOutcome(def, outcome) {
  const act = (id) => def.actions.find((a) => a.id === id);
  switch (outcome.kind) {
    case 'alerts': return outcome.alerts.map((id) => `alert「${act(id).alert}」`).join(' → ') + 'で止まる';
    case 'serverErrors': return outcome.errors.map((e) => `行${e.row + 1}: ${e.actions.map((id) => act(id).message.replace('{fee}', `行${e.row + 1}の料金名`)).join('、')}`).join(' ／ ') + '（保存されない）';
    case 'saved': return '保存できる（詳細画面へ）';
    case 'observed': return `送る支払方法: ${outcome.sentPayments.map((p, i) => `行${i + 1}=${p || '空'}`).join('・')}`;
    default: return '未確認';
  }
}

function renderCases(def, model, cache, results) {
  const lines = ['| No. | 内容 | 初期状態 | 操作 | 期待結果 | 通るルール | 印 |', '|---|---|---|---|---|---|---|'];
  def.testCases.forEach((tc) => {
    const r = results.get(tc.id);
    lines.push(`| ${tc.id} | ${cell(tc.title)} | ${def.fixtures[tc.fixture].label} | ${cell(describeEdit(tc))} | ${cell(describeOutcome(def, r.outcome))} | ${cell(model.formatTrace(r.trace))} | ${(tc.tags || []).join(' ')} |`);
  });
  const notes = def.testCases.filter((tc) => tc.note).map((tc) => `- ${tc.id}: ${tc.note}`);
  return [...lines, ...(notes.length ? ['', ...notes] : [])].join('\n');
}

function generate(defPath) {
  const def = require(path.resolve(defPath));
  const cache = Object.fromEntries(def.tables.map((t) => [t.id, { table: t, expanded: expandTable(t) }]));
  const blocks = { 'DT-ITEMS': renderItems(def) };

  let model = null;
  const results = new Map();
  if (def.model) {
    model = require(path.join(REPO_ROOT, def.model));
    def.testCases.forEach((tc) => results.set(tc.id, model.evaluateCase(def, tc, cache)));
  }
  def.tables.forEach((t) => {
    const { expanded } = cache[t.id];
    const coverage = new Map();
    results.forEach((r, id) => r.trace.filter((x) => x.table === t.id).forEach((x) => {
      if (!coverage.has(x.rule)) coverage.set(x.rule, []);
      if (!coverage.get(x.rule).includes(id)) coverage.get(x.rule).push(id);
    }));
    const excluded = new Map();
    (def.exclusions || []).filter((e) => e.table === t.id).forEach((e) => {
      expanded.collapsed.forEach((col) => {
        const fits = !e.when || t.conditions.every((id, i) => !(id in e.when) || col.cube[i] === null || col.cube[i] === e.when[id]);
        if (fits && !coverage.has(col.no) && !excluded.has(col.no)) excluded.set(col.no, e.reason);
      });
    });
    blocks[t.id] = renderTable(def, t, expanded, coverage, excluded);
  });
  if (model) blocks['TC-LIST'] = renderCases(def, model, cache, results);
  return blocks;
}

function applyBlocks(text, blocks, docPath) {
  let out = text;
  for (const [name, body] of Object.entries(blocks)) {
    const re = new RegExp(`(<!-- AUTOGEN:${name} START -->)[\\s\\S]*?(<!-- AUTOGEN:${name} END -->)`);
    if (!re.test(out)) throw new Error(`${docPath} に目印がありません: AUTOGEN:${name}`);
    out = out.replace(re, (_, a, b) => `${a}\n${body}\n${b}`);
  }
  return out;
}

function run(defPath, docPath, check) {
  const current = fs.readFileSync(docPath, 'utf8').replace(/\r\n/g, '\n');
  const next = applyBlocks(current, generate(defPath), docPath);
  if (check) {
    if (next !== current) {
      console.error(`[gen_decision_tables] ${docPath} が定義とずれています。npm run docs:decision-tables で再生成してください`);
      return false;
    }
    console.log(`[gen_decision_tables] ${docPath} は定義と一致`);
    return true;
  }
  if (next !== current) {
    fs.writeFileSync(docPath, next, 'utf8');
    console.log(`[gen_decision_tables] ${docPath} を更新しました`);
  } else {
    console.log(`[gen_decision_tables] ${docPath} は変更なし`);
  }
  return true;
}

function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const check = process.argv.includes('--check');
  const pairs = args.length >= 2 ? [{ def: args[0], doc: args[1] }]
    : REGISTRY.map((r) => ({ def: path.join(REPO_ROOT, r.def), doc: path.join(REPO_ROOT, r.doc) }));
  const ok = pairs.map((p) => run(p.def, p.doc, check)).every(Boolean);
  if (!ok) process.exit(1);
}

if (require.main === module) main();

module.exports = { generate, applyBlocks, REGISTRY };
