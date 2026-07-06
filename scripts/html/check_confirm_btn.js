'use strict';
const { chromium } = require('playwright');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../env/.env.shimamura.testgcp'), override: true });

const BASE_URL  = (process.env.BASE_URL || '').replace(/\/?$/, '/');
const USER      = process.env.SHIMAMURA_USER;
const PASS      = process.env.SHIMAMURA_PASSWORD;
const TANTOUSYA = process.env.SHIMAMURA_TANTOUSYA || '00033';
const RECORD    = process.argv[2] || 'ec753746-fc06-11f0-b915-42010a28a120';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page    = await (await browser.newContext({ locale: 'ja-JP' })).newPage();

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

  const url = `${BASE_URL}index.php?module=Student&action=DWConfirmCarteKeiri_AN&record=${RECORD}`;
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'scripts/html/confirm_btn.png' });

  // ボタン一覧を取得
  const btns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input[type="button"], input[type="submit"], button'))
      .map(b => ({ tag: b.tagName, type: b.type, value: b.value, text: b.textContent.trim(), name: b.name, id: b.id }))
  );
  console.log('ボタン一覧:');
  btns.forEach(b => console.log(`  ${b.tag}[${b.type}] value="${b.value}" text="${b.text}" name="${b.name}" id="${b.id}"`));

  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
