'use strict';
/**
 * 口座振替スケジュール 確認 & 登録スクリプト
 * - 全件スキャンして 143 の最新エントリを確認
 * - 2026/07 が未登録なら既存の日付パターンを踏襲して登録
 *
 * 使い方: node scripts/html/register_schedule.js [--dry-run]
 *   --dry-run: 確認のみ、登録しない
 */

const { chromium } = require('playwright');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../env/.env.shimamura.testgcp'), override: true });

const BASE_URL  = (process.env.BASE_URL || '').replace(/\/?$/, '/');
const USER      = process.env.SHIMAMURA_USER;
const PASS      = process.env.SHIMAMURA_PASSWORD;
const TANTOUSYA = process.env.SHIMAMURA_TANTOUSYA || '00033';
const DRY_RUN   = process.argv.includes('--dry-run');

const SCHEDULE_URL = BASE_URL + 'index.php?module=ShimaSchedule&action=LWAccountTransferScheduleRegistration_AN';

// ---- ログイン ---------------------------------------------------------------
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

// ---- テーブル行を取得 -------------------------------------------------------
async function getTableRows(page) {
  return page.locator('table tr').evaluateAll(trs =>
    trs.map(tr => {
      const cells = Array.from(tr.querySelectorAll('td'));
      if (cells.length < 4) return null;
      return {
        storage: cells[0]?.textContent.trim(),
        month:   cells[1]?.textContent.trim(),
        hikiotoshi: cells[2]?.textContent.trim(),
        nyukin:  cells[3]?.textContent.trim(),
      };
    }).filter(r => r && r.storage)
  );
}

// ---- 全ページをスキャンして 143 エントリを取得 ------------------------------
async function scan143Entries(page) {
  await page.goto(SCHEDULE_URL);
  await page.waitForLoadState('networkidle');

  const entries143 = [];
  let pageNum = 1;

  while (true) {
    const rows = await getTableRows(page);
    const filtered = rows.filter(r => r.storage.includes('143'));
    entries143.push(...filtered);

    // 全件のうち 143 以外（001, 008 など）しかない場合でも全ページ確認
    const allRows = rows;
    console.log(`  [page ${pageNum}] 全${allRows.length}行 / 143: ${filtered.length}件`);
    if (filtered.length > 0) {
      filtered.forEach(r => console.log(`    ${r.storage} | ${r.month} | ${r.hikiotoshi} | ${r.nyukin}`));
    }

    // 次ページリンク確認
    const nextLink = page.locator('a').filter({ hasText: '次' }).first();
    const hasNext = await nextLink.isVisible({ timeout: 2000 }).catch(() => false);
    if (!hasNext) break;

    await nextLink.click();
    await page.waitForLoadState('networkidle');
    pageNum++;
    if (pageNum > 20) { console.warn('20ページ超で打ち切り'); break; }
  }

  return entries143;
}

// ---- 収納業者ドロップダウンの選択肢を取得 -----------------------------------
async function getStorageOptions(page) {
  await page.goto(SCHEDULE_URL);
  await page.waitForLoadState('networkidle');
  return page.locator('select[name="shima_storage_id"]').evaluate(sel => {
    return Array.from(sel.options).map(o => ({ value: o.value, text: o.text.trim() }));
  });
}

// ---- スケジュールを登録 -----------------------------------------------------
async function registerSchedule(page, storageValue, month, hikiotoshi, nyukin) {
  await page.goto(SCHEDULE_URL);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'scripts/html/schedule_before_register.png' });

  console.log(`\n登録: 収納業者=${storageValue}, 請求月=${month}, 引落日=${hikiotoshi}, 入金日=${nyukin}`);

  // 収納業者を選択
  await page.locator('select[name="shima_storage_id"]').selectOption({ value: storageValue });
  await page.waitForTimeout(300);

  // 請求月 (claim_month)
  await page.locator('input[name="claim_month"]').fill(month);

  // 引落日 (data_date)
  await page.locator('input[name="data_date"]').fill(hikiotoshi);

  // 入金日 (t_date)
  await page.locator('input[name="t_date"]').fill(nyukin);

  await page.screenshot({ path: 'scripts/html/schedule_filled.png' });
  console.log('  フォームに入力完了 → 登録ボタンをクリック');

  await page.locator('input[name="register_button"]').click();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'scripts/html/schedule_after_register.png' });
  console.log('  → 登録完了（スクリーンショット: schedule_after_register.png）');
}

