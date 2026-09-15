#!/usr/bin/env node
/**
 * tframe 登録画面の HTML を Playwright で取得して input/ に保存するスクリプト。
 * 使い方: node scripts/html/fetch_tframe_forms.js <profile>
 *   例: node scripts/html/fetch_tframe_forms.js tframe.culture_beta
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const dotenv = require('dotenv');

// ── 環境変数ロード ────────────────────────────────────────────
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const profile   = process.argv[2] || 'tframe.culture_beta';

dotenv.config({ path: path.join(REPO_ROOT, '.env') });
dotenv.config({ path: path.join(REPO_ROOT, 'env', `.env.${profile}`), override: true });

const BASE_URL  = process.env.BASE_URL;
const USER      = process.env.ADMIN_USER;
const PASSWORD  = process.env.ADMIN_PASSWORD;

if (!BASE_URL || !USER || !PASSWORD) {
  console.error('BASE_URL / ADMIN_USER / ADMIN_PASSWORD が設定されていません。');
  process.exit(1);
}

const INPUT_DIR = path.join(__dirname, 'input');
fs.mkdirSync(INPUT_DIR, { recursive: true });

// ── 取得対象 ──────────────────────────────────────────────────
// directUrl を指定するとリンク検索をスキップして直接アクセスする
const TARGETS = [
  // ── 登録画面（EW）──
  { name: 'shohin_touroku',    hint: '商品登録' },
  { name: 'chosekin_touroku',  hint: '調整金登録' },
  { name: 'course_touroku',    hint: 'コース登録',   directUrl: `${BASE_URL}index.php?r=course%2Few%2F_default` },
  { name: 'jukusei_touroku',   hint: '受講生登録',   directUrl: `${BASE_URL}index.php?r=student%2Few%2F_default` },
  { name: 'kyoshitsu_touroku', hint: '教室登録',     directUrl: `${BASE_URL}index.php?r=classroom%2Few%2F_default` },
  { name: 'ryokin_master_touroku', hint: '料金マスタ作成', directUrl: `${BASE_URL}index.php?r=smsFeeMaster%2Few%2F_default` },
  { name: 'branch_touroku',    hint: '校舎登録',     directUrl: `${BASE_URL}index.php?r=branch%2Few%2F_default` },

  // ── 一覧画面（SW）──
  { name: 'teacher_list',      hint: '講師一覧',     directUrl: `${BASE_URL}index.php?r=teacher%2Fsw%2F_default` },
  { name: 'shohin_list',       hint: '商品一覧',     directUrl: `${BASE_URL}index.php?r=product%2Fsw%2F_default` },
  { name: 'chosekin_list',     hint: '調整金一覧',   directUrl: `${BASE_URL}index.php?r=shareiDetail%2Fsw%2F_default` },
  { name: 'account_list',      hint: 'アカウント一覧', directUrl: `${BASE_URL}index.php?r=account%2Fsw%2F_default` },
  { name: 'staff_list',        hint: 'スタッフ一覧', directUrl: `${BASE_URL}index.php?r=staff%2Fsw%2F_default` },
  { name: 'kyoshitsu_list',    hint: '教室一覧',     directUrl: `${BASE_URL}index.php?r=classroom%2Fsw%2F_default` },
  { name: 'branch_list',       hint: '校舎一覧',     directUrl: `${BASE_URL}index.php?r=branch%2Fsw%2F_default` },
  { name: 'ryokin_master_list',  hint: '料金マスタ一覧',   directUrl: `${BASE_URL}index.php?r=smsFeeMaster%2Fsw%2F_default` },
  { name: 'ryokin_package_list', hint: '料金パッケージ一覧', directUrl: `${BASE_URL}index.php?r=smsFeeMasterPackage%2Fsw%2F_default` },

  // ── 複合一覧（SW）──
  { name: 'stByCourse_list',  hint: 'コース別受講生一覧',  directUrl: `${BASE_URL}index.php?r=student%2Fsw%2FstByCourse` },
  { name: 'courseBySt_list',  hint: '受講生別コース一覧',  directUrl: `${BASE_URL}index.php?r=student%2Fsw%2FcourseBySt` },
  { name: 'teByStudent_list', hint: '講師別受講生一覧',    directUrl: `${BASE_URL}index.php?r=teacher%2Fsw%2FteByStudent` },
  { name: 'proByCourse_list', hint: 'コース別商品一覧',    directUrl: `${BASE_URL}index.php?r=course%2Fsw%2FproByCourse` },

  // ── 帳票出力（SW）── Issue #217
  { name: 'attendanceBulkOutput_list',   hint: '出席表一括出力',     directUrl: `${BASE_URL}index.php?r=attendance%2Fsw%2FattendanceBulkOutput` },
  { name: 'teacherRewardStatement_list', hint: '講師謝礼明細（個人）', directUrl: `${BASE_URL}index.php?r=shareiDetail%2Fsw%2FteacherRewardStatement` },
  { name: 'companyRewardStatement_list', hint: '講師謝礼明細（法人）', directUrl: `${BASE_URL}index.php?r=shareiDetail%2Fsw%2FcompanyRewardStatement` },
  { name: 'monthRewardStatement_list',   hint: '当月謝礼明細（個人）', directUrl: `${BASE_URL}index.php?r=shareiDetail%2Fsw%2FmonthRewardStatement` },
  { name: 'companyMonthRewardStatement_list', hint: '当月謝礼明細（法人）', directUrl: `${BASE_URL}index.php?r=shareiDetail%2Fsw%2FcompanyMonthRewardStatement` },
  { name: 'paymentStatement_list',       hint: '支払調書',           directUrl: `${BASE_URL}index.php?r=shareiTotal%2Fsw%2FpaymentStatement` },

  // ── 登録・編集フォーム（EW）── Issue #215
  { name: 'prospectList_touroku',        hint: '名簿リスト編集',               directUrl: `${BASE_URL}index.php?r=prospectList%2Few%2F_default` },
  { name: 'announcement_touroku',        hint: 'お知らせ編集',                 directUrl: `${BASE_URL}index.php?r=announcement%2Few%2F_default` },
  { name: 'emailTemplateCategory_touroku', hint: 'Eメールテンプレートカテゴリ編集', directUrl: `${BASE_URL}index.php?r=emailTemplateCategory%2Few%2F_default` },
  { name: 'emailTemplate_touroku',       hint: 'Eメールテンプレート編集',       directUrl: `${BASE_URL}index.php?r=emailTemplate%2Few%2F_default` },
  { name: 'entranceLog_touroku',         hint: '入退記録編集',                 directUrl: `${BASE_URL}index.php?r=entranceLog%2Few%2F_default` },

  // ── 講師謝礼合計・入退記録・連絡（SW）── Issue #214
  { name: 'shareiTotal_list',   hint: '講師謝礼合計一覧', directUrl: `${BASE_URL}index.php?r=shareiTotal%2Fsw%2F_default` },
  { name: 'entranceLog_list',   hint: '入退記録一覧',     directUrl: `${BASE_URL}index.php?r=entranceLog%2Fsw%2F_default` },
  { name: 'contact_list',       hint: '連絡一覧',         directUrl: `${BASE_URL}index.php?r=contact%2Fsw%2F_default` },

  // ── 出席表・口座振替（SW）── Issue #213
  { name: 'attendance_list',        hint: '本日の出席表一覧',   directUrl: `${BASE_URL}index.php?r=attendance%2Fsw%2F_default` },
  { name: 'bankActionsHistory_list', hint: '口座振替データ履歴', directUrl: `${BASE_URL}index.php?r=bankActionsHistory%2Fsw%2F_default` },

  // ── レポート（SW）── Issue #212
  { name: 'report_inquiryEnrollCancel_list', hint: '問合せ・入学・退学レポート', directUrl: `${BASE_URL}index.php?r=report%2Fsw%2FinquiryEnrollCancelReport` },
  { name: 'report_stDataCombined_list',      hint: '受講生データ組合せレポート', directUrl: `${BASE_URL}index.php?r=report%2Fsw%2FstDataCombinedReport` },
  { name: 'report_stSchedule_list',          hint: '受講生スケジュールレポート', directUrl: `${BASE_URL}index.php?r=report%2Fsw%2FstScheduleReport` },
  { name: 'report_teSchedule_list',          hint: '講師スケジュールレポート',   directUrl: `${BASE_URL}index.php?r=report%2Fsw%2FteScheduleReport` },

  // ── 対応履歴（SW）──
  { name: 'infoHistory_student_list',  hint: '対応履歴一覧（受講生）', directUrl: `${BASE_URL}index.php?r=infoHistory%2Fsw%2F_default&menuModule=student` },
  { name: 'infoHistoryTemplate_student_list', hint: '対応履歴テンプレート一覧（受講生）', directUrl: `${BASE_URL}index.php?r=infoHistoryTemplate%2Fsw%2F_default&menuModule=student` },
  { name: 'infoHistoryTemplate_touroku', hint: '対応履歴テンプレート登録（受講生）', directUrl: `${BASE_URL}index.php?r=infoHistoryTemplate%2Few%2F_default&menuModule=student` },

  // ── 一括処理・計算系（SW/EW）── Issue #219
  { name: 'tuitionFeeBulkCreate_touroku', hint: '翌月月謝一括作成', directUrl: `${BASE_URL}index.php?r=smsFee%2Few%2FtuitionFeeBulkCreate` },
  { name: 'batchPayment_list',            hint: '一括入金処理',     directUrl: `${BASE_URL}index.php?r=smsPayment%2Fsw%2FbatchPayment` },
  { name: 'bankTransferExport_touroku',   hint: '口座振替請求データ作成', directUrl: `${BASE_URL}index.php?r=bankTransfer%2Few%2FbankTransferExport` },
  { name: 'teRewardCalc_list',            hint: '講師謝礼計算',     directUrl: `${BASE_URL}index.php?r=shareiDetail%2Fsw%2FteRewardCalc` },
  { name: 'teRewardTotalCalc_list',       hint: '講師謝礼合計計算', directUrl: `${BASE_URL}index.php?r=shareiTotal%2Fsw%2FteRewardTotalCalc` },
];

// ── ヘルパー ─────────────────────────────────────────────────
async function login(page) {
  await page.goto(BASE_URL);
  await page.waitForSelector('input[id="loginmodel-username"]', { timeout: 10000 });
  await page.fill('input[id="loginmodel-username"]', USER);
  await page.fill('input[id="loginmodel-password"]', PASSWORD);
  await page.click('button[type="submit"]');
  // ログアウトリンクが現れるまで待つ（ログイン完了の確認）
  await page.waitForSelector('a[href*="logout"], a:has-text("ログアウト"), a:has-text("Logout")', { timeout: 15000 });
  console.log('✓ ログイン完了:', page.url());
}

async function expandSideMenu(page) {
  // 経理タブをクリックしてメニューを展開（ナビゲーションは発生しないはず）
  const keiriTabs = await page.$$('text=経理');
  for (const el of keiriTabs) {
    try {
      const tagName = await el.evaluate(e => e.tagName.toLowerCase());
      // リンクでなければクリック（accordion toggle など）
      if (tagName !== 'a') await el.click({ timeout: 1000 });
    } catch (_) {}
  }
  await page.waitForTimeout(800);
}

async function dumpAllLinks(page) {
  return page.$$eval('a[href]', els =>
    els.map(a => ({ text: a.innerText.trim().replace(/\s+/g, ' '), href: a.href }))
      .filter(l => l.text && l.href && !l.href.startsWith('javascript'))
  );
}

async function getFormHtml(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);

  const html = await page.$eval('#rootWidget', el => el.outerHTML)
    .catch(async () => {
      console.warn('  #rootWidget が見つからないため body を取得します');
      return page.$eval('body', el => el.innerHTML);
    });
  return html;
}

// ── メイン ────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();

  try {
    await login(page);

    // スクリーンショット保存
    await page.screenshot({ path: path.join(INPUT_DIR, 'after_login.png'), fullPage: false });
    console.log('  スクリーンショット保存: scripts/html/input/after_login.png');

    // 経理セクションへ移動してサイドメニューを展開
    const keiriLink = `${BASE_URL}index.php?r=smsFee%2Fsw%2F_default&isTopMenu=1`;
    console.log('  経理ページへ移動:', keiriLink);
    await page.goto(keiriLink, { waitUntil: 'networkidle', timeout: 20000 });
    await expandSideMenu(page);

    // スクリーンショット（経理ページ）
    await page.screenshot({ path: path.join(INPUT_DIR, 'keiri_page.png'), fullPage: true });
    console.log('  スクリーンショット保存: scripts/html/input/keiri_page.png');

    const links = await dumpAllLinks(page);

    // 全リンクをファイルに保存（デバッグ用）
    const linksFile = path.join(INPUT_DIR, 'all_links.json');
    fs.writeFileSync(linksFile, JSON.stringify(links, null, 2), 'utf8');
    console.log(`\n全リンク数: ${links.length} 件 → ${linksFile}`);

    // 経理タブ関連リンクを表示
    const keiriLinks = links.filter(l =>
      l.text.includes('経理') || l.text.includes('商品') || l.text.includes('調整') ||
      l.href.includes('smsItem') || l.href.includes('smsAdjust') || l.href.includes('smsMisc') ||
      l.href.includes('Fee') || l.href.includes('fee') || l.href.includes('Payment')
    );
    console.log('\n【経理関連リンク候補】');
    keiriLinks.forEach(l => console.log(`  "${l.text}" → ${l.href}`));

    // ターゲットページのHTML取得
    for (const target of TARGETS) {
      console.log(`\n▶ ${target.hint} を検索中...`);
      let targetUrl = target.directUrl;
      if (!targetUrl) {
        const found = links.find(l =>
          l.text === target.hint || l.text.includes(target.hint)
        );
        if (!found) {
          console.warn(`  ⚠ "${target.hint}" のリンクが見つかりません。`);
          continue;
        }
        targetUrl = found.href;
      }
      console.log(`  URL: ${targetUrl}`);
      const html = await getFormHtml(page, targetUrl);
      const outFile = path.join(INPUT_DIR, `${target.name}.html`);
      fs.writeFileSync(outFile, html, 'utf8');
      console.log(`  ✓ 保存: ${outFile} (${Math.round(html.length / 1024)} KB)`);
    }

  } catch (err) {
    console.error('\nERROR:', err.message);
    await page.screenshot({ path: path.join(INPUT_DIR, 'error_screenshot.png') });
  } finally {
    await browser.close();
  }
})();
