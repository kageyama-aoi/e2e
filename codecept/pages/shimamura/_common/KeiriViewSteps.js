'use strict';

/**
 * 受講生登録・経理ビュー（個人）の操作。
 * - 経理ビューへの遷移（サイドバー／URL 直指定）
 * - UI での A（クラス追加/更新する）→ B（クラス選択〜売上計上）→ E（確認完了）
 * - 同じ B〜E を画面操作なしで送るフォーム送信版 `enrollClassBySubmit`（データ準備用）
 * - 「経理処理が完了してないデータがあります」の解消
 * 初回登録・月謝一括作成準備・料金明細準備・退会などが共通で使う（#300 で SyokaiFlowPage から切り出し）。
 */

const { logScreenUrl } = require('../../../support/utils');
const {
  toggleGroupmenu,
  verifyNavigationByUrlChange,
  clickCheckboxByLabelOrName,
  verifyCheckboxCheckedByLabelOrName,
  verifyValidationErrors,
  fillTextFieldsBySelector,
} = require('../../../support/shimamura/utils');
const { TIMEOUTS, SELECTORS, pageUrl } = require('../../../support/shimamura/constants');
const { prepareInput, buildExecutionPlan } = require('../../../support/shimamura/syokai_helpers');

const KEIRI_SCREEN_B_LOCATORS = {
  textbox:  { keiyaku_date: '#contract_dateclass_operation', kaishi_date: '#start_dateclass_operation', class_name: '#course_name' },
  pulldown: { area: '#AN_1_area_id', tenpo: '#school_id', couse_category: '#course_category', remaining_classes: '#remaining_times' },
  checkbox: { mid_month: '#ltd_mid_month' },
  button:   { class_select: '#course_popup_popup_button', label_class_set: 'クラス適用', label_course_set: 'コース料金設定', label_tran_set: '売上計上する', tran_set: 'input[value="売上計上する"]' },
  screen:   { name: '受講生詳細' },
  error:    { container: SELECTORS.ERROR_CONTAINER }
};

const KEIRI_SUBMENU = {
  icon_id:   'submenu__detailviews_sub',
  groupName: '閲覧/登録・経理ビュー',
  linkName:  '受講生登録・経理ビュー（個人）',
};

/**
 * 受講生登録・経理ビュー（個人）＝経理ビュー A の URL。
 * サイドバーのリンクが最終的に開く URL と同じ（2026-09-25 の通信記録で確認）。
 * @param {string} recordId 受講生の record（受講生番号または UUID）
 * @returns {string}
 */
function keiriViewUrl(recordId) {
  return pageUrl({
    module: 'Student', action: 'CarteView', return_module: 'Student', return_action: 'CarteView',
    layout_def_key: 'carte', carte_view: '2', record: recordId,
  });
}

/**
 * 受講生詳細から「受講生登録・経理ビュー（個人）」へ移る。
 * recordId を渡すと URL を直接開く（サイドバー経由より約8秒速い #244）。
 * recordId を渡すのはデータ準備の呼び出し元（月謝一括作成準備など）で、速さを優先して
 * `SHIMAMURA_NAV=sidebar` の環境でも URL で開く。recordId が無いときは従来通りサイドバーから開く
 * （初回登録テストは recordId を渡さず、サイドバー経路そのものを確かめる）。
 * @param {object} I
 * @param {object} classMemberPageShimamura
 * @param {{recordId: (string|undefined)}} [options] 受講生の record UUID
 */
async function navigateToKeirisyoriView(I, classMemberPageShimamura, { recordId } = {}) {
  if (recordId) {
    I.amOnPage(keiriViewUrl(recordId));
    return;
  }
  await toggleGroupmenu(I, { icon_id: KEIRI_SUBMENU.icon_id, menuname: KEIRI_SUBMENU.groupName });
  await classMemberPageShimamura.clickSubMenuLink(KEIRI_SUBMENU.linkName, KEIRI_SUBMENU.linkName);
}

async function fillClassSearchForm(I, locators, className, options) {
  I.say('【クラス選択】検索条件入力');
  I.retry({ retries: 5, minTimeout: 200 }).switchToNextTab();
  I.waitForElement(locators.pulldown.area, TIMEOUTS.SCREEN);
  fillTextFieldsBySelector(I, [[locators.textbox.class_name, className]]);
  I.selectOption(locators.pulldown.couse_category, options.couse_category);
  I.selectOption(locators.pulldown.area, options.area);
  I.selectOption(locators.pulldown.tenpo, options.tenpo);
}