// ---- フォームのinput名を確認する -------------------------------------------
async function inspectForm(page) {
  await page.goto(SCHEDULE_URL);
  await page.waitForLoadState('networkidle');

  const formInfo = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
    return inputs.map(el => ({
      tag: el.tagName,
      type: el.type || '',
      name: el.name || '',
      id: el.id || '',
      value: el.value || '',
      placeholder: el.placeholder || '',
    }));
  });
  console.log('\n=== フォーム要素一覧 ===');
  formInfo.forEach(el => console.log(`  ${el.tag}[${el.type}] name="${el.name}" id="${el.id}" value="${el.value}"`));
  return formInfo;
}

// ---- メイン -----------------------------------------------------------------
async function main() {
  console.log(`=== 口座振替スケジュール確認 & 登録 ===`);
  console.log(`環境: ${BASE_URL}`);
  console.log(`モード: ${DRY_RUN ? 'DRY RUN（確認のみ）' : '実登録あり'}\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const ctx     = await browser.newContext({ locale: 'ja-JP' });
  const page    = await ctx.newPage();

  await login(page);
  console.log('ログイン完了\n');

  // フォーム構造を確認
  const formInfo = await inspectForm(page);

  // 収納業者ドロップダウンを確認
  const storageOptions = await getStorageOptions(page);
  console.log('\n=== 収納業者ドロップダウン ===');
  storageOptions.forEach(o => console.log(`  value="${o.value}" text="${o.text}"`));

  const storage143 = storageOptions.find(o => o.text.includes('143') || o.value.includes('143'));
  if (!storage143) {
    console.log('\n⚠ 143:T_JF収納業者143 がドロップダウンに見つかりません');
    await browser.close();
    return;
  }
  console.log(`\n✓ 143 のドロップダウン値: value="${storage143.value}" text="${storage143.text}"`);

  // 全ページスキャンして 143 のエントリを確認
  console.log('\n=== 143 エントリのスキャン ===');
  const entries143 = await scan143Entries(page);

  console.log(`\n143 の登録済みエントリ: ${entries143.length}件`);
  if (entries143.length > 0) {
    entries143.sort((a, b) => a.month.localeCompare(b.month));
    entries143.forEach(r => console.log(`  ${r.month} | 引落日: ${r.hikiotoshi} | 入金日: ${r.nyukin}`));
  }

  // 2026/07 が存在するか確認
  const has202607 = entries143.some(r => r.month === '2026-07' || r.month === '2026/07');
  console.log(`\n2026/07 エントリ: ${has202607 ? '✓ 存在する' : '✗ 存在しない'}`);

  if (!has202607 && !DRY_RUN) {
    // 143の一貫したパターン（2023-01〜03）は 引落日=10日、入金日=20日
    const hikiotoshi = '2026-07-10';
    const nyukin     = '2026-07-20';

    console.log(`\n登録予定: 請求月=2026-07 / 引落日=${hikiotoshi} / 入金日=${nyukin}`);
    console.log('（根拠: 143の2023-01〜03パターン: 引落10日, 入金20日）');
    await registerSchedule(page, storage143.value, '2026-07', hikiotoshi, nyukin);

    // 登録後に再確認
    console.log('\n=== 登録後の 143 エントリ確認 ===');
    const after = await scan143Entries(page);
    const found = after.some(r => r.month === '2026-07' || r.month === '2026/07');
    console.log(found ? '✓ 2026/07 の登録を確認しました' : '⚠ 2026/07 がまだ見つかりません。スクリーンショットを確認してください');
  } else if (DRY_RUN) {
    console.log('\n[DRY RUN] 登録はスキップします');
  } else {
    console.log('\n既に 2026/07 が登録済みです。作業不要です。');
  }

  await page.screenshot({ path: 'scripts/html/schedule_final.png' });
  await browser.close();
  console.log('\n=== 完了 ===');
}

main().catch(err => { console.error('致命的エラー:', err); process.exit(1); });
