'use strict';
const { chromium } = require('playwright');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../env/.env.shimamura.testgcp'), override: true });

const BASE_URL  = (process.env.BASE_URL || '').replace(/\/?$/, '/');
const USER      = process.env.SHIMAMURA_USER;
const PASS      = process.env.SHIMAMURA_PASSWORD;
const TANTOUSYA = process.env.SHIMAMURA_TANTOUSYA || '00033';

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const ctx     = await browser.newContext({ locale: 'ja-JP' });
  const page    = await ctx.newPage();

  // ログイン
  await page.goto(BASE_URL);
  await page.locator('input[name="user_name"]').waitFor({ timeout: 15000 });
  await page.evaluate(([u, p]) => {
    document.querySelector('input[name="user_name"]').value = u;
    document.querySelector('input[name="user_password"]').value = p;
  }, [USER, PASS]);
  await page.locator('input[value="ログイン"]').click();
  await page.waitForLoadState('networkidle');
  const idField = page.locator('input[name="idnumber"]');
  if (await idField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await idField.fill(TANTOUSYA);
    await page.locator('input[value="メインメニュー"]').click();
    await page.waitForLoadState('networkidle');
  }

  // 口座振替スケジュール登録ページへ
  const scheduleUrl = BASE_URL + 'index.php?module=ShimaSchedule&action=LWAccountTransferScheduleRegistration_AN';
  await page.goto(scheduleUrl);
  await page.waitForLoadState('networkidle');
  console.log('スケジュールページ:', page.url());
  await page.screenshot({ path: 'scripts/html/schedule_01_top.png' });

  // テーブル全行を取得
  const rows = await page.locator('table tr').evaluateAll(
    trs => trs.map(tr =>
      Array.from(tr.querySelectorAll('td, th')).map(c => c.textContent.trim())
    ).filter(r => r.some(c => c))
  );
  console.log('\nスケジュール一覧:');
  rows.forEach((r, i) => console.log(`  [${i}]`, r.join(' | ')));

  await browser.close();
}

main().catch(err => { console.error(err); process.exit(1); });
