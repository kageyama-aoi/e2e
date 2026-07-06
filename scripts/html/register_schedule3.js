'use strict';
/**
 * 口座振替スケジュール登録（confirm ダイアログ対応版）
 * onclick: window.confirm('口座振替スケジュール作成を実行します。よろしいですか？')
 *          → accept → this.form.submit() (GET)
 */

const { chromium } = require('playwright');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../env/.env.shimamura.testgcp'), override: true });

const BASE_URL  = (process.env.BASE_URL || '').replace(/\/?$/, '/');
const USER      = process.env.SHIMAMURA_USER;
const PASS      = process.env.SHIMAMURA_PASSWORD;
const TANTOUSYA = process.env.SHIMAMURA_TANTOUSYA || '00033';

const SCHEDULE_URL = BASE_URL + 'index.php?module=ShimaSchedule&action=LWAccountTransferScheduleRegistration_AN';

async function login(page) {
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
}

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const ctx     = await browser.newContext({ locale: 'ja-JP' });
  const page    = await ctx.newPage();

  // confirm ダイアログを自動承認
  page.on('dialog', async dialog => {
    console.log(`  [DIALOG ${dialog.type()}] "${dialog.message()}" → accept`);
    await dialog.accept();
  });

  await login(page);
  console.log('ログイン完了\n');

  await page.goto(SCHEDULE_URL);
  await page.waitForLoadState('networkidle');

  // フォームに値をセット
  await page.locator('select[name="shima_storage_id"]').selectOption({ value: '1434050501' });
  await page.waitForTimeout(300);

  await page.evaluate(() => {
    document.querySelector('input[name="claim_month"]').value = '2026-07';
    document.querySelector('input[name="data_date"]').value   = '2026-07-10';
    document.querySelector('input[name="t_date"]').value      = '2026-07-20';
  });
  await page.locator('input[name="claim_month"]').fill('2026-07');
  await page.locator('input[name="data_date"]').fill('2026-07-10');
  await page.locator('input[name="t_date"]').fill('2026-07-20');

  const vals = await page.evaluate(() => ({
    storage: document.querySelector('select[name="shima_storage_id"]')?.value,
    month:   document.querySelector('input[name="claim_month"]')?.value,
    date:    document.querySelector('input[name="data_date"]')?.value,
    tdate:   document.querySelector('input[name="t_date"]')?.value,
  }));
  console.log('フォーム値確認:', vals);

  await page.screenshot({ path: 'scripts/html/reg3_before.png' });

  // ボタンクリック + ページ遷移を待つ（GETフォーム送信）
  console.log('\n登録ボタンをクリック（confirmダイアログを自動承認）...');
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.locator('input[name="register_button"]').click(),
  ]);

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/html/reg3_after.png' });
  console.log(`登録後URL: ${page.url()}`);

  // 件数確認
  const pageInfo = await page.locator('text=/計:\\s*\\d+/').first().textContent({ timeout: 3000 }).catch(() => '');
  console.log(`件数テキスト: "${pageInfo}"`);

  // 143:2026-07 を検索
  const found2607 = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('tr'))
      .some(tr => {
        const cells = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
        return cells.length >= 2 && cells[0].includes('143') && cells[1] === '2026-07';
      });
  });
  console.log(`\n現在のページで143:2026-07: ${found2607 ? '✓ 発見' : '見つからない（別ページかも）'}`);

  // 全体スキャン（念のため）
  await page.goto(SCHEDULE_URL + '&ShimaSchedule_LWAccountTransferScheduleRegistration_AN_offset=90');
  await page.waitForLoadState('networkidle');

  for (let offset = 90; offset <= 150; offset += 15) {
    const rows = await page.evaluate(() =>
      Array.from(document.querySelectorAll('tr'))
        .map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim()))
        .filter(cells => cells.length >= 4 && /^\d{3}:/.test(cells[0]) && /^\d{4}-\d{2}$/.test(cells[1]))
    );
    const hit = rows.filter(r => r[0].includes('143'));
    if (hit.length) {
      console.log(`\noffset=${offset} の 143 エントリ:`);
      hit.forEach(r => console.log(`  ${r[0]} | ${r[1]} | ${r[2]} | ${r[3]}`));
    }
    await page.goto(SCHEDULE_URL + `&ShimaSchedule_LWAccountTransferScheduleRegistration_AN_offset=${offset + 15}`);
    await page.waitForLoadState('networkidle');
  }

  await browser.close();
  console.log('\n=== 完了 ===');
}

main().catch(err => { console.error('エラー:', err); process.exit(1); });
