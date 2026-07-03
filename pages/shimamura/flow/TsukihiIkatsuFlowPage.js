'use strict';

const fs   = require('fs');
const path = require('path');

const { logScreenUrl } = require('../../../support/utils');
const { toggleGroupmenu, assertNoShimamuraError, fillTextFieldsByName } = require('../../../support/shimamura/utils');
const { TIMEOUTS } = require('../../../support/shimamura/constants');

const BASE_URL = (process.env.BASE_URL || '').replace(/\/?$/, '/');

// setupテストと月謝テスト間で受講生 record UUID を受け渡すファイル
const SESSION_FILE = path.resolve(__dirname, '../../../output/tsukihi_ikatsu_session.json');

const RESULT_LINK = 'a.listViewTdLinkS1';

const S = {
  kouhoseiEdit: {
    lastName:        '#last_name',
    firstName:       '#first_name',
    description:     'textarea[name="description"]',
    bankPaymentType: '#bank_payment_type',
    shimaStorageId:  '#shima_storage_id',
    discount:        '#discount',
    saveButton:      'input[name="save_button"]',
    editButton:      'input[name="edit_button"]',
  },
};

function resolveRelativeMonth(taikaiYear, taikaiMonth) {
  const OFFSETS = { '先月': -1, '今月': 0, '来月': 1 };
  const key = String(taikaiMonth).trim();
  if (key in OFFSETS) {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + OFFSETS[key], 1);
    return { year: String(d.getFullYear()), month: String(d.getMonth() + 1).padStart(2, '0') };
  }
  return { year: String(taikaiYear).trim(), month: String(taikaiMonth).trim().padStart(2, '0') };
}

function buildTestName(row) {
  const now  = new Date();
  const mmdd = String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
  const hhmm = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  return {
    lastName:    `月謝テスト${mmdd}`,
    firstName:   `${row.testNo}${row.scenario.replace(/_/g, '')}`,
    description: `テスト実行 ${mmdd}_${hhmm} | ${row.scenario}`,
  };
}

function buildDuplicateCheckSQL(lastName) {
  return `
SELECT
  k.id          AS kouho_id,
  k.idnumber    AS kouho_idnumber,
  k.last_name   AS 姓_候補生,
  c.id          AS contact_id,
  c.last_name   AS 姓_contacts,
  c.first_name  AS 名_contacts,
  c.deleted     AS contacts_deleted
FROM contacts_kouho k
INNER JOIN contacts c ON c.idnumber = k.idnumber
WHERE k.deleted = 0
  AND k.last_name = '${lastName}'
ORDER BY k.idnumber;`;
}

function saveToSession(SESSION_FILE, recordId, testName, row) {
  const withdrawn = !!(row.taikaiMonth && String(row.taikaiMonth).trim());
  let session = [];
  try { session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')); } catch {}
  session.push({
    recordId,
    lastName: testName.lastName,
    firstName: testName.firstName,
    scenario: row.scenario,
    withdrawn,
    expectedKanrihi:      row.expectedKanrihi || null,
    expectedWinnerClass:  row.expectedWinnerClass || null,
  });
  fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });
  fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
  return withdrawn;
}

