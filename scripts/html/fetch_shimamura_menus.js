#!/usr/bin/env node
/**
 * shimamura の上部アイコン × 左サイドバーを実機で全件採取し、menuSnapshot JSON に書き出す。
 *
 * 使い方: node scripts/html/fetch_shimamura_menus.js [profile]   （既定: shimamura.testgcp）
 * 出力  : pages/shimamura/_common/menuSnapshot/<env>.json  （例: testgcp.json）
 *
 * - 上部アイコンは `td.moduleBarIcon a.otherTab` 等（テキスト付きリンク）から取得
 * - サイドバーは `#leftCol` を走査。折りたたみグループ（tr.leftColumnModuleHead ＋ tr#submenu__xxx_sub）は
 *   非表示でも DOM に全項目が入っているため、展開クリックせず読み取るだけ（データ変更なし）
 * - route の正規化規則は scripts/html/shimamura_route.js（生成スクリプトと共通）
 *
 * #251 Phase 0
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const dotenv = require('dotenv');
const { toRoute: toRouteBase } = require('./shimamura_route');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const profile   = process.argv[2] || 'shimamura.testgcp';
const envName   = profile.replace(/^shimamura\./, '');

dotenv.config({ path: path.join(REPO_ROOT, '.env') });
dotenv.config({ path: path.join(REPO_ROOT, 'env', `.env.${profile}`), override: true });

const BASE_URL  = (process.env.BASE_URL || '').replace(/\/?$/, '/');
const USER      = process.env.SHIMAMURA_USER;
const PASSWORD  = process.env.SHIMAMURA_PASSWORD;
const TANTOUSYA = process.env.SHIMAMURA_TANTOUSYA;

const OUTPUT_FILE = path.join(REPO_ROOT, 'pages', 'shimamura', '_common', 'menuSnapshot', `${envName}.json`);

/** @param {string} href */
function toRoute(href) {
  return toRouteBase(href, BASE_URL);
}

/** @param {string} route */
function toIconKey(route) {
  return route.split('/')[0];
}

async function login(page) {
  await page.goto(BASE_URL);
  await page.waitForSelector('input[name="user_name"]', { timeout: 10000 });
  await page.fill('input[name="user_name"]', USER);
  await page.fill('input[name="user_password"]', PASSWORD);
  await page.click('text=ログイン');
  try {
    await page.waitForSelector('input[name="idnumber"]', { timeout: 5000 });
    await page.fill('input[name="idnumber"]', String(TANTOUSYA));
    await page.click('text=メインメニュー');
  } catch (_) {}
  await page.waitForSelector('a.myAreaLink:has-text("管理")', { timeout: 15000 });
  console.log('✓ ログイン完了');
}

/** 上部アイコン（テキスト付きリンク）を取得 */
async function grabTopMenu(page) {
  const links = await page.$$eval('td.moduleBarIcon a', els =>
    els.map(a => ({ label: a.innerText.trim().replace(/\s+/g, ' '), href: a.getAttribute('href') }))
      .filter(l => l.label && l.href));
  const seen = new Set();
  const topMenu = [];
  for (const l of links) {
    const route = toRoute(l.href);
    if (!route || seen.has(route)) continue;
    seen.add(route);
    topMenu.push({ label: l.label, route, href: l.href });
  }
  return topMenu;
}

/**
 * 左サイドバー（#leftCol）をグループ付きで読み取る。
 * グループ見出しより前の項目は「ショートカット」グループに入れる。
 */
async function grabSideMenu(page) {
  return page.$$eval('#leftCol', cols => {
    const col = cols[0];
    if (!col) return null;
    const groups = [{ name: 'ショートカット', toggleId: null, items: [] }];
    const rows = col.querySelectorAll('tr');
    for (const tr of rows) {
      if (tr.classList.contains('leftColumnModuleHead') && tr.getAttribute('onclick')) {
        const m = /HandleSubmenuDisplay\('([^']+)'\)/.exec(tr.getAttribute('onclick'));
        const span = tr.querySelector('span.subMenuSepText');
        groups.push({ name: span ? span.textContent.trim() : '', toggleId: m ? `${m[1]}_sub` : null, items: [] });
        continue;
      }
      const td = tr.querySelector(':scope > td.subMenuTD, :scope > td.subMenuTDActive');
      if (!td) continue;
      const a = td.querySelector('a[href]');
      const label = a ? a.textContent.trim().replace(/\s+/g, ' ') : '';
      if (!a || !label) continue;
      // 見出しの後でも、その見出しの _sub 行の外にある項目はショートカット扱い
      const current = groups[groups.length - 1];
      const inGroup = current.toggleId && tr.closest(`#${CSS.escape(current.toggleId)}`);
      (inGroup ? current : groups[0]).items.push({ label, href: a.getAttribute('href') });
    }
    return groups;
  });
}

(async () => {
  if (!BASE_URL || !USER) {
    console.error(`ERROR: env/.env.${profile} に BASE_URL / SHIMAMURA_USER がありません`);
    process.exit(1);
  }
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();

  try {
    await login(page);

    // メインメニュー直後は上部アイコン列が出ないため、受講生モジュールを開いてから取得する
    await page.goto(`${BASE_URL}index.php?module=Student&action=index&top_menu=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('td.moduleBarIcon', { timeout: 15000 });
    const topMenu = await grabTopMenu(page);
    console.log(`✓ 上部アイコン: ${topMenu.map(t => t.label).join(' / ')}`);

    // 管理画面はアイコン外（右上リンク）なので明示的に追加
    const targets = [...topMenu, { label: '管理', route: 'Administration/index', href: 'index.php?module=Administration&action=index' }];

    const sideMenu = {};
    for (const icon of targets) {
      await page.goto(new URL(icon.href, BASE_URL).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      const groups = await grabSideMenu(page);
      const key = toIconKey(icon.route);
      if (!groups) {
        console.log(`  ${icon.label}: #leftCol なし`);
        sideMenu[key] = { iconLabel: icon.label, iconRoute: icon.route, groups: [] };
        continue;
      }
      const cleaned = groups
        .map(g => ({
          name: g.name,
          ...(g.toggleId ? { toggleId: g.toggleId } : {}),
          items: g.items.map(it => ({ label: it.label, route: toRoute(it.href) || it.href })),
        }))
        .filter(g => g.toggleId || g.items.length);
      const count = cleaned.reduce((n, g) => n + g.items.length, 0);
      console.log(`  ${icon.label}: ${cleaned.length} グループ / ${count} 項目`);
      sideMenu[key] = { iconLabel: icon.label, iconRoute: icon.route, groups: cleaned };
    }

    const snapshot = {
      capturedAt: new Date().toISOString().slice(0, 10),
      profile,
      product: 'shimamura',
      baseUrl: BASE_URL,
      note: 'scripts/html/fetch_shimamura_menus.js で採取。上部アイコン（＋右上の管理）ごとに #leftCol を走査。' +
            'route は module/action ＋ 画面を区別するパラメータ。toggleId は折りたたみグループの展開対象 ID（sideMenus.js の collapseToggle.icon_id に対応）。',
      topMenu: topMenu.map(({ label, route }) => ({ label, route })),
      sideMenu,
    };

    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
    console.log(`✓ 保存: ${path.relative(REPO_ROOT, OUTPUT_FILE)}`);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
