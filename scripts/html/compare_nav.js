#!/usr/bin/env node
/**
 * juku_test と culture_beta のサイドナビゲーションを比較するスクリプト
 * 使い方: node scripts/html/compare_nav.js
 */
'use strict';

const path = require('path');
const { chromium } = require('playwright');
const dotenv = require('dotenv');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

async function loadEnv(profile) {
  const env = {};
  const base = dotenv.parse(require('fs').readFileSync(path.join(REPO_ROOT, '.env')));
  Object.assign(env, base);
  const override = dotenv.parse(require('fs').readFileSync(path.join(REPO_ROOT, 'env', `.env.${profile}`)));
  Object.assign(env, override);
  return env;
}

async function login(page, env) {
  await page.goto(env.BASE_URL);
  await page.waitForSelector('input[id="loginmodel-username"]', { timeout: 10000 });
  await page.fill('input[id="loginmodel-username"]', env.ADMIN_USER);
  await page.fill('input[id="loginmodel-password"]', env.ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForSelector('a[href*="logout"], a:has-text("ログアウト"), a:has-text("Logout")', { timeout: 15000 });
}

// すべてのメニューアイコンをクリックしてサブメニューを展開してリンクを収集
async function collectNavLinks(page, baseUrl) {
  const links = new Map(); // href(パス部分) → テキスト

  // サイドバーの各アイコンをクリックしてサブメニューを展開
  const iconSelectors = [
    'a[href*="student"]',
    'a[href*="teacher"]',
    'a[href*="course"]',
    'a[href*="calendar"]',
    'a[href*="email"]',
    'a[href*="report"]',
    'a[href*="help"]',
    'a[href*="smsFee"]',
    'a[href*="smsContract"]',
    'a[href*="smsPayment"]',
  ];

  // まずホームページに移動してメニューを表示
  await page.goto(baseUrl + 'index.php', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);

  // 全メインメニューアイコンをクリックしてサブメニューリンクを収集
  const mainMenuItems = await page.$$eval(
    '.tf-menu-icon-list a, .tf-side-menu a, nav a, [class*="menu"] a',
    (els, base) => els.map(a => ({
      text: (a.innerText || a.textContent || '').trim().replace(/\s+/g, ' '),
      href: a.href,
    })).filter(l => l.text && l.href && !l.href.startsWith('javascript') && l.href.includes(base)),
    baseUrl
  );

  // 各アイコンをクリックしてサブメニューを展開
  const iconLinks = await page.$$eval(
    'a[href]',
    (els, base) => els
      .map(a => ({ text: (a.innerText || '').trim(), href: a.href }))
      .filter(l => l.href.includes(base) && !l.href.startsWith('javascript')),
    baseUrl
  );

  iconLinks.forEach(l => {
    try {
      const url = new URL(l.href);
      const r = url.searchParams.get('r') || url.pathname;
      if (r && !links.has(r)) links.set(r, l.text);
    } catch (_) {}
  });

  // 各メインメニューをクリックしてサブメニューを収集
  const menuTexts = ['受講生', 'Student', '講師', 'Teacher', 'コース', 'Course',
    'マスター', 'Master', 'カレンダー', 'Calendar', 'Eメール', 'Email',
    'レポート', 'Report', 'ホーム', 'Home', 'ヘルプ', 'Help', '経理', 'Accounting'];

  for (const text of menuTexts) {
    try {
      const el = await page.$(`a:has-text("${text}")`);
      if (!el) continue;
      await el.click({ timeout: 3000 });
      await page.waitForTimeout(800);

      const subLinks = await page.$$eval(
        'a[href]',
        (els, base) => els
          .map(a => ({ text: (a.innerText || '').trim().replace(/\s+/g, ' '), href: a.href }))
          .filter(l => l.text && l.href.includes(base) && !l.href.startsWith('javascript')),
        baseUrl
      );
      subLinks.forEach(l => {
        try {
          const url = new URL(l.href);
          const r = url.searchParams.get('r') || '';
          if (r && !links.has(r)) links.set(r, l.text);
        } catch (_) {}
      });
    } catch (_) {}
  }

  return links;
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  try {
    const [jukuEnv, cultureEnv] = await Promise.all([
      loadEnv('tframe.juku_test'),
      loadEnv('tframe.culture_beta'),
    ]);

    console.log('=== juku_test にログイン中... ===');
    const jukuPage = await browser.newPage();
    await login(jukuPage, jukuEnv);
    console.log('✓ juku_test ログイン完了');
    const jukuLinks = await collectNavLinks(jukuPage, jukuEnv.BASE_URL);
    await jukuPage.close();

    console.log('=== culture_beta にログイン中... ===');
    const culturePage = await browser.newPage();
    await login(culturePage, cultureEnv);
    console.log('✓ culture_beta ログイン完了');
    const cultureLinks = await collectNavLinks(culturePage, cultureEnv.BASE_URL);
    await culturePage.close();

    // 比較
    const jukuOnly = [];
    const cultureOnly = [];
    const both = [];

    const allKeys = new Set([...jukuLinks.keys(), ...cultureLinks.keys()]);
    for (const r of allKeys) {
      if (!r || r === '') continue;
      const inJuku    = jukuLinks.has(r);
      const inCulture = cultureLinks.has(r);
      const label = jukuLinks.get(r) || cultureLinks.get(r) || '';
      if (inJuku && inCulture)    both.push({ r, label });
      else if (inJuku)            jukuOnly.push({ r, label });
      else                        cultureOnly.push({ r, label });
    }

    console.log('\n========================================');
    console.log('【juku_test のみ】(' + jukuOnly.length + '件)');
    console.log('========================================');
    jukuOnly.forEach(l => console.log(`  ${l.label.padEnd(30)} ${l.r}`));

    console.log('\n========================================');
    console.log('【culture_beta のみ】(' + cultureOnly.length + '件)');
    console.log('========================================');
    cultureOnly.forEach(l => console.log(`  ${l.label.padEnd(30)} ${l.r}`));

    console.log('\n========================================');
    console.log('【両方に存在】(' + both.length + '件)');
    console.log('========================================');
    both.forEach(l => console.log(`  ${l.label.padEnd(30)} ${l.r}`));

  } finally {
    await browser.close();
  }
})();