// 候補生一覧へ移動し姓で検索、「受講生へ移動」で昇格する。
// 会員番号重複エラーが出た候補生はスキップして次を試みる。
async function navigateToKouhosei(I, classMemberPageShimamura, lastName) {
  I.say('【候補生一覧】サイドバー → 候補生グループ → 候補生検索');
  await classMemberPageShimamura.navigateToAdminTab(I, '受講生', '受講生登録');
  await toggleGroupmenu(I, { icon_id: 'submenu__candidates_grp_sub', menuname: '候補生' });
  await classMemberPageShimamura.clickSubMenuLink('候補生検索', '候補生検索');
  await logScreenUrl(I, '候補生検索ページ');

  I.say(`【候補生一覧】姓 "${lastName}" で検索`);
  I.waitForElement(locate('body').withText('候補生一覧'), TIMEOUTS.SCREEN);
  fillTextFieldsByName(I, { last_name: lastName });
  I.click('検索');
  I.waitForElement(RESULT_LINK, TIMEOUTS.RESULT);
  await logScreenUrl(I, '候補生一覧');

  // 全候補生リンクを取得し、会員番号重複エラーが出た場合は次の候補生を試みる
  const hrefs = await I.grabAttributeFrom(RESULT_LINK, 'href');
  const links = (Array.isArray(hrefs) ? hrefs : [hrefs]).filter(h => h?.startsWith('http'));
  I.say(`  候補生 ${links.length}件`);

  const DUPLICATE_CHECK_SQL = buildDuplicateCheckSQL(lastName);

  for (const href of links) {
    // クリック〜URL確認をすべて usePlaywrightTo 内で完結させタイミング問題を回避
    let promotionResult = 'pending'; // 'success' | 'duplicate' | 'timeout'
    let duplicateErrorText = '';

    await I.usePlaywrightTo('候補生詳細表示 + 受講生へ移動', async ({ page }) => {
      await page.goto(href, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('body:has-text("候補生詳細")', { timeout: TIMEOUTS.SCREEN * 1000 });

      await page.locator('text=受講生へ移動').first().click();

      const deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        if (!page.url().includes('ContactsKouho')) {
          promotionResult = 'success';
          break;
        }
        // 会員番号重複エラーの検出（青バー）
        const errEl = page.locator(':has-text("既にcontactsに同一会員番号")').last();
        if (await errEl.count() > 0) {
          duplicateErrorText = ((await errEl.textContent()) ?? '').trim();
          promotionResult = 'duplicate';
          break;
        }
        await page.waitForTimeout(300);
      }
      if (promotionResult === 'pending') promotionResult = 'timeout';
    });

    if (promotionResult === 'duplicate') {
      // 会員番号重複はDB側の問題のためテストを停止してユーザーに確認を促す
      throw new Error(
        `【会員番号重複エラー】${duplicateErrorText}\n` +
        `\nDBに同一会員番号のレコードが存在します。以下のSQLで確認・対処してください：\n` +
        DUPLICATE_CHECK_SQL
      );
    }

    if (promotionResult === 'success') {
      I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);
      await logScreenUrl(I, '受講生詳細（昇格後）');
      return;
    }

    // timeout の場合は次の候補生を試みる
    I.say(`  タイムアウト（URL変化なし）のためスキップ → 次の候補生へ`);
  }

  throw new Error(`有効な候補生が見つかりませんでした（姓: ${lastName}）。候補生データを補充してください。`);
}

async function runStudentPaymentSetup(I, classMemberPageShimamura, row) {
  await navigateToKouhosei(I, classMemberPageShimamura, row.lastName);

  I.say('【請求方法設定】受講生詳細 → 編集');
  I.click(S.kouhoseiEdit.editButton);
  I.waitForElement(S.kouhoseiEdit.bankPaymentType, TIMEOUTS.SCREEN);
  await logScreenUrl(I, '受講生編集');

  const testName = buildTestName(row);
  I.say(`【名前書き換え】${testName.lastName} / ${testName.firstName}`);
  fillTextFieldsByName(I, { last_name: testName.lastName, first_name: testName.firstName });
  I.fillField(S.kouhoseiEdit.description, testName.description);

  I.selectOption(S.kouhoseiEdit.bankPaymentType, row.bank_payment_type);
  I.selectOption(S.kouhoseiEdit.shimaStorageId,  row.shima_storage_id);

  if (row.discount && String(row.discount).trim() === '1') {
    I.say('【社割設定】割引有無をON');
    I.checkOption(S.kouhoseiEdit.discount);
  }

  I.say('【請求方法設定】保存');
  I.click(S.kouhoseiEdit.saveButton);
  I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);
  await assertNoShimamuraError(I, '【請求方法設定】保存');
  await logScreenUrl(I, '受講生詳細（保存後）');

  const currentUrl = await I.grabCurrentUrl();
  const match = currentUrl.match(/[?&]record=([^&]+)/);
  if (!match) return null;

  const recordId = match[1];
  const withdrawn = saveToSession(SESSION_FILE, recordId, testName, row);
  I.say(`  受講生 record=${recordId} をセッションファイルに保存${withdrawn ? '（退会済みフラグあり）' : ''}`);
  return recordId;
}

