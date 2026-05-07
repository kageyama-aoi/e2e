#!/usr/bin/env node
/**
 * tframe 登録画面の HTML を Playwright で取得して input/ に保存するスクリプト。
 * 使い方: node scripts/html/fetch_tframe_forms.js <profile>
 *   例: node scripts/html/fetch_tframe_forms.js tframe.culture_beta
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const dotenv = require('dotenv');

// ── 環境変数ロード ────────────────────────────────────────────
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const profile   = process.argv[2] || 'tframe.culture_beta';

dotenv.config({ path: path.join(REPO_ROOT, '.env') });
dotenv.config({ path: path.join(REPO_ROOT, 'env', `.env.${profile}`), override: true });

const BASE_URL  = process.env.BASE_URL;
const USER      = process.env.ADMIN_USER;
const PASSWORD  = process.env.ADMIN_PASSWORD;

if (!BASE_URL || !USER || !PASSWORD) {
  console.error('BASE_URL / ADMIN_USER / ADMIN_PASSWORD が設定されていません。');
  process.exit(1);
}

const INPUT_DIR = path.join(__dirname, 'input');
fs.mkdirSync(INPUT_DIR, { recursive: true });

// ── 取得対象 ──────────────────────────────────────────────────
// directUrl を指定するとリンク検索をスキップして直接アクセスする
const TARGETS = [
  { name: 'shohin_touroku',    hint: '商品登録' },
  { name: 'chosekin_touroku',  hint: '調整金登録' },
  { name: 'course_touroku',    hint: 'コース登録',  directUrl: `${BASE_URL}index.php?r=course%2Few%2F_default` },
  { name: 'jukusei_touroku',  hint: '受講生登録',  directUrl: `${BASE_URL}index.php?r=student%2Few%2F_default` },
  { name: 'kyoshitsu_touroku',    hint: '教室登録',      directUrl: `${BASE_URL}index.php?r=classroom%2Few%2F_default` },
  { name: 'ryokin_master_touroku', hint: '料金マスタ作成', directUrl: `${BASE_URL}index.php?r=smsFeeMaster%2Few%2F_default` },
  { name: 'branch_touroku',       hint: '校舎登録',      directUrl: `${BASE_URL}index.php?r=branch%2Few%2F_default` },
];

// ── ヘルパー ─────────────────────────────────────────────────
async function login(page) {
  await page.goto(BASE_URL);
  await page.waitForSelector('input[id="loginmodel-username"]', { timeout: 10000 });
  await page.fill('input[id="loginmodel-username"]', USER);
  await page.fill('input[id="loginmodel-password"]', PASSWORD);
  await page.click('button[type="submit"]');
  // ログアウトリンクが現れるまで待つ（ログイン完了の確認）
  await page.waitForSelector('a[href*="logout"], a:has-text("ログアウト"), a:has-text("Logout")', { timeout: 15000 });
  console.log('✓ ログイン完了:', page.url());
}

async function expandSideMenu(page) {
  // 経理タブをクリックしてメニューを展開（ナビゲーションは発生しないはず）
  const keiriTabs = await page.$$('text=経理');
  for (const el of keiriTabs) {
    try {
      const tagName = await el.evaluate(e => e.tagName.toLowerCase());
      // リンクでなければクリック（accordion toggle など）
      if (tagName !== 'a') await el.click({ timeout: 1000 });
    } catch (_) {}
  }
  await page.waitForTimeout(800);
}

async function dumpAllLinks(page) {
  return page.$$eval('a[href]', els =>
    els.map(a => ({ text: a.innerText.trim().replace(/\s+/g, ' '), href: a.href }))
      .filter(l => l.text && l.href && !l.href.startsWith('javascript'))
  );
}

async function getFormHtml(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);

  const html = await page.$eval('#rootWidget', el => el.outerHTML)
    .catch(async () => {
      console.warn('  #rootWidget が見つからないため body を取得します');
      return page.$eval('body', el => el.innerHTML);
    });
  return html;
}

// ── メイン ────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();

  try {
    await login(page);

    // スクリーンショット保存
    await page.screenshot({ path: path.join(INPUT_DIR, 'after_login.png'), fullPage: false });
    console.log('  スクリーンショット保存: scripts/html/input/after_login.png');

    // 経理セクションへ移動してサイドメニューを展開
    const keiriLink = `${BASE_URL}index.php?r=smsFee%2Fsw%2F_default&isTopMenu=1`;
    console.log('  経理ページへ移動:', keiriLink);
    await page.goto(keiriLink, { waitUntil: 'networkidle', timeout: 20000 });
    await expandSideMenu(page);

    // スクリーンショット（経理ページ）
    await page.screenshot({ path: path.join(INPUT_DIR, 'keiri_page.png'), fullPage: true });
    console.log('  スクリーンショット保存: scripts/html/input/keiri_page.png');

    const links = await dumpAllLinks(page);

    // 全リンクをファイルに保存（デバッグ用）
    const linksFile = path.join(INPUT_DIR, 'all_links.json');
    fs.writeFileSync(linksFile, JSON.stringify(links, null, 2), 'utf8');
    console.log(`\n全リンク数: ${links.length} 件 → ${linksFile}`);

    // 経理タブ関連リンクを表示
    const keiriLinks = links.filter(l =>
      l.text.includes('経理') || l.text.includes('商品') || l.text.includes('調整') ||
      l.href.includes('smsItem') || l.href.includes('smsAdjust') || l.href.includes('smsMisc') ||
      l.href.includes('Fee') || l.href.includes('fee') || l.href.includes('Payment')
    );
    console.log('\n【経理関連リンク候補】');
    keiriLinks.forEach(l => console.log(`  "${l.text}" → ${l.href}`));

    // ターゲットページのHTML取得
    for (const target of TARGETS) {
      console.log(`\n▶ ${target.hint} を検索中...`);
      let targetUrl = target.directUrl;
      if (!targetUrl) {
        const found = links.find(l =>
          l.text === target.hint || l.text.includes(target.hint)
        );
        if (!found) {
          console.warn(`  ⚠ "${target.hint}" のリンクが見つかりません。`);
          continue;
        }
        targetUrl = found.href;
      }
      console.log(`  URL: ${targetUrl}`);
      const html = await getFormHtml(page, targetUrl);
      const outFile = path.join(INPUT_DIR, `${target.name}.html`);
      fs.writeFileSync(outFile, html, 'utf8');
      console.log(`  ✓ 保存: ${outFile} (${Math.round(html.length / 1024)} KB)`);
    }

  } catch (err) {
    console.error('\nERROR:', err.message);
    await page.screenshot({ path: path.join(INPUT_DIR, 'error_screenshot.png') });
  } finally {
    await browser.close();
  }
})();