async function fillAccountingDates(I, locators, dates) {
  I.say('【経理日付入力】契約日・開始日');
  I.waitForEnabled(locators.textbox.keiyaku_date, TIMEOUTS.ENABLED);
  fillTextFieldsBySelector(I, [
    [locators.textbox.keiyaku_date, dates.keiyaku_date],
    [locators.textbox.kaishi_date,  dates.kaishi_date],
  ]);

  const midMonthValue = typeof dates.mid_month === 'string' ? dates.mid_month.trim() : dates.mid_month;
  const remainingClassesValue = typeof dates.remaining_classes === 'string' ? dates.remaining_classes.trim() : dates.remaining_classes;
  const shouldCheckMidMonth = Boolean(
    (midMonthValue && String(midMonthValue).toLowerCase() !== '0' && String(midMonthValue).toLowerCase() !== 'false')
    || remainingClassesValue
  );

  if (shouldCheckMidMonth) {
    I.waitForElement(locators.checkbox.mid_month, TIMEOUTS.ELEMENT);
    await clickCheckboxByLabelOrName(I, {
      labelText: '月途中',
      inputName: 'ltd_mid_month',
      inputId: 'ltd_mid_month',
      containerSelector: locators.checkbox.mid_month
    });
    await verifyCheckboxCheckedByLabelOrName(I, {
      labelText: '月途中',
      inputName: 'ltd_mid_month',
      inputId: 'ltd_mid_month',
      containerSelector: locators.checkbox.mid_month
    });
    if (remainingClassesValue) {
      I.waitForEnabled(locators.pulldown.remaining_classes, TIMEOUTS.ELEMENT);
      I.selectOption(locators.pulldown.remaining_classes, remainingClassesValue);
    }
  }
}

function createActionExecutor(I, locators, input, expectedErrors) {
  const actions = {
    class_select: async () => {
      I.click(locators.button.class_select);
      await selectClassInPopup(I, locators, input.class_name01, input.course_category);
    },
    switch_to_detail: async () => {
      I.switchToNextTab();
      I.waitForElement(locate('body').withText(locators.screen.name), TIMEOUTS.SCREEN);
    },
    class_apply: async () => {
      I.click(locators.button.label_class_set);
    },
    fill_dates: async () => {
      await fillAccountingDates(I, locators, input);
    },
    course_set: async () => {
      I.click(locators.button.label_course_set);
    },
    log_after_popup_close: async () => {
      await logScreenUrl(I, '経理ビューB_クラス選択POP_UP閉じたあと');
    },
    transaction: async () => {
      // 「売上計上する」はコース料金設定の処理が終わってから押せるようになる。
      // 押せるまで待ってから押す（すぐ押すと "element is not enabled" で落ちうる。#211）
      I.waitForEnabled(locators.button.tran_set, TIMEOUTS.ENABLED);
      I.click(locators.button.label_tran_set);
    },
    verify_errors: async () => {
      await verifyValidationErrors(I, expectedErrors, locators.error.container);
    }
  };

  return {
    execute: async (planItem) => {
      const action = actions[planItem.step];
      if (!action) throw new Error(`Unknown action: ${planItem.step}`);
      await action();
    }
  };
}

async function openKeirisyoriScreenA(I, classMemberPageShimamura, { skipNav = false, recordId } = {}) {
  if (!skipNav) {
    I.say('【画面遷移】受講生登録・経理ビュー');
    I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);
    await logScreenUrl(I, '受講生詳細');
    await navigateToKeirisyoriView(I, classMemberPageShimamura, { recordId });
  }
  I.waitForElement(locate('body').withText('クラス追加/更新する'), TIMEOUTS.SCREEN);
  I.click('クラス追加/更新する');
}