// 経理カルテビューの入金明細テーブル（#tbl_carte）から、対象年月の「会費」列を検証する。
// このテーブルは #top_err_info_msg_div（未払いバナー、当月以前の督促のみ表示）と異なり、
// 未来月（月謝一括作成バッチが作成した翌月分）も含めて全月が表示されるため、
// セットアップ時（画面トリガー・当月）とバッチ実行後（翌月）の両方の検証に使える。
// 運営管理費は同一店舗内で最大額の1件のみ確定するロジックのため、テスト用クラスの
// 月謝(course_kingaku)を0円にしておけば「会費」列＝確定した運営管理費そのものになる
// （expectedClassName は勝者を示すログ用途で、金額の一致自体が勝者の証明になる）。
// 金額は税込表示のため、期待値（税抜の運営管理費マスタ値）は1.1倍して比較する。
async function verifyKanrihiFee(I, recordId, { targetYear, targetMonth, expectedKanrihiBase, expectedClassName, expectedDiscount }) {
  const targetYearMonth = `${targetYear}/${String(targetMonth).padStart(2, '0')}`;
  I.say(`【運営管理費確認】record=${recordId} / ${targetYearMonth} / 想定勝者クラス=${expectedClassName} / 期待値(税抜)=${expectedKanrihiBase}`);
  I.amOnPage(`${BASE_URL}index.php?module=Student&action=DWCarteKeiri_AN&record=${recordId}`);
  I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);
  I.waitForElement('#tbl_carte', TIMEOUTS.SCREEN);
  await logScreenUrl(I, '運営管理費確認_経理カルテビュー');

  // 社割（個人情報1「社割」欄）の確認。CSVでdiscount=1が指定されたシナリオでのみ実施。
  if (expectedDiscount !== undefined) {
    const expectedDiscountText = expectedDiscount ? 'あり' : 'なし';
    const actualDiscountText = (await I.grabTextFrom('#td_discount')).trim();
    if (actualDiscountText !== expectedDiscountText) {
      throw new Error(`【社割表示不一致】期待="${expectedDiscountText}" 実際="${actualDiscountText}"`);
    }
    I.say(`  ✓ 社割表示 = ${actualDiscountText}`);
  }

  const amountXPath = `//table[@id="tbl_carte"]//a[contains(text(), "${targetYearMonth}")]/ancestor::td[1]/following-sibling::td[1]`;
  I.waitForElement(amountXPath, TIMEOUTS.SCREEN);
  const amountText = (await I.grabTextFrom(amountXPath)).trim();
  const actualAmount = Number(amountText.replace(/,/g, ''));
  const expectedAmount = Math.round(Number(expectedKanrihiBase) * 1.1);

  if (actualAmount !== expectedAmount) {
    throw new Error(`【運営管理費不一致】${targetYearMonth} 期待=${expectedAmount}円(想定勝者:${expectedClassName}) 実際=${actualAmount}円`);
  }
  I.say(`  ✓ ${targetYearMonth} 会費合計 = ${actualAmount}円（想定勝者クラス: ${expectedClassName}）`);
}

// 未払いバナー（#top_err_info_msg_div）のテキストを、クラス名ごとの正味金額（未払分は+、預り金は-）に
// 集計する。同一ページ内にIDが重複して存在する（空のプレースホルダ＋実データ）ため querySelectorAll で
// 取得し、空文字を除外して結合してから解析する。
// 例: 「料金名: 月運営管理費（7月） 未払分: 1,100円 クラス名: X」「料金名: 月運営管理費（7月） 預り金: -1,100円 クラス名: X」
//     → netByClassName['X'] = 1100 + (-1100) = 0（負けたクラスは相殺されて実質0円になる）
async function grabKanrihiNetByClassName(I) {
  const bannerText = await I.executeScript(() => {
    return Array.from(document.querySelectorAll('#top_err_info_msg_div'))
      .map(el => el.innerText.trim())
      .filter(Boolean)
      .join('\n');
  });

  const netByClassName = {};
  const lineRe = /(未払分|預り金)[:：]\s*(-?[\d,]+)円\s*クラス名[:：]\s*(.+)$/;
  for (const rawLine of bannerText.split('\n')) {
    const line = rawLine.trim();
    const m = line.match(lineRe);
    if (!m) continue;
    const amount = Number(m[2].replace(/,/g, ''));
    const className = m[3].trim();
    netByClassName[className] = (netByClassName[className] || 0) + amount;
  }
  return netByClassName;
}

