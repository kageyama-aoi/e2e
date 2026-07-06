'use strict';
/**
 * 口座振替スケジュール登録（AJAX対応版）
 * - ボタンのonclick/JS を確認
 * - waitForResponse でAJAX完了を待機
 * - 登録後にページを再読み込みして件数変化を確認
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

  // 全リクエストをログ
  page.on('request', req => {
    if (req.method() === 'POST' || req.url().includes('ShimaSchedule')) {
      console.log(`  [REQ] ${req.method()} ${req.url()}`);
    }
  });
  page.on('response', res => {
    if (res.url().includes('ShimaSchedule')) {
      console.log(`  [RES] ${res.status()} ${res.url()}`);
    }
  });

  await login(page);
  console.log('ログイン完了\n');

  await page.goto(SCHEDULE_URL);
  await page.waitForLoadState('networkidle');

  // ボタンのイベントハンドラを確認
  const btnInfo = await page.evaluate(() => {
    const btn = document.querySelector('input[name="register_button"]');
    if (!btn) return 'ボタンが見つからない';
    return {
      type: btn.type,
      onclick: btn.getAttribute('onclick'),
      onclickProp: btn.onclick ? btn.onclick.toString().slice(0, 200) : null,
    };
  });
  console.log('登録ボタン情報:', JSON.stringify(btnInfo, null, 2));

  // フォームのaction/methodを確認
  const formInfo = await page.evaluate(() => {
    const forms = Array.from(document.querySelectorAll('form'));
    return forms.map(f => ({
      id: f.id,
      name: f.name || '',
      action: f.action,
      method: f.method,
      enctype: f.enctype,
    }));
  });
  console.log('\nフォーム一覧:', JSON.stringify(formInfo, null, 2));

  // フォームに値をセット
  console.log('\nフォームに入力中...');
  await page.locator('select[name="shima_storage_id"]').selectOption({ value: '1434050501' });
  await page.waitForTimeout(300);

  // JavaScriptでも直接値をセット（datepicker の場合 fill が反映されないことがある）
  await page.evaluate(() => {
    document.querySelector('input[name="claim_month"]').value = '2026-07';
    document.querySelector('input[name="data_date"]').value   = '2026-07-10';
    document.querySelector('input[name="t_date"]').value      = '2026-07-20';
    // changeイベントを発火
    ['claim_month', 'data_date', 't_date'].forEach(name => {
      const el = document.querySelector(`input[name="${name}"]`);
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur',   { bubbles: true }));
    });
  });

  // Playwright の fill も追加で実行
  await page.locator('input[name="claim_month"]').fill('2026-07');
  await page.locator('input[name="data_date"]').fill('2026-07-10');
  await page.locator('input[name="t_date"]').fill('2026-07-20');

  await page.screenshot({ path: 'scripts/html/reg2_filled.png' });
  console.log('スクリーンショット: reg2_filled.png');

  // 値の確認
  const vals = await page.evaluate(() => ({
    storage: document.querySelector('select[name="shima_storage_id"]')?.value,
    month:   document.querySelector('input[name="claim_month"]')?.value,
    date:    document.querySelector('input[name="data_date"]')?.value,
    tdate:   document.querySelector('input[name="t_date"]')?.value,
  }));
  console.log('フォーム値確認:', vals);

  // ボタンをクリック（AJAX の場合 waitForResponse を使う）
  console.log('\n登録ボタンをクリック...');
  const responsePromise = page.waitForResponse(
    res => res.url().includes('ShimaSchedule'),
    { timeout: 15000 }
  ).catch(() => null);

  await page.locator('input[name="register_button"]').click();
  const response = await responsePromise;
  if (response) {
    console.log(`  レスポンス: ${response.status()} ${response.url()}`);
    try {
      const body = await response.text();
      console.log(`  ボディ先頭200文字: ${body.slice(0, 200)}`);
    } catch (e) { /* ignore */ }
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'scripts/html/reg2_after.png' });
  console.log('スクリーンショット: reg2_after.png');

  // ページをリロードして件数を確認
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 最終ページに移動して合計件数を確認
  const lastLink = page.locator('a').filter({ hasText: '最後' }).first();
  if (await lastLink.isVisible({ timeout: 2000 }).catch(() => false)) {
    await lastLink.click();
    await page.waitForLoadState('networkidle');
  }
  const pageInfo = await page.locator('text=/計:\\s*\\d+/').first().textContent({ timeout: 3000 }).catch(() => '');
  console.log(`\nリロード後の件数: "${pageInfo}"`);

  await page.screenshot({ path: 'scripts/html/reg2_reload.png' });
  await browser.close();
  console.log('完了');
}

main().catch(err => { console.error('エラー:', err); process.exit(1); });