async function selectClassInPopup(I, parentLocators, class_name01, course_category) {
  const resolvedCategory = (typeof course_category === 'string' && course_category.trim())
    ? course_category.trim()
    : 'スクール';
  const SS = {
    button: { search: '検索' },
    result: { link: SELECTORS.RESULT_LINK },
    options: { couse_category: resolvedCategory, area: 'すべて', tenpo: 'すべて' }
  };
  I.say('【クラス選択】ポップアップ検索');
  await fillClassSearchForm(I, parentLocators, class_name01, SS.options);
  await logScreenUrl(I, 'クラス選択POP_UP');
  I.click(SS.button.search);
  I.waitForElement(SS.result.link, TIMEOUTS.RESULT);

  // クラス名検索は前方一致のため、意図しない別クラス（例: "ピアノ水曜日_02" 検索時の
  // "ピアノ水曜日_02e"）が結果に混入することがある。1件目を無条件に選ばず、
  // class_name01 と完全一致する行のみをクリックする。
  const exactMatchXPath = `//a[contains(concat(" ", normalize-space(@class), " "), " listViewTdLinkS1 ") and normalize-space(text())="${class_name01}"]`;
  const exactMatchCount = await I.grabNumberOfVisibleElements(locate({ xpath: exactMatchXPath }));
  if (exactMatchCount === 0) {
    throw new Error(`【クラス選択】完全一致するクラスが見つかりません（検索語: "${class_name01}"）。前方一致で類似クラスのみヒットしている可能性があります。`);
  }
  I.click(locate({ xpath: exactMatchXPath }));
}

async function fillKeirisyoriScreenB(I, {
  class_name01, course_category, keiyaku_date, kaishi_date,
  mid_month, remaining_classes, breakTarget, breakValue, expectedErrors = []
}) {
  I.say('【経理処理】クラス選択〜売上計上');
  const S = KEIRI_SCREEN_B_LOCATORS;
  const preparedInput = prepareInput({ class_name01, course_category, keiyaku_date, kaishi_date, mid_month, remaining_classes, breakTarget, breakValue, expectedErrors });
  const { plan } = buildExecutionPlan({ class_name01, keiyaku_date, kaishi_date, breakTarget, breakValue, expectedErrors });
  const executor = createActionExecutor(I, S, preparedInput, expectedErrors);
  for (const step of plan) {
    await executor.execute(step);
  }
}

async function confirmKeirisyoriScreenE(I) {
  I.say('【確認完了】経理ビューへ戻る');
  await logScreenUrl(I, '経理ビューE');
  await verifyNavigationByUrlChange(I, 5, 'DWConfirmCarteKeiri_AN', '確認完了（経理ビューへ）');
  await logScreenUrl(I, '経理ビューA');
  I.saveScreenshot(`keiri_view_A_${Date.now()}.png`, true);
}

const UNFINISHED_KEIRI_WARNING = '経理処理が完了してないデータがあります';

// 受講生詳細/経理ビュー系の画面に「経理処理が完了してないデータがあります」という警告バナーが
// 出ている場合、退会処理などの操作が「指定の退会日は選択できません」等でブロックされることがある。
// 「未完了情報確認」→「確認完了（経理ビューへ）」の順にクリックして未処理データを確定させることで解消する。
// 警告が出ていない場合は何もしない（false を返す）。
async function resolveUnfinishedKeiriDataIfPresent(I) {
  const warningCount = await I.grabNumberOfVisibleElements(locate('body').withText(UNFINISHED_KEIRI_WARNING));
  if (!warningCount) return false;

  I.say('【経理処理未完了データ検知】未完了情報確認 → 確認完了で解消');
  await logScreenUrl(I, '経理処理未完了データあり');
  I.click('未完了情報確認');
  I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);
  I.click('確認完了（経理ビューへ）');
  I.waitForElement(locate('body').withText('クラス追加/更新する'), TIMEOUTS.SCREEN);
  await logScreenUrl(I, '経理処理未完了データ解消後');
  return true;
}

