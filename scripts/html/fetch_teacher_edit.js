#!/usr/bin/env node
/**
 * 講師編集画面（各タブ）の HTML を取得するスクリプト。
 * 使い方: node scripts/html/fetch_teacher_edit.js <profile>
 *   例: node scripts/html/fetch_teacher_edit.js shimamura.testgcp
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const dotenv = require('dotenv');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const profile   = process.argv[2] || 'shimamura.testgcp';

dotenv.config({ path: path.join(REPO_ROOT, '.env') });
dotenv.config({ path: path.join(REPO_ROOT, 'env', `.env.${profile}`), override: true });

const BASE_URL  = (process.env.BASE_URL || '').replace(/\/?$/, '/');
const USER      = process.env.SHIMAMURA_USER;
const PASSWORD  = process.env.SHIMAMURA_PASSWORD;
const TANTOUSYA = process.env.SHIMAMURA_TANTOUSYA;

if (!BASE_URL || !USER || !PASSWORD || !TANTOUSYA) {
  console.error('環境変数が未設定です（BASE_URL / SHIMAMURA_USER / SHIMAMURA_PASSWORD / SHIMAMURA_TANTOUSYA）');
  process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, 'shimamura');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function login(page) {
  await page.goto(BASE_URL);
  await page.waitForSelector('input[name="user_name"]', { timeout: 10000 });
  await page.fill('input[name="user_name"]', USER);
  await page.fill('input[name="user_password"]', PASSWORD);
  await page.click('text=ログイン');
  try {
    await page.waitForSelector('input[name="idnumber"]', { timeout: 5000 });
    await page.fill('input[name="idnumber"]', String(TANTOUSYA));
    await page.click('text=メインメニュー');
  } catch (_) {}
  await page.waitForSelector('a.myAreaLink:has-text("管理")', { timeout: 15000 });
  console.log('✓ ログイン完了');
}

async function getContentHtml(page) {
  return page.$eval('#body_only_td', el => el.outerHTML)
    .catch(() => page.$eval('body', el => el.innerHTML));
}

async function saveHtml(html, name) {
  const outFile = path.join(OUTPUT_DIR, `${name}.html`);
  fs.writeFileSync(outFile, html, 'utf8');
  console.log(`  ✓ 保存: scripts/html/shimamura/${name}.html (${Math.round(html.length / 1024)} KB)`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();

  try {
    await login(page);

    // ── Step 1: 講師一覧を検索（AJAX）──────────────────────────────
    console.log('\n▶ 講師一覧を検索中...');
    await page.goto(`${BASE_URL}index.php?module=Teacher&action=LW_AN`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // 稼働講師のみ（デフォルト）で検索ボタンをクリック
    await page.click('input[name="search"]');
    // AJAX 完了を待つ（listViewTdLinkS1 が出現するまで）
    try {
      await page.waitForSelector('a.listViewTdLinkS1', { timeout: 15000 });
    } catch (_) {
      console.warn('  listViewTdLinkS1 が見つかりません。別のリンクセレクタを試みます。');
      await saveHtml(await getContentHtml(page), 'teacher_list_query');
    }

    // 最初の結果リンクを取得
    const firstLink = await page.$('a.listViewTdLinkS1');
    if (!firstLink) {
      console.error('講師一覧に結果がありません。');
      await saveHtml(await getContentHtml(page), 'teacher_list_searched');
      // 別リンクを試す
      const anyLink = await page.$('a[href*="Teacher"][href*="DetailView"], a[href*="Teacher"][href*="record="]');
      if (!anyLink) { console.error('代替リンクも見つかりませんでした。'); return; }
      const anyHref = await anyLink.getAttribute('href');
      console.log('  代替リンク:', anyHref);
    }

    const href = await firstLink.getAttribute('href');
    console.log(`  最初の講師リンク: ${href}`);

    // record ID を抽出
    const recordMatch = href.match(/[?&]record=([^&]+)/);
    if (!recordMatch) {
      console.error('record ID が取得できませんでした');
      return;
    }
    const recordId = recordMatch[1];
    console.log(`  record ID: ${recordId}`);

    // ── Step 2: 講師詳細画面（DetailView）──────────────────────────
    console.log('\n▶ 講師詳細画面を取得中...');
    await page.goto(
      `${BASE_URL}index.php?module=Teacher&action=DetailView&record=${recordId}`,
      { waitUntil: 'networkidle' }
    );
    await page.waitForTimeout(1000);
    await saveHtml(await getContentHtml(page), 'teacher_detail');

    // ── Step 3: 講師編集画面（EditView・基本タブ）──────────────────
    console.log('\n▶ 講師編集画面（基本）を取得中...');
    await page.goto(
      `${BASE_URL}index.php?module=Teacher&action=EditView&record=${recordId}`,
      { waitUntil: 'networkidle' }
    );
    await page.waitForTimeout(1000);
    await saveHtml(await getContentHtml(page), 'teacher_edit_basic');

    // タブ名を列挙
    const tabs = await page.$$eval('a[id*="tab"], li[id*="tab"], .detailViewTabLinkS1, .editViewTabLinkS1, a[class*="tab"]', els =>
      els.map(el => ({ id: el.id, text: el.innerText?.trim(), href: el.href || '' })).filter(t => t.text)
    );
    console.log('  検出タブ:', JSON.stringify(tabs, null, 2));

    // ── Step 4: 経理タブ（DW_AN）の内容を AJAX URL で直接取得 ──────
    console.log('\n▶ 経理タブ（詳細/DW_AN）の内容を取得中...');
    const keiriTabAjaxUrl = `${BASE_URL}index.php?module=Teacher&action=DW_AN&record=${recordId}&tab_name=accounting_tab&body_only_AN=true&content_only_AN=true&is_ajax_AN=`;
    await page.goto(keiriTabAjaxUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const keiriDwHtml = await page.$eval('body', el => el.innerHTML);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'teacher_detail_keiri.html'), keiriDwHtml, 'utf8');
    console.log(`  ✓ 保存: scripts/html/shimamura/teacher_detail_keiri.html (${Math.round(keiriDwHtml.length / 1024)} KB)`);

    // ── Step 4b: 経理タブ編集画面（EW_AccountingTab_AN）──────────────
    console.log('\n▶ 経理タブ編集画面（EW_AccountingTab_AN）を取得中...');
    await page.goto(
      `${BASE_URL}index.php?module=Teacher&action=EW_AccountingTab_AN&record=${recordId}&return_module=Teacher&return_action=DW_AN&return_id=${recordId}`,
      { waitUntil: 'networkidle' }
    );
    await page.waitForTimeout(1000);
    await saveHtml(await getContentHtml(page), 'teacher_edit_accounting');
    const accountingFields = await page.$$eval('input:not([type=hidden]), select, textarea', els =>
      els.map(el => ({
        tag:  el.tagName.toLowerCase(),
        type: el.type || '',
        id:   el.id || '',
        name: el.name || '',
      }))
    );
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'teacher_accounting_fields.json'),
      JSON.stringify(accountingFields, null, 2),
      'utf8'
    );
    console.log(`  フィールド: ${accountingFields.length} 件 → teacher_accounting_fields.json`);

    // ── Step 5: 講師詳細から編集ボタン → EditView へ ──────────────
    console.log('\n▶ 講師編集画面（EW_AN）へ遷移...');
    await page.goto(
      `${BASE_URL}index.php?module=Teacher&action=EW_AN&record=${recordId}&return_module=Teacher&return_action=DW_AN&return_id=${recordId}`,
      { waitUntil: 'networkidle' }
    );
    await page.waitForTimeout(1000);
    await saveHtml(await getContentHtml(page), 'teacher_edit_ewan');
    console.log('  スクリーンショット...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'teacher_edit.png'), fullPage: true });

    // EW_AN のタブを列挙
    const ewTabs = await page.$$eval('[id^="tab_li_"]', els =>
      els.map(el => ({ id: el.id, text: el.innerText?.trim() }))
    );
    console.log('  EW_AN タブ:', JSON.stringify(ewTabs, null, 2));

    // ── Step 6: EditView の経理タブ（EW_AN）────────────────────────
    console.log('\n▶ 経理タブ（編集/EW_AN）を取得...');
    const keiriEwTabLink = await page.$('#tab_link_accounting_tab');
    if (keiriEwTabLink) {
      await keiriEwTabLink.click();
      await page.waitForTimeout(2000);
      console.log('  経理タブをクリック（EW_AN）');
      await saveHtml(await getContentHtml(page), 'teacher_edit_ewan_keiri');
    } else {
      // EW_AN でも AJAX URL を試みる
      const keiriEwAjaxUrl = `${BASE_URL}index.php?module=Teacher&action=EW_AN&record=${recordId}&tab_name=accounting_tab&body_only_AN=true&content_only_AN=true&is_ajax_AN=`;
      await page.goto(keiriEwAjaxUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const keiriEwHtml = await page.$eval('body', el => el.innerHTML);
      fs.writeFileSync(path.join(OUTPUT_DIR, 'teacher_edit_ewan_keiri.html'), keiriEwHtml, 'utf8');
      console.log(`  ✓ 保存(AJAX URL): teacher_edit_ewan_keiri.html (${Math.round(keiriEwHtml.length / 1024)} KB)`);
    }

    // 全フィールドを抽出
    const fields = await page.$$eval('input, select, textarea', els =>
      els.map(el => ({
        tag:  el.tagName.toLowerCase(),
        type: el.type || '',
        id:   el.id || '',
        name: el.name || '',
        label: document.querySelector(`label[for="${el.id}"]`)?.innerText?.trim() || '',
      })).filter(f => (f.id || f.name) && f.type !== 'hidden')
    );
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'teacher_edit_keiri_fields.json'),
      JSON.stringify(fields, null, 2),
      'utf8'
    );
    console.log(`  フィールド: ${fields.length} 件 → scripts/html/shimamura/teacher_edit_keiri_fields.json`);

  } catch (err) {
    console.error('\nERROR:', err.message);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'teacher_edit_error.png') });
  } finally {
    await browser.close();
  }
})();
