#!/usr/bin/env node
/**
 * shimamura 画面の HTML を Playwright で取得して shimamura/ に保存するスクリプト。
 * 使い方: node scripts/html/fetch_shimamura_screens.js <profile>
 *   例: node scripts/html/fetch_shimamura_screens.js shimamura.testgcp
 *
 * 新しい画面を追加する場合は TARGETS 配列に追記してから再実行する。
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const dotenv = require('dotenv');

// ── 環境変数ロード ────────────────────────────────────────────
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const profile   = process.argv[2] || 'shimamura.testgcp';

dotenv.config({ path: path.join(REPO_ROOT, '.env') });
dotenv.config({ path: path.join(REPO_ROOT, 'env', `.env.${profile}`), override: true });

const BASE_URL  = (process.env.BASE_URL || '').replace(/\/?$/, '/');
const USER      = process.env.SHIMAMURA_USER;
const PASSWORD  = process.env.SHIMAMURA_PASSWORD;
const TANTOUSYA = process.env.SHIMAMURA_TANTOUSYA;

if (!BASE_URL || !USER || !PASSWORD || !TANTOUSYA) {
  console.error('以下の環境変数が未設定です:');
  if (!BASE_URL)  console.error('  BASE_URL');
  if (!USER)      console.error('  SHIMAMURA_USER');
  if (!PASSWORD)  console.error('  SHIMAMURA_PASSWORD');
  if (!TANTOUSYA) console.error('  SHIMAMURA_TANTOUSYA');
  process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, 'shimamura');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── 取得対象 ──────────────────────────────────────────────────
// URL は main_menu_links.json（2026-05-11 取得）で確認済みの index.php?module=X&action=Y 形式
const TARGETS = [
  // ── 受講生系 ──
  { name: 'student_search',
    hint: '受講生検索（一覧）',
    directUrl: `${BASE_URL}index.php?module=Student&action=index&top_menu=1` },
  { name: 'course_by_student',
    hint: 'コース別受講生一覧',
    directUrl: `${BASE_URL}index.php?module=Student&action=index&contact_status=0&course_list=true&initial_state&top_menu=1` },
  { name: 'contact_list',
    hint: '問合せ一覧（候補生）',
    directUrl: `${BASE_URL}index.php?module=Student&action=index&contact_status=5&top_menu=1` },
  { name: 'contact_register',
    hint: '問合せ登録（候補生登録）',
    directUrl: `${BASE_URL}index.php?module=Student&action=EditView&contact_status=5&return_module=Student&return_action=DetailView&from_mainmenu=true` },

  // ── クラス・コース系 ──
  { name: 'class_list',
    hint: 'クラス一覧',
    directUrl: `${BASE_URL}index.php?module=Course&action=ListView&course_list=true&query=true&initial_state` },
  { name: 'shimacourse_register',
    hint: 'コース登録（管理）',
    directUrl: `${BASE_URL}index.php?module=ShimaCourse&action=EditView&return_module=ShimaCourse&return_action=DetailView` },
  { name: 'course_register',
    hint: 'クラス登録',
    directUrl: `${BASE_URL}index.php?module=Course&action=EditView&return_module=Course&return_action=DetailView` },

  // ── 経理系 ──
  { name: 'keiri_invoices',
    hint: '受注・売上（経理）',
    directUrl: `${BASE_URL}index.php?module=Keiri&action=index&keiri_report_type=Invoices&top_menu=1` },
  { name: 'transaction_list',
    hint: '入出金一覧',
    directUrl: `${BASE_URL}index.php?module=Transaction&action=index&top_menu=1` },

  // ── 経理・謝礼系 ──
  { name: 'sharei_ichiran',
    hint: '講師謝礼一覧',
    directUrl: `${BASE_URL}index.php?module=ShareiNichibetsu&action=LWShareiIchiran_AN&top_menu=1` },
  { name: 'kousha_sharei_add',
    hint: '講師謝礼追加',
    directUrl: `${BASE_URL}index.php?module=ShareiNichibetsu&action=EW_KoushiShareiTsuika_AN` },
  { name: 'ryokin_package_create',
    hint: '料金パッケージ作成',
    directUrl: `${BASE_URL}index.php?module=SalesGroup&action=EditView` },

  // ── 管理系 ──
  { name: 'admin_top',
    hint: '管理トップ',
    directUrl: `${BASE_URL}index.php?module=Administration&action=index` },

  // ── 講師・その他一覧系 ──
  { name: 'teacher_list',
    hint: '講師一覧',
    directUrl: `${BASE_URL}index.php?module=Teacher&action=index&top_menu=1` },
  { name: 'mishukin_list',
    hint: '未収金一覧',
    directUrl: `${BASE_URL}index.php?module=Transaction&action=LWMishukin_AN&query=true` },
  { name: 'attendance_today',
    hint: '本日の出席表一覧',
    directUrl: `${BASE_URL}index.php?module=Course&action=AttendanceViewDetailed&initial_state=menu` },
  { name: 'course_ichiran',
    hint: 'コース一覧（管理）',
    directUrl: `${BASE_URL}index.php?module=ShimaCourse&action=LW_AN&top_menu=1` },
  { name: 'contact_module_list',
    hint: 'コンタクト一覧',
    directUrl: `${BASE_URL}index.php?module=Contacts&action=index&top_menu=1` },

  // ── 債権買取系 ──
  { name: 'credit_purchase_list',
    hint: '債権買取顧客情報一覧',
    directUrl: `${BASE_URL}index.php?module=Student&action=LW_CreditPurchaseCustomerInfo_AN&empty_form=1` },
  { name: 'credit_purchase_edit',
    hint: '債権買取顧客情報編集（TK26012870154）',
    directUrl: `${BASE_URL}index.php?module=Student&action=EW_CreditPurchaseCustomerInfo_AN&record=ec75d9e6-fc06-11f0-b915-42010a28a120` },
  { name: 'student_detail_keiri',
    hint: '受講生詳細_経理カルテビュー（TK26012870154）',
    directUrl: `${BASE_URL}index.php?module=Student&action=DWCarteKeiri_AN&record=ec75d9e6-fc06-11f0-b915-42010a28a120` },
  { name: 'student_detail_view',
    hint: '受講生詳細_DetailView（TK26012870154）',
    directUrl: `${BASE_URL}index.php?detailview=1&module=Student&action=DetailView&return_module=Student&return_action=DetailView&record=ec75d9e6-fc06-11f0-b915-42010a28a120` },

  { name: 'smbc_state_import',
    hint: '債権買取状態読込',
    directUrl: `${BASE_URL}index.php?module=SmbcStateSummary&action=EWSMBCPurchaseStatusImport_AN` },

  // 以下は URL が未確認（コメントアウト）──
  // { name: 'kouhousei_detail', hint: '候補生詳細',   directUrl: `${BASE_URL}index.php?module=Student&action=DetailView&record=<id>` },
  // { name: 'student_detail',   hint: '受講生詳細',   directUrl: `${BASE_URL}index.php?module=Student&action=DetailView&record=<id>` },
  // { name: 'taikai',           hint: '退会処理',     directUrl: 'ナビゲーション経由のため要調査' },
  // { name: 'keiri_a',          hint: '経理ビューA',  directUrl: 'ナビゲーション経由のため要調査' },
];

// ── ログイン（2 ステップ）───────────────────────────────────────
async function login(page) {
  await page.goto(BASE_URL);
  await page.waitForSelector('input[name="user_name"]', { timeout: 10000 });
  await page.fill('input[name="user_name"]', USER);
  await page.fill('input[name="user_password"]', PASSWORD);
  await page.click('text=ログイン');

  // 担当者番号入力画面（idnumber フィールドが現れた場合のみ）
  try {
    await page.waitForSelector('input[name="idnumber"]', { timeout: 5000 });
    await page.fill('input[name="idnumber"]', String(TANTOUSYA));
    await page.click('text=メインメニュー');
  } catch (_) {
    // 担当者番号画面が出ない環境ではスキップ
  }

  // メインメニューの「管理」リンクを確認してログイン完了とみなす
  await page.waitForSelector('a.myAreaLink:has-text("管理")', { timeout: 15000 });
  console.log('✓ ログイン完了:', page.url());
}

// ── HTML 取得 ──────────────────────────────────────────────────
async function getScreenHtml(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);

  // shimamura のメインコンテンツコンテナ候補を順に試みる
  // #body_only_td = メインコンテンツ <td>（Phase 1 実機確認で判明）
  const html = await page.$eval('#body_only_td', el => el.outerHTML)
    .catch(() => page.$eval('#content', el => el.outerHTML))
    .catch(() => page.$eval('#main', el => el.outerHTML))
    .catch(async () => {
      console.warn('  既知のコンテナが見つからないため body を取得します');
      return page.$eval('body', el => el.innerHTML);
    });
  return html;
}

// ── リンク一覧取得（URL 調査用）────────────────────────────────
async function dumpAllLinks(page) {
  return page.$$eval('a[href]', els =>
    els.map(a => ({ text: a.innerText.trim().replace(/\s+/g, ' '), href: a.href }))
      .filter(l => l.text && l.href && !l.href.startsWith('javascript'))
  );
}

// ── メイン ────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();

  try {
    await login(page);

    // ログイン直後のスクリーンショット＋全リンク保存（URL 調査用）
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'after_login.png'), fullPage: false });
    console.log('  スクリーンショット保存: scripts/html/shimamura/after_login.png');

    const linksAfterLogin = await dumpAllLinks(page);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'main_menu_links.json'),
      JSON.stringify(linksAfterLogin, null, 2),
      'utf8'
    );
    console.log(`  メインメニューのリンク: ${linksAfterLogin.length} 件 → scripts/html/shimamura/main_menu_links.json`);

    // ターゲット画面の HTML 取得
    for (const target of TARGETS) {
      console.log(`\n▶ ${target.hint} を取得中...`);
      console.log(`  URL: ${target.directUrl}`);
      try {
        const html = await getScreenHtml(page, target.directUrl);
        const outFile = path.join(OUTPUT_DIR, `${target.name}.html`);
        fs.writeFileSync(outFile, html, 'utf8');
        console.log(`  ✓ 保存: scripts/html/shimamura/${target.name}.html (${Math.round(html.length / 1024)} KB)`);

        // 各画面のリンクも保存（URL 調査の補助）
        const links = await dumpAllLinks(page);
        fs.writeFileSync(
          path.join(OUTPUT_DIR, `${target.name}_links.json`),
          JSON.stringify(links, null, 2),
          'utf8'
        );
        console.log(`  リンク: ${links.length} 件 → scripts/html/shimamura/${target.name}_links.json`);

      } catch (err) {
        console.warn(`  ⚠ ${target.hint} の取得に失敗: ${err.message}`);
        await page.screenshot({ path: path.join(OUTPUT_DIR, `error_${target.name}.png`) });
      }
    }

  } catch (err) {
    console.error('\nERROR:', err.message);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'error_screenshot.png') });
  } finally {
    await browser.close();
  }
})();
