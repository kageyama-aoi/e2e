/**
 * tframe アイコン別マッピング表 生成ツール
 *
 * `docs/tframe/menu_coverage.md` の「## アイコン別 マッピング表」セクション（AUTOGEN マーカーで囲まれた部分）を、
 * 以下を結合して自動生成する:
 *
 * - メニュー構成 / culture・juku 差分 … `pages/tframe/_common/menuSnapshot/{culture_beta,juku_beta}.json`
 * - Page Object                     … `pages/tframe/screens/*.js` 内の `index.php?r=<mod>%2F(ew|sw|gw)%2F<action>`
 * - テスト（登録 / 一覧 / その他）    … `tests/tframe/page/*_test.js` が呼ぶ PO メソッド → PO 内の route 参照
 *
 * 散文セクション（差分サマリ / sideMenus.js とのズレ / バケット分類 / フェーズ2 / 付録）は手動のまま。
 *
 * 使い方:
 *   node scripts/docs/gen_tframe_menu_coverage.js           # 再生成（ファイルを書き換える）
 *   node scripts/docs/gen_tframe_menu_coverage.js --check    # 差分があれば exit 1（書き換えない・pre-commit / CI 用）
 *
 * 作成日: 2026-09-10（Issue #208）
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SNAP_DIR = path.join(ROOT, 'pages', 'tframe', '_common', 'menuSnapshot');
const SCREENS_DIR = path.join(ROOT, 'pages', 'tframe', 'screens');
const TESTS_DIR = path.join(ROOT, 'tests', 'tframe', 'page');
const CONF_FILE = path.join(ROOT, 'codecept.conf.js');
const DOC_FILE = path.join(ROOT, 'docs', 'tframe', 'menu_coverage.md');

const START = '<!-- AUTOGEN:menu-table START — 生成: node scripts/docs/gen_tframe_menu_coverage.js。手で編集しない -->';
const END = '<!-- AUTOGEN:menu-table END -->';

/** route 文字列を突き合わせ用キーに正規化（クエリ・分岐パラメータを落とす） */
function routeKey(route) {
  return String(route).split('?')[0].split(' ')[0].trim();
}

// ---------------------------------------------------------------------------
// 1. スナップショット読込 → アイコン別・env 別のメニュー構成を union
// ---------------------------------------------------------------------------

function loadSnapshot(name) {
  return JSON.parse(fs.readFileSync(path.join(SNAP_DIR, `${name}.json`), 'utf8'));
}

const snapshots = { culture: loadSnapshot('culture_beta'), juku: loadSnapshot('juku_beta') };

/**
 * icons: [{ key, label, groups: [{ name, items: [{ label, route, key, envs:Set }] }] }]
 * culture のアイコン順を基準にし、juku だけにあるアイコン/グループ/項目を後ろに足す。
 */
function buildIcons() {
  const iconOrder = [];
  const iconMap = new Map(); // iconKey -> { key, label, groups: Map(groupName -> Map(itemKey -> item)) }

  function ingest(env, snap) {
    for (const [iconKey, icon] of Object.entries(snap.sideMenu)) {
      if (!iconMap.has(iconKey)) {
        iconMap.set(iconKey, { key: iconKey, label: icon.iconLabel, groups: new Map() });
        iconOrder.push(iconKey);
      }
      const iconRec = iconMap.get(iconKey);
      for (const group of icon.groups) {
        if (!iconRec.groups.has(group.name)) iconRec.groups.set(group.name, new Map());
        const groupRec = iconRec.groups.get(group.name);
        for (const item of group.items) {
          // 画面の同一性は route 全体（分岐パラメータ込み）で判断。PO/テスト突き合わせは routeKey で行う
          const id = String(item.route).trim();
          if (!groupRec.has(id)) {
            groupRec.set(id, { label: item.label, route: item.route, key: routeKey(item.route), envs: new Set() });
          }
          groupRec.get(id).envs.add(env);
        }
      }
    }
  }

  ingest('culture', snapshots.culture);
  ingest('juku', snapshots.juku);

  return iconOrder.map((iconKey) => {
    const iconRec = iconMap.get(iconKey);
    return {
      key: iconRec.key,
      label: iconRec.label,
      groups: [...iconRec.groups.entries()].map(([name, items]) => ({ name, items: [...items.values()] })),
    };
  });
}

