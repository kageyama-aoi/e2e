'use strict';

const fs   = require('fs');
const path = require('path');

const { logScreenUrl } = require('../../../support/utils');
const { toggleGroupmenu, assertNoShimamuraError } = require('../../../support/shimamura/utils');
const { TIMEOUTS } = require('../../../support/shimamura/constants');

// setupテストと月謝テスト間で受講生 record UUID を受け渡すファイル
const SESSION_FILE = path.resolve(__dirname, '../../../output/tsukihi_ikatsu_session.json');

const RESULT_LINK = 'a.listViewTdLinkS1';

const S = {
  kouhoseiEdit: {
    lastName:        '#last_name',
    firstName:       '#first_name',
    bankPaymentType: '#bank_payment_type',
    shimaStorageId:  '#shima_storage_id',
    saveButton:      'input[name="save_button"]',
    editButton:      'input[name="edit_button"]',
  },
};

function buildTestName(row) {
  const now  = new Date();
  const mmdd = String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
  return {
    lastName:  `月謝テスト${mmdd}`,
    firstName: `${row.testNo}${row.scenario.replace(/_/g, '')}`,
  };
}

/**
 * サイドバー経由で候補生一覧へ移動し、姓で候補生を検索して候補生詳細へ進む。
 */
async function navigateToKouhosei(I, classMemberPageShimamura, lastName) {
  I.say('【候補生一覧】サイドバー → 候補生グループ → 候補生検索');
  await classMemberPageShimamura.navigateToAdminTab(I, '受講生', '受講生登録');
  await toggleGroupmenu(I, { icon_id: 'submenu__candidates_grp_sub', menuname: '候補生' });
  await classMemberPageShimamura.clickSubMenuLink('候補生検索', '候補生検索');
  await logScreenUrl(I, '候補生検索ページ');

  I.say(`【候補生一覧】姓 "${lastName}" で検索`);
  I.waitForElement(locate('body').withText('候補生一覧'), TIMEOUTS.SCREEN);
  I.fillField('last_name', lastName);
  I.click('検索');
  I.waitForElement(RESULT_LINK, TIMEOUTS.RESULT);
  await logScreenUrl(I, '候補生一覧');

  I.click(locate(RESULT_LINK).first());
  // 候補生詳細ページには edit_button ではなく「受講生へ移動」ボタンがある
  I.waitForElement(locate('body').withText('候補生詳細'), TIMEOUTS.SCREEN);
  await logScreenUrl(I, '候補生詳細');
}

/**
 * 候補生詳細 → 「受講生へ移動」で昇格 → 受講生詳細で請求方法を編集して保存。
 * 完了後は受講生詳細ページに留まる（後続の経理ビュー遷移に備える）。
 */
async function runStudentPaymentSetup(I, classMemberPageShimamura, row) {
  await navigateToKouhosei(I, classMemberPageShimamura, row.lastName);

  I.say('【昇格】受講生へ移動をクリック');
  I.click('受講生へ移動');
  I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);
  await logScreenUrl(I, '受講生詳細（昇格後）');

  I.say('【請求方法設定】受講生詳細 → 編集');
  I.click(S.kouhoseiEdit.editButton);
  I.waitForElement(S.kouhoseiEdit.bankPaymentType, TIMEOUTS.SCREEN);
  await logScreenUrl(I, '受講生編集');

  const testName = buildTestName(row);
  I.say(`【名前書き換え】${testName.lastName} / ${testName.firstName}`);
  I.fillField(S.kouhoseiEdit.lastName,  testName.lastName);
  I.fillField(S.kouhoseiEdit.firstName, testName.firstName);

  I.selectOption(S.kouhoseiEdit.bankPaymentType, row.bank_payment_type);
  I.selectOption(S.kouhoseiEdit.shimaStorageId,  row.shima_storage_id);

  I.say('【請求方法設定】保存');
  I.click(S.kouhoseiEdit.saveButton);
  I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);
  await assertNoShimamuraError(I, '【請求方法設定】保存');
  await logScreenUrl(I, '受講生詳細（保存後）');

  // 受講生の record UUID をセッションファイルに追記（verifyMonthlyFees で再利用）
  const currentUrl = await I.grabCurrentUrl();
  const match = currentUrl.match(/[?&]record=([^&]+)/);
  if (match) {
    const recordId = match[1];
    let session = [];
    try { session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')); } catch {}
    session.push({ recordId, lastName: testName.lastName, firstName: testName.firstName, scenario: row.scenario });
    fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });
    fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
    I.say(`  受講生 record=${recordId} をセッションファイルに保存`);
  }
}

