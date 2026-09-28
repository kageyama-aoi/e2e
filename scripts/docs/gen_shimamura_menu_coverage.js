/**
 * shimamura アイコン別マッピング表 生成ツール
 *
 * `docs/shimamura/menu_coverage.md` の AUTOGEN 区間（サマリ＋アイコン別表）を、以下を結合して自動生成する:
 *
 * - メニュー構成 … `pages/shimamura/_common/menuSnapshot/testgcp.json`（fetch_shimamura_menus.js で実機採取）
 * - sideMenus キー … `pages/shimamura/_common/sideMenus.js` の directUrl（無ければ shortcut ラベル）で突き合わせ
 * - Page Object  … `pages/shimamura/**.js` の関数/メソッド単位で、URL 直書き・`menus.<key>` 参照・
 *                  URL 定数（support/shimamura/constants.js 等の `KEY: 'index.php?...'`）参照を拾う
 * - テスト       … `tests/shimamura/**_test.js` が呼ぶ PO メソッド / import した FlowPage 関数（同一ファイル内の
 *                  呼び出しを推移的にたどる）＋テスト内の URL 直書き。page/ = 一覧、flow/ = フロー、その他 = その他
 *
 * route の正規化規則は `scripts/html/shimamura_route.js`（採取と共通）。
 * 散文セクション（AUTOGEN 区間の外）は手動メンテ。
 *
 * 使い方:
 *   node scripts/docs/gen_shimamura_menu_coverage.js                     # 再生成（ファイルを書き換える）
 *   node scripts/docs/gen_shimamura_menu_coverage.js --check             # 差分があれば exit 1（書き換えない）
 *   node scripts/docs/gen_shimamura_menu_coverage.js --exclude-untracked # git 未追跡ファイルを数えない（pre-commit 用）
 *
 * 作成日: 2026-09-28（Issue #251）
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { toRoute } = require('../html/shimamura_route');

const ROOT = path.resolve(__dirname, '..', '..');
const SNAP_FILE = path.join(ROOT, 'pages', 'shimamura', '_common', 'menuSnapshot', 'testgcp.json');
const SIDE_MENUS_FILE = path.join(ROOT, 'pages', 'shimamura', '_common', 'sideMenus.js');
const PAGES_DIR = path.join(ROOT, 'pages', 'shimamura');
const SUPPORT_DIR = path.join(ROOT, 'support', 'shimamura');
const TESTS_DIR = path.join(ROOT, 'tests', 'shimamura');
const CONF_FILE = path.join(ROOT, 'codecept.conf.js');
const DOC_FILE = path.join(ROOT, 'docs', 'shimamura', 'menu_coverage.md');

const START = '<!-- AUTOGEN:menu-table START — 生成: node scripts/docs/gen_shimamura_menu_coverage.js。手で編集しない -->';
const END = '<!-- AUTOGEN:menu-table END -->';

/** 業務でほぼ使わないため個別テストを作らないアイコン（計画書 バケットE） */
const BUCKET_E_ICONS = new Set(['Calendar', 'Emails', 'SMSReports', 'SMSHelp', 'Administration']);

/**
 * git の未追跡ファイル（.gitignore 対象は除く）の絶対パス集合を返す（`--exclude-untracked` 指定時のみ）
 * @returns {Set<string>}
 */
function listUntracked() {
  try {
    const out = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '-z', '--', 'pages', 'tests', 'support'], { cwd: ROOT });
    return new Set(out.toString('utf8').split('\0').filter(Boolean).map((e) => path.resolve(ROOT, e)));
  } catch (e) {
    console.warn('[gen_shimamura_menu_coverage] git ls-files に失敗したため未追跡ファイルの除外をスキップします');
    return new Set();
  }
}

const UNTRACKED = process.argv.includes('--exclude-untracked') ? listUntracked() : new Set();

/**
 * ディレクトリ配下の .js を再帰列挙する（未追跡除外・menuSnapshot 等の非 JS は対象外）
 * @param {string} dir
 * @returns {string[]} 絶対パス
 */