// ---------------------------------------------------------------------------
// 2. Page Object の route 参照をスキャン
//    routeKey -> Set(PO basename)   /   PO basename -> [{ method, routeKey }]
// ---------------------------------------------------------------------------

const ROUTE_RE = /r=([A-Za-z]+)%2F(ew|sw|gw)%2F([A-Za-z_]+)/g;

function scanPageObjects() {
  const routeToPO = new Map();
  const poMethods = new Map(); // poBase -> [{ method, routeKey }]

  for (const file of fs.readdirSync(SCREENS_DIR)) {
    if (!file.endsWith('.js')) continue;
    const poBase = file.replace(/\.js$/, '');
    const src = fs.readFileSync(path.join(SCREENS_DIR, file), 'utf8');

    // route -> PO
    let m;
    ROUTE_RE.lastIndex = 0;
    while ((m = ROUTE_RE.exec(src))) {
      const key = `${m[1]}/${m[2]}/${m[3]}`;
      if (!routeToPO.has(key)) routeToPO.set(key, new Set());
      routeToPO.get(key).add(poBase);
    }

    // メソッド名 -> route（メソッド本体内に route 参照があれば紐付け）
    // オブジェクトリテラルのトップレベルメソッド `name(...) {` / `async name(...) {` を粗く切り出す
    const methodRe = /^\s{2}(?:async\s+)?([a-zA-Z]\w*)\s*\([^)]*\)\s*\{/gm;
    const marks = [];
    let mm;
    while ((mm = methodRe.exec(src))) marks.push({ name: mm[1], start: mm.index });
    marks.push({ name: null, start: src.length });
    const list = [];
    for (let i = 0; i < marks.length - 1; i += 1) {
      const body = src.slice(marks[i].start, marks[i + 1].start);
      let r;
      ROUTE_RE.lastIndex = 0;
      while ((r = ROUTE_RE.exec(body))) {
        list.push({ method: marks[i].name, routeKey: `${r[1]}/${r[2]}/${r[3]}` });
      }
    }
    poMethods.set(poBase, list);
  }

  return { routeToPO, poMethods };
}

// メニューナビ検証専用 PO（画面ごとの操作は持たないが、アイコンをクリックして
// メニュー項目を巡回・スクショする）。アイコンキー -> PO basename。
const MENU_NAV_PO_BY_ICON = {
  calendar: 'CalendarPage',
  email: 'EmailPage',
  report: 'ReportPage',
  help: 'HelpPage',
  smsFee: 'KeiryoMasterPage',
  staff: 'MasterMenuPage',
};

// ---------------------------------------------------------------------------
// 3. codecept.conf.js の inject 名 -> PO basename
// ---------------------------------------------------------------------------

function loadInjectMap() {
  const src = fs.readFileSync(CONF_FILE, 'utf8');
  const map = new Map();
  const re = /(\w+Page):\s*'\.\/pages\/tframe\/screens\/(\w+)\.js'/g;
  let m;
  while ((m = re.exec(src))) map.set(m[1], m[2]);
  return map;
}

// ---------------------------------------------------------------------------
// 4. テストファイルをスキャン
//    routeKey -> [{ file, kind }]（kind: 登録 / 一覧 / その他）
// ---------------------------------------------------------------------------