/**
 * 経理ビュー B〜E（クラス適用 → コース料金設定 → 売上計上 → 確認完了）をフォーム送信で行う（#280）。
 * UI 版（`openKeirisyoriScreenA` → `fillKeirisyoriScreenB` → `confirmKeirisyoriScreenE`）と同じ通信を
 * 画面操作なしで出す。データ準備用で、経理ビューの画面そのものの検証には使わない。
 *
 * **通信の中身**（2026-09-25 の通信記録・2026-10-01 の試作で確認）
 * 1. クラス検索: `Course/LWPopup_AN` に `submittype=search`（クラス名・コースカテゴリー）。結果行の
 *    `send_back_AN(…{'':'<クラスUUID>'})` からクラスの UUID を取る（UI ではポップアップで選ぶ部分）
 * 2. クラス適用: `Student/LWStClsOpSubpanel_B_AN` に `submittype=apply_class`（`event_id`=クラスUUID・`name`）
 * 3. コース料金設定: 同じ送り先に `submittype=apply_course_fee`。コース・入会金・エリア・店舗は、
 *    クラス適用後の画面 B で選ばれている値（UI で何も変えずに押したときと同じ）を送る
 * 4. 売上計上: `Student/DWAddClsCarteKeiri_AN` に GET `submittype=record_sales`（→ 確認画面へ 302）
 * 5. 確認完了: `Student/DWConfirmCarteKeiri_AN` に GET `submittype=confirm_sales`（→ 受講生詳細へ 302）
 * CSRF トークンはセッション共通なので、画面 B のフォームから1回読む。金額はサーバーが計算する。
 *
 * @param {object} I
 * @param {object} params
 * @param {string} params.recordId 受講生の record（受講生番号または UUID）
 * @param {string} params.className クラス名（完全一致で探す）
 * @param {string} [params.courseCategory='スクール'] コースカテゴリーの表示名
 * @param {string} params.keiyakuDate 契約日（YYYY-MM-DD）
 * @param {string} params.kaishiDate 開始日（YYYY-MM-DD）
 * @param {string} [params.courseName] コース名（表示名）。省略すると画面 B の既定（先頭）
 * @returns {Promise<{classId: string, courseId: string}>}
 * @throws {Error} クラスが見つからない・コースが紐づいていない・各段階でエラー表示が出た・画面が移らなかった場合
 */