/**
 * 月謝一括作成画面へ遷移し、月謝作成ボタンを押す。
 * ボタンの onclick は window.confirm を出した後 this.form.submit() を呼ぶ。
 * サーバー側で全受講生分の月謝を作成するため処理に時間がかかる。
 */
const BASE_URL = (process.env.BASE_URL || '').replace(/\/?$/, '/');

async function runMonthlyFeeCreation(I) {
  I.say('【月謝一括作成】画面へ遷移');
  I.amOnPage(BASE_URL + 'index.php?module=Fee&action=LWMonthlyFeeCreation_AN');
  I.waitForElement('#create_next_monthly_fee', TIMEOUTS.SCREEN);
  await logScreenUrl(I, '月謝一括作成');

  I.say('【月謝一括作成】月謝作成ボタンをクリック（confirm 承認 + サーバー処理完了まで待機）');
  // ボタンの onclick は window.confirm を出した後 this.form.submit() を呼ぶ。
  // CodeceptJS の Playwright helper がダイアログを自動承認する。
  // サーバーが全受講生の月謝を処理するため時間がかかる → timeout: 60000 を明示。
  await I.usePlaywrightTo('月謝作成ボタンクリック・完了待ち', async ({ page }) => {
    await Promise.all([
      page.waitForLoadState('networkidle', { timeout: 60000 }),
      page.locator('#create_next_monthly_fee').click({ timeout: 60000 }),
    ]);
  });
  await logScreenUrl(I, '月謝一括作成（実行後）');
}

/**
 * 月謝一括作成後の結果確認。
 * 実行日の月謝テスト受講生（月謝テスト{MMDD}）の経理ビューで
 * 来月分の料金・入出金が作成されていることを I.see() で検証する。
 */
async function verifyMonthlyFees(I, classMemberPageShimamura) {
  // 来月の YYYY/MM（例: 2026/07）
  const now  = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const targetYearMonth = `${next.getFullYear()}/${String(next.getMonth() + 1).padStart(2, '0')}`;

  // setupテストが書き出した受講生 record UUID リストを読み込む
  let session = [];
  try { session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')); } catch {}

  I.say(`【月謝確認】${session.length}件 / 確認月: ${targetYearMonth}`);

  for (const { recordId, lastName, firstName, scenario } of session) {
    I.say(`  対象: ${lastName} ${firstName}（${scenario}）record=${recordId}`);

    // 受講生詳細へ record UUID で直接遷移（同名受講生が複数いても混在しない）
    I.amOnPage(`${BASE_URL}index.php?module=Student&action=DetailView&record=${recordId}`);
    I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);

    // 経理ビューへ遷移
    await toggleGroupmenu(I, { icon_id: 'submenu__detailviews_sub', menuname: '閲覧/登録・経理ビュー' });
    await classMemberPageShimamura.clickSubMenuLink('受講生登録・経理ビュー（個人）', '受講生登録・経理ビュー（個人）');
    await logScreenUrl(I, '月謝確認_経理ビュー');

    // 来月分の料金・入出金が存在することを確認
    I.see(targetYearMonth);
    I.say(`  ✓ ${targetYearMonth} の料金を確認`);
  }
}

module.exports = { runStudentPaymentSetup, runMonthlyFeeCreation, verifyMonthlyFees, SESSION_FILE };