function scanTests(injectMap, poMethods) {
  const routeToTests = new Map();
  const poBaseToTestFiles = new Map(); // PO basename -> Set(test file)

  for (const file of fs.readdirSync(TESTS_DIR)) {
    if (!file.endsWith('_test.js')) continue;
    const src = fs.readFileSync(path.join(TESTS_DIR, file), 'utf8');
    const kind = /_touroku_test\.js$/.test(file) ? '登録'
      : /_ichiran_test\.js$/.test(file) ? '一覧'
        : 'その他';

    // このテストが inject している PO
    const injectedPOs = new Set();
    for (const [varName, poBase] of injectMap) {
      if (new RegExp(`\\b${varName}\\b`).test(src)) {
        injectedPOs.add({ varName, poBase });
        if (!poBaseToTestFiles.has(poBase)) poBaseToTestFiles.set(poBase, new Set());
        poBaseToTestFiles.get(poBase).add(file);
      }
    }

    // このテストが呼んでいる PO メソッド → PO 内の route
    const routes = new Set();
    for (const { varName, poBase } of injectedPOs) {
      const methods = poMethods.get(poBase) || [];
      const callRe = new RegExp(`${varName}\\.([a-zA-Z]\\w*)\\s*\\(`, 'g');
      let cm;
      while ((cm = callRe.exec(src))) {
        for (const entry of methods) {
          if (entry.method === cm[1]) routes.add(entry.routeKey);
        }
      }
      // フォールバック: メソッド呼び出しから紐付かなくても、PO が単一 route しか持たないなら採用しない
    }

    for (const key of routes) {
      if (!routeToTests.has(key)) routeToTests.set(key, []);
      if (!routeToTests.get(key).some((t) => t.file === file)) {
        routeToTests.get(key).push({ file, kind });
      }
    }
  }

  return { routeToTests, poBaseToTestFiles };
}

// ---------------------------------------------------------------------------
// 5. markdown 生成
// ---------------------------------------------------------------------------

function envMark(envs, env) {
  return envs.has(env) ? '●' : '-';
}

function poCell(routeToPO, key) {
  const set = routeToPO.get(key);
  if (!set || set.size === 0) return '✗';
  return `✓ ${[...set].sort().join(' / ')}`;
}