// 運営管理費が同額tie-breakとなるケースの勝者検証。#tbl_carte は月合計しか持たずクラス単位の
// 内訳が取れないため（同額同士は合計だけでは区別できない）、未払いバナーのクラス別内訳を使う。
// バナーは当月以前の督促のみ表示するため、この検証は「セットアップ時（当月）」専用。
// 勝者クラス = 期待額（税込）がそのまま正味金額として残る／敗者クラス = 未払分と預り金が相殺され正味0円
async function verifyKanrihiWinnerByClassName(I, recordId, { targetYear, targetMonth, expectedWinnerClass, expectedLoserClass, expectedKanrihiBase }) {
  const targetYearMonth = `${targetYear}/${String(targetMonth).padStart(2, '0')}`;
  I.say(`【運営管理費tie-break確認】record=${recordId} / ${targetYearMonth} / 勝者想定=${expectedWinnerClass} / 敗者想定=${expectedLoserClass}`);
  I.amOnPage(`${BASE_URL}index.php?module=Student&action=DWCarteKeiri_AN&record=${recordId}`);
  I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);
  I.waitForElement('#top_err_info_msg_div', TIMEOUTS.SCREEN);
  await logScreenUrl(I, '運営管理費tie-break確認_経理カルテビュー');

  const netByClassName = await grabKanrihiNetByClassName(I);
  const expectedAmount = Math.round(Number(expectedKanrihiBase) * 1.1);
  const winnerNet = netByClassName[expectedWinnerClass] || 0;
  const loserNet  = netByClassName[expectedLoserClass] || 0;

  if (winnerNet !== expectedAmount) {
    throw new Error(`【tie-break勝者不一致】${targetYearMonth} 勝者想定=${expectedWinnerClass} 期待正味額=${expectedAmount}円 実際=${winnerNet}円\n内訳: ${JSON.stringify(netByClassName)}`);
  }
  if (loserNet !== 0) {
    throw new Error(`【tie-break敗者不一致】${targetYearMonth} 敗者想定=${expectedLoserClass} 期待正味額=0円 実際=${loserNet}円\n内訳: ${JSON.stringify(netByClassName)}`);
  }
  I.say(`  ✓ 勝者 ${expectedWinnerClass} = ${winnerNet}円 / 敗者 ${expectedLoserClass} = ${loserNet}円（相殺済み）`);
}

// 月謝一括作成バッチは、収納業者のうち1つでも「対象月の口座振替スケジュール」が
// 未登録だと、その収納業者だけでなく処理対象全体が作成されない（#169で判明）。
// テスト実行環境（testgcp）に実在する収納業者のうち、判明している既知の収納業者について
// 対象月のスケジュールを事前に確保しておく。登録済みでも重複登録エラーにならない
// （既存レコードが上書きされるだけ）ため、毎回無条件に登録して問題ない。
const KNOWN_STORAGE_VENDORS = [
  { shimaStorageId: '00120211112', label: '001:イオン収納' },        // テストデータの収納業者
  { shimaStorageId: '1434050501',  label: '143:T_JF収納業者143' },   // testgcp環境に実在する他収納業者。未登録だとバッチ全体が止まる
];

