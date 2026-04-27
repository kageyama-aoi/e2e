#!/usr/bin/env node
/**
 * chosekin 登録フォームの personId ポップアップから講師IDを取得するスクリプト。
 * 使い方: node scripts/html/fetch_chosekin_person_id.js <profile>
 *   例: node scripts/html/fetch_chosekin_person_id.js tframe.culture_beta
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const dotenv = require('dotenv');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const profile   = process.argv[2] || 'tframe.culture_beta';

dotenv.config({ path: path.join(REPO_ROOT, '.env') });
dotenv.config({ path: path.join(REPO_ROOT, 'env', `.env.${profile}`), override: true });

const BASE_URL = process.env.BASE_URL;
const USER     = process.env.ADMIN_USER;
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!BASE_URL || !USER || !PASSWORD) {
  console.error('BASE_URL / ADMIN_USER / ADMIN_PASSWORD が設定されていません。');
  process.exit(1);
}

const INPUT_DIR = path.join(__dirname, 'input');
fs.mkdirSync(INPUT_DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();

  try {
    // ログイン
    await page.goto(BASE_URL);
    await page.waitForSelector('input[id="loginmodel-username"]', { timeout: 10000 });
    await page.fill('input[id="loginmodel-username"]', USER);
    await page.fill('input[id="loginmodel-password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForSelector('a[href*="logout"], a:has-text("ログアウト")', { timeout: 15000 });
    console.log('✓ ログイン完了');

    // 調整金登録フォームへ移動
    const chosekinUrl = `${BASE_URL}index.php?r=shareiDetail%2Few%2F_default`;
    await page.goto(chosekinUrl, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForSelector('#personId_start', { timeout: 10000 });
    console.log('✓ 調整金登録フォーム表示完了');

    // personId_start ボタンをクリックしてポップアップを開く
    await page.click('#personId_start');
    console.log('✓ personId_start クリック');

    // ポップアップコンテンツが読み込まれるまで待つ
    // tf.popup.open は Bootstrap モーダルか別のポップアップを開く
    await page.waitForTimeout(3000);

    // ポップアップ内の要素を探す
    const popupHtml = await page.evaluate(() => {
      // モーダルを探す
      const modal = document.querySelector('.modal.in, .modal[style*="display: block"], .modal[style*="display:block"]');
      if (modal) return modal.outerHTML;
      // popup_ prefix のdivを探す
      const popupDivs = document.querySelectorAll('[id^="popup_"]');
      return Array.from(popupDivs).map(d => d.outerHTML).join('\n');
    });

    if (popupHtml) {
      const popupFile = path.join(INPUT_DIR, 'chosekin_person_popup.html');
      fs.writeFileSync(popupFile, popupHtml, 'utf8');
      console.log(`✓ ポップアップHTML保存: ${popupFile}`);
    }

    // スクリーンショット
    await page.screenshot({ path: path.join(INPUT_DIR, 'chosekin_popup.png'), fullPage: true });
    console.log('✓ スクリーンショット保存: scripts/html/input/chosekin_popup.png');

    // onclick 属性から personId 値を抽出（ポップアップ内のリンク）
    const teacherLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('[onclick*="personId"], [data-id]');
      const results = [];
      links.forEach(el => {
        results.push({
          tag: el.tagName,
          text: el.innerText || el.textContent,
          onclick: el.getAttribute('onclick'),
          dataId: el.getAttribute('data-id'),
        });
      });
      return results;
    });

    if (teacherLinks.length > 0) {
      console.log('\n【講師リンク候補】');
      teacherLinks.forEach(l => console.log(JSON.stringify(l)));
    }

    // iframe内も探す
    const frames = page.frames();
    for (const frame of frames) {
      if (frame === page.mainFrame()) continue;
      console.log('\n  iframe url:', frame.url());
      try {
        const frameLinks = await frame.evaluate(() => {
          const links = document.querySelectorAll('a, [onclick]');
          return Array.from(links).slice(0, 20).map(el => ({
            tag: el.tagName,
            text: (el.innerText || el.textContent || '').trim(),
            href: el.getAttribute('href'),
            onclick: el.getAttribute('onclick'),
          }));
        });
        frameLinks.forEach(l => console.log('    ', JSON.stringify(l)));
      } catch (e) {
        console.log('  iframe 読み取り失敗:', e.message);
      }
    }

    // 全ポップアップ関連div
    const allPopupInfo = await page.evaluate(() => {
      const visible = [];
      document.querySelectorAll('[id^="popup_"]').forEach(el => {
        const style = window.getComputedStyle(el);
        visible.push({
          id: el.id,
          display: style.display,
          visibility: style.visibility,
          innerHTML: el.innerHTML.slice(0, 500),
        });
      });
      return visible;
    });

    console.log('\n【popup_ divs】');
    allPopupInfo.forEach(p => {
      console.log(`  id=${p.id} display=${p.display} visibility=${p.visibility}`);
      if (p.innerHTML) console.log('  content:', p.innerHTML.slice(0, 200));
    });

  } catch (err) {
    console.error('\nERROR:', err.message);
    await page.screenshot({ path: path.join(INPUT_DIR, 'error_person_id.png') });
  } finally {
    await browser.close();
  }
})();