function walkJs(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkJs(abs));
    else if (ent.name.endsWith('.js') && !UNTRACKED.has(abs)) out.push(abs);
  }
  return out.sort();
}

/** @param {string} abs */
function rel(abs) {
  return path.relative(ROOT, abs).split(path.sep).join('/');
}

// ---------------------------------------------------------------------------
// 1. ソース解析の部品
// ---------------------------------------------------------------------------

const URL_LITERAL_RE = /index\.php\?[^'"`\s$)]*/g;

/**
 * ソース片から URL 直書きを route に変換して集める
 * @param {string} src
 * @returns {Set<string>}
 */
function routesInSource(src) {
  const set = new Set();
  let m;
  URL_LITERAL_RE.lastIndex = 0;
  while ((m = URL_LITERAL_RE.exec(src))) {
    const r = toRoute(m[0]);
    if (r) set.add(r);
  }
  return set;
}

/**
 * ファイルを関数/メソッド単位のチャンクに切る。
 * - トップレベル `function name(` / `async function name(` / `const name = (async)? (...) =>`
 * - オブジェクトリテラル直下（2スペース）の `name(...) {` / `async name(...) {`
 * チャンク外（ファイル先頭の定数定義等）は `(module)` チャンクとする。
 * @param {string} src
 * @returns {Array<{name: string, body: string}>}
 */
function splitChunks(src) {
  const re = /^(?:(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>|\s{2}(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{)/gm;
  const marks = [];
  let m;
  while ((m = re.exec(src))) {
    const name = m[1] || m[2] || m[3];
    if (['if', 'for', 'while', 'switch', 'catch', 'function'].includes(name)) continue;
    marks.push({ name, start: m.index });
  }
  const chunks = [{ name: '(module)', body: src.slice(0, marks.length ? marks[0].start : src.length) }];
  for (let i = 0; i < marks.length; i += 1) {
    chunks.push({ name: marks[i].name, body: src.slice(marks[i].start, i + 1 < marks.length ? marks[i + 1].start : src.length) });
  }
  return chunks;
}

/**
 * `KEY: 'index.php?...'`（文字列連結の続きも含む）形式の URL 定数を集める
 * @param {string[]} files
 * @returns {Map<string, string>} 定数キー -> route
 */
function collectUrlConstants(files) {
  const map = new Map();
  const re = /^\s*([A-Z][A-Z0-9_]+)\s*:\s*['`](index\.php\?[^'`]*)['`]((?:\s*\+\s*['`][^'`]*['`])*)/gm;
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = re.exec(src))) {
      const tail = (m[3] || '').replace(/\s*\+\s*['`]([^'`]*)['`]/g, '$1');
      const r = toRoute(m[2] + tail);
      if (r) map.set(m[1], r);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// 2. sideMenus.js
// ---------------------------------------------------------------------------

/**
 * sideMenus.js のキー -> { route, shortcut }
 * @returns {Map<string, {route: (string|null), shortcut: (string|null)}>}
 */
function loadSideMenus() {
  delete require.cache[require.resolve(SIDE_MENUS_FILE)];
  const defs = require(SIDE_MENUS_FILE);
  const map = new Map();
  for (const [key, def] of Object.entries(defs)) {
    map.set(key, { route: def.directUrl ? toRoute(def.directUrl) : null, shortcut: def.shortcut || null });
  }
  return map;
}

// ---------------------------------------------------------------------------
// 3. Page Object 解析: ファイル -> チャンク -> 参照 route（推移的）
// ---------------------------------------------------------------------------

/**
 * 1ファイルのチャンクごとに「直接参照する route」と「同一ファイル内で呼ぶ他チャンク」を求め、推移閉包を取る
 * @param {string} src
 * @param {Map<string, {route: (string|null), shortcut: (string|null)}>} sideMenus
 * @param {Map<string, string>} urlConsts
 * @returns {Map<string, Set<string>>} チャンク名 -> 参照 route（`menu:<key>` 形式の sideMenus 参照を含む）
 */
function analyzeFile(src, sideMenus, urlConsts) {
  const chunks = splitChunks(src);
  const names = new Set(chunks.map((c) => c.name));
  const direct = new Map();
  const calls = new Map();
  for (const c of chunks) {
    const refs = routesInSource(c.body);
    for (const [key] of sideMenus) {
      if (new RegExp(`\\b(?:menus|sideMenus|MENUS)\\.${key}\\b`).test(c.body)) refs.add(`menu:${key}`);
    }
    for (const [k, r] of urlConsts) {
      if (new RegExp(`\\.${k}\\b`).test(c.body)) refs.add(r);
    }
    direct.set(c.name, refs);
    const called = new Set();
    for (const n of names) {
      if (n !== c.name && n !== '(module)' && new RegExp(`(?:\\bthis\\.|[^\\w.$])${n.replace(/\$/g, '\\$')}\\s*\\(`).test(c.body)) called.add(n);
    }
    calls.set(c.name, called);
  }
  // モジュール直下（定数）で定義された URL は、その定数名を参照するチャンクにも伝播させる
  const moduleConsts = new Map();
  const constRe = /^const\s+([A-Za-z_$][\w$]*)\s*=\s*\{/gm;
  const modBody = (chunks.find((c) => c.name === '(module)') || { body: '' }).body;
  let cm;
  while ((cm = constRe.exec(modBody))) {
    const start = cm.index;
    const end = modBody.indexOf('\n};', start);
    const body = modBody.slice(start, end < 0 ? modBody.length : end);
    const refs = routesInSource(body);
    if (refs.size) moduleConsts.set(cm[1], refs);
  }

  // IchiranPage の標準一覧ファクトリ（STANDARD_SCREENS）は定義1件からメソッドを生成するため、ソースにメソッド名が現れない。
  // `menu: menus.<key>, navKey: 'X', coreKey: 'Y'` から生成されるメソッド名を合成して sideMenus 参照を持たせる
  const factoryRe = /menu:\s*menus\.(\w+)[\s\S]{0,200}?navKey:\s*'(\w+)',\s*coreKey:\s*'(\w+)'/g;
  let fm;
  while ((fm = factoryRe.exec(src))) {
    const [, key, navKey, coreKey] = fm;
    const generatedNames = [`navigateTo${navKey}Page`, `fill${coreKey}SearchConditions`, `click${coreKey}SearchAndWait`,
      `verify${coreKey}ResultsExist`, `verify${coreKey}RecordInResults`];
    for (const n of generatedNames) {
      chunks.push({ name: n, body: '' });
      direct.set(n, new Set([`menu:${key}`]));
      calls.set(n, new Set());
    }
  }

  const closed = new Map();
  for (const c of chunks) {
    const seen = new Set([c.name]);
    const stack = [c.name];
    const acc = new Set();
    while (stack.length) {
      const n = stack.pop();
      for (const r of direct.get(n) || []) acc.add(r);
      const body = (chunks.find((x) => x.name === n) || { body: '' }).body;
      for (const [cn, refs] of moduleConsts) {
        if (n !== '(module)' && new RegExp(`\\b${cn}\\b`).test(body)) refs.forEach((r) => acc.add(r));
      }
      for (const nx of calls.get(n) || []) if (!seen.has(nx)) { seen.add(nx); stack.push(nx); }
    }
    closed.set(c.name, acc);
  }
  return closed;
}

// ---------------------------------------------------------------------------
// 4. 突き合わせ
// ---------------------------------------------------------------------------

/**
 * `menu:<key>` 参照を route に解決して、メニュー項目の突き合わせ用 ID 集合にする
 * @param {Set<string>} refs
 * @param {Map<string, {route: (string|null), shortcut: (string|null)}>} sideMenus
 * @returns {Set<string>} route または `label:<shortcut>`
 */
function resolveRefs(refs, sideMenus) {
  const out = new Set();
  for (const r of refs) {
    if (r.startsWith('menu:')) {
      const def = sideMenus.get(r.slice(5));
      if (!def) continue;
      if (def.route) out.add(def.route);
      if (def.shortcut) out.add(`label:${def.shortcut}`);
    } else {
      out.add(r);
    }
  }
  return out;
}

/** @param {{label: string, route: string}} item */
function itemIds(item) {
  return [item.route, `label:${item.label}`];
}

function main() {
  const snap = JSON.parse(fs.readFileSync(SNAP_FILE, 'utf8'));
  const sideMenus = loadSideMenus();
  const pageFiles = walkJs(PAGES_DIR);
  const supportFiles = walkJs(SUPPORT_DIR);
  const urlConsts = collectUrlConstants([...pageFiles, ...supportFiles]);

  // PO: 画面ID -> PO basename 集合 / PO ファイル -> チャンク解析
  const poAnalysis = new Map(); // abs -> Map(chunk -> Set(ids))
  const idToPO = new Map();
  for (const f of pageFiles) {
    const closed = analyzeFile(fs.readFileSync(f, 'utf8'), sideMenus, urlConsts);
    const resolved = new Map();
    for (const [name, refs] of closed) resolved.set(name, resolveRefs(refs, sideMenus));
    poAnalysis.set(f, resolved);
    if (f === SIDE_MENUS_FILE) continue;
    const base = path.basename(f, '.js');
    for (const ids of resolved.values()) {
      for (const id of ids) {
        if (!idToPO.has(id)) idToPO.set(id, new Set());
        idToPO.get(id).add(base);
      }
    }
  }
  // sideMenus.js 自体に定義があるキー（sideMenus 列用）
  const idToMenuKey = new Map();
  for (const [key, def] of sideMenus) {
    if (def.route) idToMenuKey.set(def.route, key);
    if (def.shortcut) idToMenuKey.set(`label:${def.shortcut}`, key);
  }

  // codecept.conf.js の inject 名 -> PO 絶対パス
  const injectMap = new Map();
  const confSrc = fs.readFileSync(CONF_FILE, 'utf8');
  const injRe = /(\w+):\s*'\.\/(pages\/shimamura\/[\w/]+\.js)'/g;
  let im;
  while ((im = injRe.exec(confSrc))) injectMap.set(im[1], path.join(ROOT, im[2]));

  // テスト: 画面ID -> [{file, kind}]
  const idToTests = new Map();
  for (const f of walkJs(TESTS_DIR)) {
    if (!f.endsWith('_test.js')) continue;
    const src = fs.readFileSync(f, 'utf8');
    const sub = rel(f).split('/')[2];
    const kind = sub === 'page' ? '一覧' : sub === 'flow' ? 'フロー' : 'その他';
    const ids = new Set(resolveRefs(routesInSource(src), sideMenus));

    // inject された PO のメソッド呼び出し
    for (const [varName, poAbs] of injectMap) {
      const chunks = poAnalysis.get(poAbs);
      if (!chunks) continue;
      const callRe = new RegExp(`\\b${varName}\\.([A-Za-z_$][\\w$]*)\\s*\\(`, 'g');
      let cm;
      while ((cm = callRe.exec(src))) (chunks.get(cm[1]) || []).forEach((id) => ids.add(id));
    }
    // require した FlowPage 等の関数（分割代入で import した名前）
    const reqRe = /const\s*\{([^}]*)\}\s*=\s*require\(\s*['"]([^'"]*pages\/shimamura\/[^'"]+)['"]\s*\)/g;
    let rm;
    while ((rm = reqRe.exec(src))) {
      const abs = require.resolve(path.resolve(path.dirname(f), rm[2]));
      const chunks = poAnalysis.get(abs);
      if (!chunks) continue;
      for (const raw of rm[1].split(',')) {
        const name = raw.trim().split(':')[0].trim();
        if (!name || !new RegExp(`\\b${name}\\s*\\(`).test(src.slice(rm.index + rm[0].length))) continue;
        (chunks.get(name) || []).forEach((id) => ids.add(id));
      }
    }

    for (const id of ids) {
      if (!idToTests.has(id)) idToTests.set(id, []);
      if (!idToTests.get(id).some((t) => t.file === path.basename(f))) idToTests.get(id).push({ file: path.basename(f), kind });
    }
  }

  return render(snap, idToPO, idToTests, idToMenuKey);
}

// ---------------------------------------------------------------------------
// 5. markdown
// ---------------------------------------------------------------------------

/**
 * @param {Map<string, Set<string>>} map
 * @param {string[]} ids
 * @returns {string[]}
 */
function lookupSet(map, ids) {
  const s = new Set();
  for (const id of ids) (map.get(id) || []).forEach((v) => s.add(v));
  return [...s].sort();
}

function render(snap, idToPO, idToTests, idToMenuKey) {
  const rows = []; // { icon, group, item, po[], tests[], menuKey }
  for (const [iconKey, icon] of Object.entries(snap.sideMenu)) {
    for (const group of icon.groups) {
      for (const item of group.items) {
        const ids = itemIds(item);
        const tests = [];
        for (const id of ids) for (const t of idToTests.get(id) || []) if (!tests.some((x) => x.file === t.file)) tests.push(t);
        rows.push({
          iconKey, iconLabel: icon.iconLabel, group: group.name, item,
          po: lookupSet(idToPO, ids),
          tests,
          menuKey: ids.map((id) => idToMenuKey.get(id)).find(Boolean) || '',
          isPdf: !/^[A-Za-z]+\//.test(item.route) || item.route.startsWith('../'),
        });
      }
    }
  }

  const out = [];
  out.push(START);
  out.push('');
  out.push(`> 入力: \`pages/shimamura/_common/menuSnapshot/testgcp.json\`（採取日 ${snap.capturedAt}）× \`pages/shimamura/**\` × \`tests/shimamura/**_test.js\`。`);
  out.push('> **手で編集しない** — メニューが変わったら `node scripts/html/fetch_shimamura_menus.js` で採取し直して `npm run docs:menu-coverage:shimamura`。');
  out.push('');

  // サマリ（route 単位で重複除去）
  out.push('## サマリ');
  out.push('');
  out.push('route の重複（複数アイコンに同じ画面がある等）は1画面として数える。PDF リンクは除外。');
  out.push('');
  out.push('| アイコン | 画面数 | PO あり | テストあり | 未着手（PO・テストとも無し） | 扱い |');
  out.push('|---|--:|--:|--:|--:|---|');
  const seenAll = new Map();
  const iconOrder = Object.keys(snap.sideMenu);
  for (const iconKey of iconOrder) {
    const byRoute = new Map();
    for (const r of rows.filter((x) => x.iconKey === iconKey && !x.isPdf)) if (!byRoute.has(r.item.route)) byRoute.set(r.item.route, r);
    const list = [...byRoute.values()];
    list.forEach((r) => { if (!seenAll.has(r.item.route)) seenAll.set(r.item.route, r); });
    if (list.length === 0) continue;
    const label = snap.sideMenu[iconKey].iconLabel;
    const po = list.filter((r) => r.po.length).length;
    const te = list.filter((r) => r.tests.length).length;
    const none = list.filter((r) => !r.po.length && !r.tests.length).length;
    out.push(`| ${label} | ${list.length} | ${po} | ${te} | ${none} | ${BUCKET_E_ICONS.has(iconKey) ? 'E（巡回のみ）' : '対象'} |`);
  }
  const all = [...seenAll.values()];
  // E 以外のアイコンに1つでも載っている画面は対象に数える（例: コマ設定はカレンダーとコースの両方にある）
  const targetRoutes = new Set(rows.filter((r) => !r.isPdf && !BUCKET_E_ICONS.has(r.iconKey)).map((r) => r.item.route));
  const target = all.filter((r) => targetRoutes.has(r.item.route));
  const cnt = (list) => [list.length, list.filter((r) => r.po.length).length, list.filter((r) => r.tests.length).length, list.filter((r) => !r.po.length && !r.tests.length).length];
  const [a1, a2, a3, a4] = cnt(all);
  const [t1, t2, t3, t4] = cnt(target);
  out.push(`| **合計（全体）** | **${a1}** | **${a2}** | **${a3}** | **${a4}** | |`);
  out.push(`| **合計（E を除く対象）** | **${t1}** | **${t2}** | **${t3}** | **${t4}** | |`);
  out.push('');

  out.push('## アイコン別 マッピング表');
  out.push('');
  out.push('- **sideMenus キー** … `pages/shimamura/_common/sideMenus.js` に定義があればそのキー');
  out.push('- **Page Object** … その画面へ遷移・操作する `pages/shimamura/**.js`（URL 直書き / sideMenus 参照 / URL 定数参照）');
  out.push('- **一覧 / フロー / その他テスト** … `tests/shimamura/{page,flow,それ以外}/*_test.js` のうち、その画面に触れるもの');
  out.push('');
  for (const iconKey of iconOrder) {
    const icon = snap.sideMenu[iconKey];
    const list = rows.filter((r) => r.iconKey === iconKey);
    if (list.length === 0) {
      out.push(`### ${icon.iconLabel}（icon: \`${iconKey}\`）`);
      out.push('');
      out.push('_左サイドバー無し（採取対象外）_');
      out.push('');
      continue;
    }
    out.push(`### ${icon.iconLabel}（icon: \`${iconKey}\`）${BUCKET_E_ICONS.has(iconKey) ? ' — バケットE' : ''}`);
    out.push('');
    out.push('| グループ | 画面名 | route | sideMenus キー | Page Object | 一覧テスト | フローテスト | その他テスト |');
    out.push('|---|---|---|---|---|---|---|---|');
    for (const r of list) {
      const t = (kind) => {
        const fs_ = r.tests.filter((x) => x.kind === kind).map((x) => `\`${x.file}\``).sort();
        return fs_.length ? `✓ ${fs_.join(' / ')}` : (kind === 'その他' ? '' : '✗');
      };
      out.push(`| ${r.group} | ${r.item.label} | \`${r.item.route}\` | ${r.menuKey ? `\`${r.menuKey}\`` : ''} | ${r.po.length ? `✓ ${r.po.join(' / ')}` : '✗'} | ${t('一覧')} | ${t('フロー')} | ${t('その他')} |`);
    }
    out.push('');
  }
  out.push(END);
  return out.join('\n');
}

// ---------------------------------------------------------------------------
// 6. 書き出し / --check
// ---------------------------------------------------------------------------

const generated = main();
const doc = fs.readFileSync(DOC_FILE, 'utf8');
const s = doc.indexOf(START);
const e = doc.indexOf(END);
if (s < 0 || e < 0) {
  console.error(`[gen_shimamura_menu_coverage] ${rel(DOC_FILE)} に AUTOGEN マーカーがありません`);
  process.exit(1);
}
const next = doc.slice(0, s) + generated + doc.slice(e + END.length);

if (process.argv.includes('--check')) {
  if (next.replace(/\r\n/g, '\n') !== doc.replace(/\r\n/g, '\n')) {
    console.error(`[gen_shimamura_menu_coverage] ${rel(DOC_FILE)} が最新ではありません。npm run docs:menu-coverage:shimamura を実行してください`);
    process.exit(1);
  }
  console.log('[gen_shimamura_menu_coverage] OK（差分なし）');
} else if (next !== doc) {
  fs.writeFileSync(DOC_FILE, next, 'utf8');
  console.log(`[gen_shimamura_menu_coverage] ${rel(DOC_FILE)} を更新しました`);
} else {
  console.log('[gen_shimamura_menu_coverage] 変更なし');
}
