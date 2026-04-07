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
 * **チェックタイミング**
 * MenuNavigationMixin の onPageLoaded フック経由で画面遷移のたびに呼ばれる：
 * - サブメニューページ
 * - 検索結果ページ
 * - 詳細ページ
 * - 詳細タブページ（各タブごと）
 *
 * **削除方法**
 * このファイル（tests/tframe/lang_check_test.js）を削除するだけで完結。
 * MenuNavigationMixin の onPageLoaded フックは他テストでは呼ばれないため影響なし。
 *
 * **実行例**
 * npx codeceptjs run ./tests/tframe/lang_check_test.js --profile tframe.juku_test --steps
 */

// TEMPORARY

const createMenuNavigationMixin = require('../../pages/tframe/MenuNavigationMixin');
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
      'button, input[type="submit"], input[type="button"], a, [role="button"]'
    )).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });

    const found = [];
    for (const el of elements) {
      const text = (el.textContent || el.value || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ');
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

  const safeName = String(pageName).replace(/[\\/:*?"<>|\s]/g, '_');

  if (!violations || violations.length === 0) {
    I.say(`【言語チェックOK】${lang}モード / ${pageName}`);
    await I.saveScreenshotWithTimestamp(`LANG_OK_${lang.toUpperCase()}_${safeName}.png`, true);
    return;
  }

  for (const text of violations) {
    I.say(`【言語ミスマッチ】${lang}モード / ${pageName}: "${text}"`);
  }
  await I.saveScreenshotWithTimestamp(`LANG_NG_${lang.toUpperCase()}_${safeName}.png`, true);
}

/**
 * MenuNavigationMixin のモジュールレベルコールバックに scanLang をセットする。
 * this に依存しないため CodeceptJS の Proxy ラップの影響を受けない。
 */
function attachLangCheck(I) {
  createMenuNavigationMixin.setPageLoadedCallback(async (name) => scanLang(I, name));
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

    // モジュールレベルのコールバックをセット（全ページ共通）
    attachLangCheck(I);

    // 受講生メニュー
    jukuseiPage.clickJukuseiIcon();
    await jukuseiPage.verifyMenuNavigation(studentSideMenu);

    // コースメニュー
    coursePage.clickCourseIcon();
    await coursePage.verifyMenuNavigation(courseSideMenu);

    // 講師メニュー
    koshiPage.clickKoshiIcon();
    await koshiPage.verifyMenuNavigation(teacherSideMenu);

    // マスターメニュー
    masterMenuPage.clickMasterIcon();
    await masterMenuPage.verifyMenuNavigation(masterSideMenu);

    // カレンダーメニュー
    // カレンダーメニュー
    calendarPage.clickCalendarIcon();
    await calendarPage.verifyMenuNavigation(calendarSideMenu);

    // Eメールメニュー
    emailPage.clickEmailIcon();
    await emailPage.verifyMenuNavigation(emailSideMenu);

    // レポートメニュー
    reportPage.clickReportIcon();
    await reportPage.verifyMenuNavigation(reportSideMenu);

    // ホームメニュー（サブメニューなし：ページ自体をスキャン）
    homePage.clickHomeIcon();
    await scanLang(I, 'ホーム');

    // ヘルプメニュー
    helpPage.clickHelpIcon();
    await helpPage.verifyMenuNavigation(helpSideMenu);

    createMenuNavigationMixin.clearPageLoadedCallback();
  }
);
