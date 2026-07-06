#!/usr/bin/env node
/**
 * shimamura のナビゲーション（サイドバー・上部アイコン）HTML を取得するスクリプト。
 * 使い方: node scripts/html/fetch_shimamura_nav.js <profile>
 * 目的: サイドバーリンクの CSS クラス・コンテナ構造を確認する
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const dotenv = require('dotenv');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const profile   = process.argv[2] || 'shimamura.testgcp';

dotenv.config({ path: path.join(REPO_ROOT, '.env') });
dotenv.config({ path: path.join(REPO_ROOT, 'env', `.env.${profile}`), override: true });

const BASE_URL  = (process.env.BASE_URL || '').replace(/\/?$/, '/');
const USER      = process.env.SHIMAMURA_USER;
const PASSWORD  = process.env.SHIMAMURA_PASSWORD;
const TANTOUSYA = process.env.SHIMAMURA_TANTOUSYA;

const OUTPUT_DIR = path.join(__dirname, 'shimamura');

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

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();

  try {
    await login(page);

    // 受講生アイコン選択後のページ（サイドバーが受講生状態）
    const url = `${BASE_URL}index.php?module=Student&action=index&top_menu=1`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1000);

    // フルページ body HTML を保存（ナビ構造確認用）
    const fullHtml = await page.$eval('body', el => el.innerHTML);
    const outFull = path.join(OUTPUT_DIR, 'nav_full_body.html');
    fs.writeFileSync(outFull, fullHtml, 'utf8');
    console.log(`✓ フルbody保存: ${outFull} (${Math.round(fullHtml.length / 1024)} KB)`);

    // HideMenu（サイドバー候補）があれば個別に保存
    const containers = ['#HideMenu', '#sidebar', '#leftcol', '#subpanel_', '.nav-sidebar', '#moduleMenu'];
    for (const sel of containers) {
      try {
        const html = await page.$eval(sel, el => el.outerHTML);
        const name = sel.replace(/[#.\[\]=]/g, '_');
        const out = path.join(OUTPUT_DIR, `nav_${name}.html`);
        fs.writeFileSync(out, html, 'utf8');
        console.log(`✓ ${sel} 保存: nav_${name}.html (${Math.round(html.length / 1024)} KB)`);
      } catch (_) {
        console.log(`  ${sel} → 見つからず`);
      }
    }

    // ナビ内の a タグをすべて抽出（class 付き）
    const navLinks = await page.$$eval('a[href]', els =>
      els.map(a => ({
        text: a.innerText.trim().replace(/\s+/g, ' '),
        href: a.getAttribute('href'),
        className: a.className,
        id: a.id || '',
        parentId: a.parentElement ? (a.parentElement.id || '') : '',
        parentClass: a.parentElement ? (a.parentElement.className || '') : '',
      })).filter(l => l.text && l.href && !l.href.startsWith('javascript'))
    );

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'nav_links_with_class.json'),
      JSON.stringify(navLinks, null, 2),
      'utf8'
    );
    console.log(`✓ クラス付きリンク: ${navLinks.length} 件 → nav_links_with_class.json`);

  } catch (err) {
    console.error('ERROR:', err.message);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'nav_error.png') });
  } finally {
    await browser.close();
  }
})();
