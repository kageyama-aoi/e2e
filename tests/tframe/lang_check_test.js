/**
 * @fileoverview 言語整合性チェックテスト（一時的）
 *
 * **目的**
 * TFRAME_LANGUAGE の設定に応じて、各アイコンページ配下の全遷移でボタン・リンクの
 * 言語ミスマッチを検出する。テストは FAIL させず、ログとスクショのみ残す（soft check）。
 *
 * **チェック内容**
 * - EN モード: 日本語文字（ひらがな・カタカナ・漢字）がボタン/リンクに含まれていないか
 * - JA モード: 3文字以上の連続 ASCII アルファベットが含まれていないか
 *              （PDF / URL / API 等の略語も検出される点に注意）
 *
 * **削除方法**
 * このファイル（tests/tframe/lang_check_test.js）を削除するだけで完結。
 * 他ファイルへの影響なし。
 *
 * **実行例**
 * npx codeceptjs run ./tests/tframe/lang_check_test.js --profile tframe.juku_test --steps
 */

// TEMPORARY

const studentSideMenu  = require('../../data/tframe/studentSideMenu');
const courseSideMenu   = require('../../data/tframe/courseSideMenu');
const teacherSideMenu  = require('../../data/tframe/teacherSideMenu');
const masterSideMenu   = require('../../data/tframe/masterSideMenu');
const calendarSideMenu = require('../../data/tframe/calendarSideMenu');
const emailSideMenu    = require('../../data/tframe/emailSideMenu');
const reportSideMenu   = require('../../data/tframe/reportSideMenu');
const helpSideMenu     = require('../../data/tframe/helpSideMenu');

Feature('言語整合性チェック');

/**
 * 現在ページの可視ボタン・リンクをスキャンし、言語ミスマッチを検出する。
 * 検出時はログを出してスクショを保存するが、テストは FAIL させない。
 */
async function scanLang(I, pageName) {
  const lang = String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase();
  if (lang !== 'en' && lang !== 'ja') return;

  const violations = await I.executeScript((mode) => {
    const elements = Array.from(document.querySelectorAll(
      'button, input[type="submit"], input[type="button"], a'
    )).filter(el => el.offsetParent !== null);

    const found = [];
    for (const el of elements) {
      const text = (el.textContent || el.value || '').trim().replace(/\s+/g, ' ');
      if (!text) continue;

      let hit = false;
      if (mode === 'en') {
        // ひらがな・カタカナ・漢字が含まれていれば NG
        hit = /[\u3040-\u30FF\u4E00-\u9FFF]/.test(text);
      } else if (mode === 'ja') {
        // 3文字以上の連続 ASCII アルファベットが含まれていれば NG
        hit = /[a-zA-Z]{3,}/.test(text);
      }

      if (hit) {
        found.push(text.slice(0, 80));
      }
    }
    return found;
  }, lang);

  if (!violations || violations.length === 0) {
    I.say(`【言語チェックOK】${lang}モード / ${pageName}`);
    return;
  }

  for (const text of violations) {
    I.say(`【言語ミスマッチ】${lang}モード / ${pageName}: "${text}"`);
  }

  const safeName = String(pageName).replace(/[\\/:*?"<>|\s]/g, '_');
  await I.saveScreenshotWithTimestamp(`LANG_MISMATCH_${lang.toUpperCase()}_${safeName}.png`, true);
}

/**
 * メニュー定義の全項目を順に遷移し、遷移ごとに scanLang を呼ぶ。
 */
async function verifyWithLangCheck(page, menuDef, I) {
  for (const group of menuDef.groups) {
    for (const item of group.items) {
      await page.clickMenuItemAndVerify(item);
      await scanLang(I, item.name);
    }
  }
}

Scenario(
  '管理者ログイン後に全アイコンページのボタン言語整合性をチェック @lang_check',
  async ({
    I,
    loginKannrisyaPage,
    jukuseiPage,
    coursePage,
    koshiPage,
    masterMenuPage,
    calendarPage,
    emailPage,
    reportPage,
    homePage,
    helpPage,
  }) => {
    loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
    loginKannrisyaPage.seeLogout();

    // 受講生メニュー
    jukuseiPage.clickJukuseiIcon();
    await verifyWithLangCheck(jukuseiPage, studentSideMenu, I);

    // コースメニュー
    coursePage.clickCourseIcon();
    await verifyWithLangCheck(coursePage, courseSideMenu, I);

    // 講師メニュー
    koshiPage.clickKoshiIcon();
    await verifyWithLangCheck(koshiPage, teacherSideMenu, I);

    // マスターメニュー
    masterMenuPage.clickMasterIcon();
    await verifyWithLangCheck(masterMenuPage, masterSideMenu, I);

    // カレンダーメニュー
    calendarPage.clickCalendarIcon();
    await verifyWithLangCheck(calendarPage, calendarSideMenu, I);

    // Eメールメニュー
    emailPage.clickEmailIcon();
    await verifyWithLangCheck(emailPage, emailSideMenu, I);

    // レポートメニュー
    reportPage.clickReportIcon();
    await verifyWithLangCheck(reportPage, reportSideMenu, I);

    // ホームメニュー（サブメニューなし：ページ自体をスキャン）
    homePage.clickHomeIcon();
    await scanLang(I, 'ホーム');

    // ヘルプメニュー
    helpPage.clickHelpIcon();
    await verifyWithLangCheck(helpPage, helpSideMenu, I);
  }
);