function testCell(routeToTests, key, kind) {
  const list = (routeToTests.get(key) || []).filter((t) => t.kind === kind);
  if (list.length === 0) return '✗';
  return `✓ ${list.map((t) => `\`${t.file}\``).sort().join(' / ')}`;
}

function otherTestCell(routeToTests, key, iconKey, routeToPO, poBaseToTestFiles) {
  const parts = (routeToTests.get(key) || [])
    .filter((t) => t.kind === 'その他')
    .map((t) => `\`${t.file}\``);

  // 専用 PO も専用テストも無いが、アイコンのメニューナビ検証 PO が巡回している場合
  const hasDedicatedPO = (routeToPO.get(key) || new Set()).size > 0;
  const hasDedicatedTest = (routeToTests.get(key) || []).some((t) => t.kind === '登録' || t.kind === '一覧');
  if (!hasDedicatedPO && !hasDedicatedTest) {
    const navPO = MENU_NAV_PO_BY_ICON[iconKey];
    const navTests = navPO ? [...(poBaseToTestFiles.get(navPO) || [])] : [];
    if (navTests.length > 0) {
      parts.push(`△ menu-nav ${navTests.map((f) => `\`${f}\``).sort().join(' / ')}`);
    }
  }
  return [...new Set(parts)].sort().join(' / ');
}

function renderTable(icons, routeToPO, routeToTests, poBaseToTestFiles) {
  const out = [];
  out.push('## アイコン別 マッピング表');
  out.push('');
  out.push(START);
  out.push('');
  out.push('> この表は `pages/tframe/_common/menuSnapshot/*.json`（実機採取・採取日は各 JSON の `capturedAt`）×');
  out.push('> `pages/tframe/screens/*.js` の route 参照 × `tests/tframe/page/*_test.js` から自動生成。');
  out.push('> **手で編集しない** — メニューが変わったらスナップショットを更新して `npm run docs:menu-coverage`。');
  out.push('');
  out.push('- **C / J** … その画面が culture_beta / juku_beta の左メニューに項目として存在するか（`●` 有 / `-` 無）');
  out.push('- **Page Object** … その route へ遷移するメソッドを持つ `pages/tframe/screens/*.js`');
  out.push('- **登録 / 一覧テスト** … その画面を対象にした `*_touroku_test.js` / `*_ichiran_test.js`');
  out.push('');

  for (const icon of icons) {
    out.push(`### ${icon.label}（icon: \`${icon.key}\`）`);
    out.push('');
    out.push('| 画面名 | route | C | J | Page Object | 登録テスト | 一覧テスト | その他テスト |');
    out.push('|---|---|:-:|:-:|---|---|---|---|');
    for (const group of icon.groups) {
      if (group.items.length === 0) {
        out.push(`| _（${group.name} グループ・項目なし）_ | — | ${envMark(collectEnvs(icon, group), 'culture')} | ${envMark(collectEnvs(icon, group), 'juku')} | — | — | — | — |`);
        continue;
      }
      for (const item of group.items) {
        out.push([
          '',
          item.label,
          `\`${item.route}\``,
          envMark(item.envs, 'culture'),
          envMark(item.envs, 'juku'),
          poCell(routeToPO, item.key),
          testCell(routeToTests, item.key, '登録'),
          testCell(routeToTests, item.key, '一覧'),
          otherTestCell(routeToTests, item.key, icon.key, routeToPO, poBaseToTestFiles),
          '',
        ].join(' | ').replace(/^ \| /, '| ').replace(/ \| $/, ' |'));
      }
    }
    out.push('');
  }

  out.push(END);
  out.push('');
  return out.join('\n');
}

// 空グループの env 判定用（項目が無いので envs Set が空。スナップショットからグループ存在 env を引く）
function collectEnvs(icon, group) {
  const envs = new Set();
  for (const [env, snap] of Object.entries(snapshots)) {
    const ic = snap.sideMenu[icon.key];
    if (ic && ic.groups.some((g) => g.name === group.name)) envs.add(env);
  }
  return envs;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function main() {
  const check = process.argv.includes('--check');

  const icons = buildIcons();
  const { routeToPO, poMethods } = scanPageObjects();
  const injectMap = loadInjectMap();
  const { routeToTests, poBaseToTestFiles } = scanTests(injectMap, poMethods);

  const generated = renderTable(icons, routeToPO, routeToTests, poBaseToTestFiles);

  const doc = fs.readFileSync(DOC_FILE, 'utf8');
  const secStart = doc.indexOf('## アイコン別 マッピング表');
  if (secStart === -1) {
    console.error('[gen_tframe_menu_coverage] "## アイコン別 マッピング表" が見つかりません');
    process.exit(1);
  }
  const nextSec = doc.indexOf('\n## ', secStart + 3);
  const secEnd = nextSec === -1 ? doc.length : nextSec + 1;
  const before = doc.slice(0, secStart);
  const after = doc.slice(secEnd);

  const updated = `${before}${generated}\n${after}`;

  if (check) {
    if (updated !== doc) {
      console.error('[gen_tframe_menu_coverage] menu_coverage.md のアイコン別表が最新ではありません。');
      console.error('  → node scripts/docs/gen_tframe_menu_coverage.js を実行してコミットに含めてください。');
      process.exit(1);
    }
    console.log('[gen_tframe_menu_coverage] OK: アイコン別表は最新です');
    return;
  }

  if (updated === doc) {
    console.log('[gen_tframe_menu_coverage] 変更なし');
    return;
  }
  fs.writeFileSync(DOC_FILE, updated);
  console.log('[gen_tframe_menu_coverage] menu_coverage.md のアイコン別表を再生成しました');
}

main();