async function ensureAccountTransferSchedules(I, { claimMonth, debitDate, depositDate }) {
  for (const vendor of KNOWN_STORAGE_VENDORS) {
    I.say(`【口座振替スケジュール確保】${vendor.label} / ${claimMonth}`);
    I.amOnPage(`${BASE_URL}index.php?module=ShimaSchedule&action=LWAccountTransferScheduleRegistration_AN`);
    I.waitForElement('#shima_storage_id', TIMEOUTS.SCREEN);
    I.selectOption('#shima_storage_id', vendor.shimaStorageId);
    I.fillField('#claim_month', claimMonth);
    I.fillField('#data_date', debitDate);
    I.fillField('#t_date', depositDate);
    I.click('input[name="register_button"]');
    I.wait(TIMEOUTS.TAB_SWITCH);
  }
}

async function runMonthlyFeeCreation(I) {
  const now  = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const claimMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
  await ensureAccountTransferSchedules(I, {
    claimMonth,
    debitDate:   `${claimMonth}-11`,
    depositDate: `${claimMonth}-15`,
  });

  I.say('【月謝一括作成】画面へ遷移');
  I.amOnPage(BASE_URL + 'index.php?module=Fee&action=LWMonthlyFeeCreation_AN');
  I.waitForElement('#create_next_monthly_fee', TIMEOUTS.SCREEN);
  await logScreenUrl(I, '月謝一括作成');

  I.say('【月謝一括作成】月謝作成ボタンをクリック（confirm 承認 + サーバー処理完了まで待機）');
  // onclick は window.confirm → form.submit()。サーバー処理に時間がかかるため timeout を明示。
  await I.usePlaywrightTo('月謝作成ボタンクリック・完了待ち', async ({ page }) => {
    await Promise.all([
      page.waitForLoadState('networkidle', { timeout: 60000 }),
      page.locator('#create_next_monthly_fee').click({ timeout: 60000 }),
    ]);
  });
  await logScreenUrl(I, '月謝一括作成（実行後）');
}

async function verifyMonthlyFees(I, classMemberPageShimamura) {
  // 来月の YYYY/MM（例: 2026/07）
  const now  = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const targetYearMonth = `${next.getFullYear()}/${String(next.getMonth() + 1).padStart(2, '0')}`;

  // setupテストが書き出した受講生 record UUID リストを読み込む
  let session = [];
  try { session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')); } catch {}

  I.say(`【月謝確認】${session.length}件 / 確認月: ${targetYearMonth}`);

  for (const { recordId, lastName, firstName, scenario, withdrawn, expectedKanrihi, expectedWinnerClass } of session) {
    if (withdrawn) {
      I.say(`  スキップ（退会済み）: ${lastName} ${firstName}（${scenario}）`);
      continue;
    }
    I.say(`  対象: ${lastName} ${firstName}（${scenario}）record=${recordId}`);

    // 受講生詳細へ record UUID で直接遷移（同名受講生が複数いても混在しない）
    I.amOnPage(`${BASE_URL}index.php?module=Student&action=DetailView&record=${recordId}`);
    I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);

    // 経理ビューへ遷移
    await toggleGroupmenu(I, { icon_id: 'submenu__detailviews_sub', menuname: '閲覧/登録・経理ビュー' });
    await classMemberPageShimamura.clickSubMenuLink('受講生登録・経理ビュー（個人）', '受講生登録・経理ビュー（個人）');
    await logScreenUrl(I, '月謝確認_経理ビュー');

    I.see(targetYearMonth);
    I.say(`  ✓ ${targetYearMonth} の料金を確認`);

    // 運営管理費の期待値が設定されている場合、月謝一括作成バッチが翌月分にも
    // 最大額確定ロジックを正しく適用していることを検証する
    if (expectedKanrihi && expectedWinnerClass) {
      await verifyKanrihiFee(I, recordId, {
        targetYear:  next.getFullYear(),
        targetMonth: next.getMonth() + 1,
        expectedKanrihiBase: expectedKanrihi,
        expectedClassName:   expectedWinnerClass,
      });
    }
  }
}

module.exports = { runStudentPaymentSetup, runMonthlyFeeCreation, verifyMonthlyFees, verifyKanrihiFee, verifyKanrihiWinnerByClassName, ensureAccountTransferSchedules, resolveRelativeMonth, SESSION_FILE };
