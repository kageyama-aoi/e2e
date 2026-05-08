/**
 * @fileoverview プルダウン選択肢スキャンテスト（一時的）
 *
 * **目的**
 * 各アイコンページ配下の全遷移画面にある <select> 要素を検出し、
 * 選択肢一覧をスクショ・JSON・コンソールログで記録する。
 *
 * **検出対象**
 * - 可視状態の <select> 要素（display/visibility で判定）
 * - ネイティブ select の「開いた状態」は JS オーバーレイで再現してスクショ
 *
 * **除外**
 * - アイコン押下直後のランディング画面（verifyMenuNavigation 前）
 *
 * **出力**
 * - スクショ: DD_CHECK_[ページ名]_[select識別子].png
 * - JSON: テスト実行ディレクトリ内 dropdown_options.json
 * - コンソール: I.say() で選択肢一覧を出力
 *
 * **削除方法**
 * tests/tframe/dropdown_check_test.js と bat/tframe_run_dropdown_check.bat を削除するだけで完結。
 *
 * **実行例**
 * npx codeceptjs run ./tests/tframe/dropdown_check_test.js --profile tframe.juku_test --steps
 */

// TEMPORARY

const fs = require('fs');
const path = require('path');
const repoRoot = require('../../../support/repoRoot');
const createMenuNavigationMixin = require('../../../pages/tframe/MenuNavigationMixin');

const sideMenus = require('../../../pages/tframe/sideMenus');

Feature('プルダウン選択肢スキャン');

/**
 * 出力ディレクトリのパスを取得する。
 */
function getOutputDir() {
  const { config } = require('../../../codecept.conf.js');
  return path.join(repoRoot, config.output);
}

/**
 * JSON ログファイルにエントリを追記する。
 */
function appendDropdownLog(outputDir, entry) {
  const logPath = path.join(outputDir, 'dropdown_options.json');
  let data = [];
  if (fs.existsSync(logPath)) {
    try {
      data = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    } catch (_) {
      data = [];
    }
  }
  data.push(entry);
  fs.writeFileSync(logPath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * ページ名・select 識別子からスクショのファイル名を生成する。
 */
function buildDropdownScreenshotName(pageName, selectId) {
  const safePage = String(pageName).replace(/[\\/:*?"<>|\s]/g, '_');
  const safeId   = String(selectId).replace(/[\\/:*?"<>|\s]/g, '_');
  return `DD_CHECK_${safePage}_${safeId}.png`;
}

/**
 * 現在ページの可視 <select> 要素を全件スキャンし、
 * 各 select ごとにオーバーレイ描画→スクショ→ログ出力を行う。
 */
async function scanDropdowns(I, pageName, outputDir) {
  // 可視 select の情報を収集
  const selects = await I.executeScript(() => {
    return Array.from(document.querySelectorAll('select')).reduce((acc, el, index) => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return acc;

      const id      = el.id   || '';
      const name    = el.name || '';
      const label   = el.getAttribute('aria-label') || '';
      const key     = name || id || label || `select_${index}`;
      const options = Array.from(el.options).map(o => o.text.trim()).filter(t => t);
      const rect    = el.getBoundingClientRect();

      acc.push({ key, name, id, options, top: rect.top, left: rect.left, width: rect.width, height: rect.height, index });
      return acc;
    }, []);
  });

  if (!selects || selects.length === 0) {
    I.say(`【プルダウンなし】${pageName}`);
    return;
  }

  I.say(`【プルダウン検出】${pageName} / ${selects.length}件`);

  for (const sel of selects) {
    // 選択肢をコンソールに出力
    I.say(`  select[${sel.key}] / 選択肢数: ${sel.options.length}`);
    for (const opt of sel.options) {
      I.say(`    - ${opt}`);
    }

    // JS オーバーレイで「開いた状態」を再現
    await I.executeScript(({ top, left, width, options }) => {
      const existing = document.getElementById('__dd_check_overlay__');
      if (existing) existing.remove();

      const overlay = document.createElement('ul');
      overlay.id = '__dd_check_overlay__';
      overlay.style.cssText = [
        'position: fixed',
        `top: ${Math.min(top + 24, window.innerHeight - 200)}px`,
        `left: ${left}px`,
        `min-width: ${Math.max(width, 160)}px`,
        'background: #fff',
        'border: 1px solid #999',
        'border-radius: 2px',
        'box-shadow: 2px 2px 6px rgba(0,0,0,0.3)',
        'padding: 2px 0',
        'margin: 0',
        'list-style: none',
        'z-index: 99999',
        'font-size: 13px',
        'font-family: sans-serif',
        'max-height: 200px',
        'overflow-y: auto',
      ].join(';');

      for (const text of options) {
        const li = document.createElement('li');
        li.textContent = text;
        li.style.cssText = 'padding: 3px 12px; cursor: default; white-space: nowrap;';
        overlay.appendChild(li);
      }

      document.body.appendChild(overlay);
    }, { top: sel.top, left: sel.left, width: sel.width, options: sel.options });

    // スクショ保存
    const fileName = buildDropdownScreenshotName(pageName, sel.key);
    await I.saveScreenshotWithTimestamp(fileName, true);

    // オーバーレイ削除
    await I.executeScript(() => {
      const el = document.getElementById('__dd_check_overlay__');
      if (el) el.remove();
    });

    // JSON に追記
    appendDropdownLog(outputDir, {
      page:     pageName,
      selector: sel.name ? `select[name="${sel.name}"]` : sel.id ? `select#${sel.id}` : `select:nth(${sel.index})`,
      options:  sel.options,
    });
  }
}

Scenario(
  '管理者ログイン後に全アイコンページの select 要素をスキャン @dropdown_check',
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
    helpPage,
  }) => {
    loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
    loginKannrisyaPage.seeLogout();

    const outputDir = getOutputDir();

    // JSON ファイルを初期化
    const logPath = require('path').join(outputDir, 'dropdown_options.json');
    require('fs').writeFileSync(logPath, '[]', 'utf8');

    // モジュールレベルのコールバックをセット
    createMenuNavigationMixin.setPageLoadedCallback(async (name) => scanDropdowns(I, name, outputDir));

    // 受講生メニュー
    jukuseiPage.clickJukuseiIcon();
    await jukuseiPage.verifyMenuNavigation(sideMenus.student);

    // コースメニュー
    coursePage.clickCourseIcon();
    await coursePage.verifyMenuNavigation(sideMenus.course);

    // 講師メニュー
    koshiPage.clickKoshiIcon();
    await koshiPage.verifyMenuNavigation(sideMenus.teacher);

    // マスターメニュー
    masterMenuPage.clickMasterIcon();
    await masterMenuPage.verifyMenuNavigation(sideMenus.master);

    // カレンダーメニュー
    calendarPage.clickCalendarIcon();
    await calendarPage.verifyMenuNavigation(sideMenus.calendar);

    // Eメールメニュー
    emailPage.clickEmailIcon();
    await emailPage.verifyMenuNavigation(sideMenus.email);

    // レポートメニュー
    reportPage.clickReportIcon();
    await reportPage.verifyMenuNavigation(sideMenus.report);

    // ヘルプメニュー
    helpPage.clickHelpIcon();
    await helpPage.verifyMenuNavigation(sideMenus.help);

    createMenuNavigationMixin.clearPageLoadedCallback();

    I.say(`【スキャン完了】dropdown_options.json を保存しました: ${logPath}`);
  }
);