async function enrollClassBySubmit(I, { recordId, className, courseCategory = 'スクール', keiyakuDate, kaishiDate, courseName }) {
  I.say(`【経理処理（フォーム送信）】${className}（${courseCategory}）契約日=${keiyakuDate} 開始日=${kaishiDate}`);
  const startedAt = Date.now();
  // 画面 B を開く（CSRF トークンをフォームから読むため。経理処理の途中データはまだ作られない）
  I.amOnPage(pageUrl({ module: 'Student', action: 'DWAddClsCarteKeiri_AN', record: recordId, sel_class_id: '' }));
  I.waitForElement('input[name="techno_csrf_token"]', TIMEOUTS.SCREEN);
  const result = await I.executeScript(async ([rec, p, errorSelector]) => {
    const token = document.querySelector('input[name="techno_csrf_token"]').value;
    const parse = (html) => new DOMParser().parseFromString(html, 'text/html');
    const errorOf = (doc) => {
      const el = doc.querySelector(errorSelector);
      return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    };
    const send = async (method, params) => {
      const res = await fetch('index.php?' + new URLSearchParams(params).toString(), { method, credentials: 'same-origin' });
      return { url: res.url, text: await res.text() };
    };
    const subpanel = {
      advanced: '', module: 'Student', action: 'LWStClsOpSubpanel_B_AN', record: rec, return_id: rec, is_ajax_AN: '1',
      subpanel_name: 'class_operation', subpanel_module: 'Student', subpanel_action: 'LWStClsOpSubpanel_B_AN',
      subpanel_target_location_id: '', subpanel_parent_id: rec, subpanel_parent_module: 'Student',
      subpanel_parent_action: 'DWAddClsCarteKeiri_AN', related_id: '', def_file_suffix: '', related_module: '',
      body_only_AN: '', is_popup_AN: '', techno_csrf_token: token,
    };
    try {
      // 1. クラス検索（カテゴリーの value はポップアップ画面の選択肢から引く）
      const popupKey = 'Student_LWStClsOpSubpanel_B_AN_class_operation_';
      const popup = parse((await send('GET', {
        module: 'Course', action: 'LWPopup_AN', self_id: '', popup_select_type: 'Course', select_course: 'true',
        display_hyouji: '0', is_popup_AN: 'true', parent_data_unique_key: popupKey, body_only_AN: 'true',
      })).text);
      const categoryOption = [...popup.querySelectorAll('select[name="course_category"] option')]
        .find((o) => o.textContent.trim() === p.courseCategory);
      if (!categoryOption) return { error: `コースカテゴリーが選択肢にありません: ${p.courseCategory}` };
      const found = parse((await send('POST', {
        submittype: 'search', advanced: '', event_contact_status: '', start_date: '', end_date: '',
        module: 'Course', action: 'LWPopup_AN', record: '', return_id: '', parent_data_unique_key: popupKey,
        body_only_AN: 'true', is_popup_AN: 'true', course_name: p.className, display_hyouji: '0',
        AN_1_area_id: 'all', school_id: 'all', course_category: categoryOption.value, techno_csrf_token: token,
        refresh_listview_only: 'true', is_ajax_AN: 'true', subpanel_name: 'lw_SearchView',
      })).text);
      // クラス名検索は前方一致なので、表示名が完全一致する行だけを使う（UI 版の selectClassInPopup と同じ）
      const link = [...found.querySelectorAll('a.listViewTdLinkS1')].find((a) => a.textContent.trim() === p.className);
      const m = link && (link.getAttribute('onclick') || '').match(/'([0-9a-f-]{36})'/);
      if (!m) return { error: `クラスが見つかりません（完全一致）: ${p.className}（${p.courseCategory}）` };
      const classId = m[1];

      // 2. クラス適用
      await send('POST', { ...subpanel, submittype: 'apply_class', event_id: classId, name: p.className });
      const screenB = parse((await send('GET', {
        module: 'Student', action: 'DWAddClsCarteKeiri_AN', record: rec, contract_date: '', start_date: '',
      })).text);
      const value = (name) => { const el = screenB.querySelector(`[name="${name}"]`); return el ? el.value : null; };
      if (value('event_id') !== classId) return { error: `クラス適用が反映されていません: ${errorOf(screenB) || '(エラー表示なし)'}` };
      const courseSelect = screenB.querySelector('select[name="course_name"]');
      if (!courseSelect || courseSelect.options.length === 0) return { error: `クラスにコースが紐づいていません: ${p.className}` };
      let courseId = courseSelect.value;
      if (p.courseName) {
        const opt = [...courseSelect.options].find((o) => o.textContent.trim() === p.courseName);
        if (!opt) return { error: `コースが選択肢にありません: ${p.courseName}` };
        courseId = opt.value;
      }

      // 3. コース料金設定
      await send('POST', {
        ...subpanel, submittype: 'apply_course_fee', event_id: classId, name: p.className,
        contract_date: p.keiyakuDate, start_date: p.kaishiDate, course_name: courseId,
        remaining_times: value('remaining_times') || '', admission_fee: value('admission_fee') || '',
        area_id: value('area_id') || '', screen_b_school_id: value('screen_b_school_id') || '',
      });
      const afterFee = parse((await send('GET', {
        module: 'Student', action: 'DWAddClsCarteKeiri_AN', record: rec, contract_date: p.keiyakuDate, start_date: p.kaishiDate,
      })).text);
      if (errorOf(afterFee)) return { error: `コース料金設定でエラー: ${errorOf(afterFee)}` };

      // 4. 売上計上 → 確認画面
      const sales = await send('GET', { module: 'Student', action: 'DWAddClsCarteKeiri_AN', record: rec, submittype: 'record_sales', techno_csrf_token: token });
      if (!/action=DWConfirmCarteKeiri_AN/.test(sales.url)) return { error: `売上計上後に確認画面へ移りません: ${errorOf(parse(sales.text)) || sales.url}` };
      // 5. 確認完了 → 受講生詳細
      const confirm = await send('GET', { module: 'Student', action: 'DWConfirmCarteKeiri_AN', record: rec, submittype: 'confirm_sales', techno_csrf_token: token });
      if (/action=DWConfirmCarteKeiri_AN/.test(confirm.url) || errorOf(parse(confirm.text))) {
        return { error: `確認完了できません: ${errorOf(parse(confirm.text)) || confirm.url}` };
      }
      return { classId, courseId };
    } catch (e) {
      // 外に投げると "Evaluation failed" になって原因が読めないため、戻り値に寄せる
      return { error: `送信に失敗しました: ${e && e.message ? e.message : e}` };
    }
  }, [recordId, { className, courseCategory, keiyakuDate, kaishiDate, courseName }, SELECTORS.ERROR_CONTAINER]);
  if (result.error) throw new Error(`【経理処理（フォーム送信）】${result.error}`);
  I.say(`【経理処理（フォーム送信）】完了 クラス=${result.classId} コース=${result.courseId}（${Date.now() - startedAt} ms）`);
  return result;
}

module.exports = {
  KEIRI_SUBMENU,
  keiriViewUrl,
  navigateToKeirisyoriView,
  openKeirisyoriScreenA,
  fillKeirisyoriScreenB,
  confirmKeirisyoriScreenE,
  enrollClassBySubmit,
  resolveUnfinishedKeiriDataIfPresent,
};
