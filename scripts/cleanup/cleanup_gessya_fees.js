'use strict';
/**
 * @fileoverview shimamura testgcp 月謝テスト受講生の料金・入出金クリーンアップ
 *
 * 月謝一括作成テスト（gessya_ikkatu_test.js）実行後に作成された
 * テスト料金・入出金レコードを画面操作で一括削除する。
 *
 * 対象: last_name が SEARCH_NAME_PATTERN に一致する受講生の
 *       経理ビューB内「料金」「入出金」の全削除リンク
 *
 * 使い方:
 *   node scripts/cleanup/cleanup_gessya_fees.js
 *   node scripts/cleanup/cleanup_gessya_fees.js 月謝テスト0630   # 名前を絞り込み
 *
 * 注意:
 *   - 入金済みレコードは削除できない（削除ボタンが表示されない）
 *   - クラス・コース登録は削除しない（料金・入出金のみ対象）
 */

const { chromium } = require('playwright');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../env/.env.shimamura.testgcp'), override: true });

const BASE_URL       = (process.env.BASE_URL || '').replace(/\/?$/, '/');
const USER           = process.env.SHIMAMURA_USER;
const PASS           = process.env.SHIMAMURA_PASSWORD;
const TANTOUSYA      = process.env.SHIMAMURA_TANTOUSYA || '00033';
const SEARCH_PATTERN = process.argv[2] || '月謝テスト';

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

// ---- 受講生を検索して詳細ページURL一覧を返す --------------------------------
async function searchStudents(page) {
  const searchUrl = BASE_URL
    + `index.php?module=Student&action=index&searchFormTab=basic_search`
    + `&query=true&search_form=true&last_name=${encodeURIComponent(SEARCH_PATTERN)}`;
  await page.goto(searchUrl);
  await page.waitForLoadState('networkidle');

  // 検索フォームがある場合は自力入力して実行
  const lastNameField = page.locator('input[name="last_name"]');
  if (await lastNameField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await lastNameField.fill(SEARCH_PATTERN);
    await page.locator('input[value="検索"], button:has-text("検索")').first().click();
    await page.waitForLoadState('networkidle');
  }

  // 結果一覧の詳細リンクを取得（mailto: などの無効リンクを除外）
  const links = await page.locator('a.listViewTdLinkS1').evaluateAll(
    els => els
      .map(a => ({ text: a.textContent.trim(), href: a.href }))
      .filter(l => l.href.startsWith('http') && l.text)
  );
  console.log(`\n受講生検索結果（"${SEARCH_PATTERN}"）: ${links.length}件`);
  links.forEach((l, i) => console.log(`  [${i + 1}] ${l.text} → ${l.href}`));
  return links;
}

// ---- 経理ビューB へ遷移 -----------------------------------------------------
async function openKeiriView(page, studentHref) {
  await page.goto(studentHref);
  await page.waitForLoadState('networkidle');

  await page.waitForTimeout(800);
  const submenu = page.locator('#submenu__detailviews_sub');
  const display = await submenu.evaluate(el => getComputedStyle(el).display).catch(() => 'none');
  if (display === 'none') {
    await page.locator('span', { hasText: '閲覧/登録・経理ビュー' }).first().click();
    await page.waitForTimeout(600);
  }
  await page.locator('#submenu__detailviews_sub a')
    .filter({ hasText: '受講生登録・経理ビュー' }).first().click();
  await page.waitForLoadState('networkidle');
}

// ---- 料金・入出金の削除リンクをすべてクリック --------------------------------
async function deleteAllFees(page, studentName) {

  let round = 0;
  let totalDeleted = 0;

  while (true) {
    round++;
    const links = page.locator('a').filter({ hasText: '削除' });
    const count = await links.count();
    if (count === 0) break;

    console.log(`    [round ${round}] 削除リンク: ${count}件`);
    await links.first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);
    totalDeleted++;

    if (round > 50) {
      console.warn('    ⚠ 上限ラウンド到達。ループを終了します。');
      break;
    }
  }

  console.log(`    → ${studentName}: ${totalDeleted}件削除`);
  return totalDeleted;
}

// ---- メイン -----------------------------------------------------------------
async function main() {
  console.log(`=== 月謝テスト料金クリーンアップ ===`);
  console.log(`対象パターン: "${SEARCH_PATTERN}"`);
  console.log(`環境: ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({ locale: 'ja-JP' });
  const page    = await ctx.newPage();

  // ダイアログ（confirm）を自動承認（1回だけ登録）
  page.on('dialog', async dialog => dialog.accept());

  await login(page);
  console.log('ログイン完了');

  const students = await searchStudents(page);
  if (students.length === 0) {
    console.log('対象受講生が見つかりませんでした。終了します。');
    await browser.close();
    return;
  }

  let grandTotal = 0;
  for (const student of students) {
    console.log(`\n  処理中: ${student.text}`);
    try {
      await openKeiriView(page, student.href);
      const deleted = await deleteAllFees(page, student.text);
      grandTotal += deleted;
    } catch (err) {
      console.error(`  ✗ エラー [${student.text}]: ${err.message}`);
    }
  }

  console.log(`\n=== 完了: 合計 ${grandTotal}件削除 ===`);
  await browser.close();
}

main().catch(err => { console.error('致命的エラー:', err); process.exit(1); });
