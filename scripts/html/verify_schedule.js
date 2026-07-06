'use strict';
/**
 * 143:T_JF収納業者143 の 2026-07 スケジュール登録確認 & 未登録なら登録
 * - 全ページを 143 のみフィルタしてスキャン
 * - 2026-07 が見つかれば ✓ 終了
 * - 見つからなければフォームに入力 → page.evaluate でsubmit
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
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const ctx     = await browser.newContext({ locale: 'ja-JP' });
  const page    = await ctx.newPage();

  await login(page);
  console.log('ログイン完了');

  // 全ページをスキャンして 143:T_JF 収納業者の2026-07を探す
  await page.goto(SCHEDULE_URL);
  await page.waitForLoadState('networkidle');

  let found = false;
  let pageNum = 1;

  while (true) {
    // テーブルの実データ行のみ取得（収納業者 / 請求月 / 引落日 / 入金日）
    const rows = await page.evaluate(() => {
      // メインコンテンツ内のテーブルを特定
      const trs = document.querySelectorAll('#list_view table tr, .listViewBody tr, table.list tr');
      if (!trs.length) {
        // フォールバック: 全 tr から td が 4つ以上ある行を取得
        return Array.from(document.querySelectorAll('tr'))
          .map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim()))
          .filter(cells => {
            if (cells.length < 4) return false;
            // 収納業者列が "XXX:..." 形式かつ請求月が "YYYY-MM" 形式
            return /^\d{3}:/.test(cells[0]) && /^\d{4}-\d{2}$/.test(cells[1]);
          });
      }
      return Array.from(trs)
        .map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim()))
        .filter(cells => cells.length >= 4 && /^\d{3}:/.test(cells[0]) && /^\d{4}-\d{2}$/.test(cells[1]));
    });

    const has143on07 = rows.some(r => r[0].includes('143') && r[1] === '2026-07');
    const count143   = rows.filter(r => r[0].includes('143')).length;
    console.log(`[page ${pageNum}] データ行: ${rows.length} / 143件: ${count143}`);
    rows.filter(r => r[0].includes('143')).forEach(r => console.log(`  → ${r[0]} | ${r[1]} | ${r[2]} | ${r[3]}`));

    if (has143on07) { found = true; break; }

    const nextLink = page.locator('a').filter({ hasText: '次' }).first();
    const hasNext  = await nextLink.isVisible({ timeout: 2000 }).catch(() => false);
    if (!hasNext) break;
    await nextLink.click();
    await page.waitForLoadState('networkidle');
    pageNum++;
    if (pageNum > 30) break;
  }

  if (found) {
    console.log('\n✓ 143:T_JF収納業者143 の 2026-07 は登録済みです！');
    await page.screenshot({ path: 'scripts/html/verify_found.png' });
    await browser.close();
    return;
  }

  console.log('\n✗ 2026-07 未登録。登録を実行します...');

  // フォームを操作して登録
  await page.goto(SCHEDULE_URL);
  await page.waitForLoadState('networkidle');

  // 収納業者を選択
  await page.locator('select[name="shima_storage_id"]').selectOption({ value: '1434050501' });
  await page.waitForTimeout(500);

  // フォームに値をセット
  await page.locator('input[name="claim_month"]').fill('2026-07');
  await page.locator('input[name="data_date"]').fill('2026-07-10');
  await page.locator('input[name="t_date"]').fill('2026-07-20');

  await page.screenshot({ path: 'scripts/html/verify_filled.png' });
  console.log('フォーム入力完了');

  // 総件数を登録前に記録
  const countBefore = await page.locator('.listViewBody tr, table tr').count();
  console.log(`登録前の行数: ${countBefore}`);

  // 登録ボタンをクリックし、ページ変化を待つ
  const [response] = await Promise.all([
    page.waitForNavigation({ timeout: 15000 }).catch(() => null),
    page.locator('input[name="register_button"]').click(),
  ]);
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: 'scripts/html/verify_after_submit.png' });
  console.log(`登録後URL: ${page.url()}`);

  // 総件数を確認
  const totalText = await page.locator('text=/計:\\s*\\d+/').first().textContent({ timeout: 3000 }).catch(() => '');
  console.log(`ページ内件数テキスト: "${totalText}"`);

  // 再度 143 の 2026-07 を確認
  const rows143 = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('tr'))
      .map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim()))
      .filter(cells => cells.length >= 4 && /^\d{3}:/.test(cells[0]) && /^\d{4}-\d{2}$/.test(cells[1]));
  });
  const found2 = rows143.some(r => r[0].includes('143') && r[1] === '2026-07');
  console.log(`\n143 の2026-07: ${found2 ? '✓ 登録確認' : '⚠ まだ見つからない'}`);
  rows143.filter(r => r[0].includes('143')).forEach(r => console.log(`  ${r[0]} | ${r[1]} | ${r[2]} | ${r[3]}`));

  await browser.close();
  console.log('\n=== 完了 ===');
}

main().catch(err => { console.error('エラー:', err); process.exit(1); });
