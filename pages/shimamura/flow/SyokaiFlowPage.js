'use strict';

const { logScreenUrl } = require('../../../support/utils');
const {
  toggleGroupmenu,
  verifyNavigationByUrlChange,
  clickCheckboxByLabelOrName,
  verifyCheckboxCheckedByLabelOrName,
  verifyValidationErrors,
  assertNoShimamuraError,
  fillTextFieldsByName,
  fillTextFieldsBySelector,
} = require('../../../support/shimamura/utils');
const { TIMEOUTS } = require('../../../support/shimamura/constants');
const { prepareInput, buildExecutionPlan } = require('../../../support/shimamura/syokai_helpers');

const KEIRI_SCREEN_B_LOCATORS = {
  textbox:  { keiyaku_date: '#contract_dateclass_operation', kaishi_date: '#start_dateclass_operation', class_name: '#course_name' },
  pulldown: { area: '#AN_1_area_id', tenpo: '#school_id', couse_category: '#course_category', remaining_classes: '#remaining_times' },
  checkbox: { mid_month: '#ltd_mid_month' },
  button:   { class_select: '#course_popup_popup_button', label_class_set: 'クラス適用', label_course_set: 'コース料金設定', label_tran_set: '売上計上する' },
  screen:   { name: '受講生詳細' },
  error:    { container: '#top_err_info_msg_div' }
};

const KEIRI_SUBMENU = {
  icon_id:   'submenu__detailviews_sub',
  groupName: '閲覧/登録・経理ビュー',
  linkName:  '受講生登録・経理ビュー（個人）',
};

async function navigateToKeirisyoriView(I, classMemberPageShimamura) {
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
      I.retry({ retries: 2, minTimeout: 500 }).click(locators.button.label_tran_set);
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

async function navigateToStudentGroup(I, classMemberPageShimamura) {
  I.say('【画面遷移】候補生検索 メニュー');
  await toggleGroupmenu(I, { icon_id: 'submenu__candidates_grp_sub', menuname: '候補生' });
  await classMemberPageShimamura.clickSubMenuLink('候補生検索', '候補生検索');
  await logScreenUrl(I, '候補生検索ページ');
}

async function searchAndSelectKouhosei(I, last_name) {
  const S = {
    button: { search: '検索' },
    result: { list: '.listViewTdLinkS1', link: 'a.listViewTdLinkS1' }
  };
  I.say('【候補生検索】一覧表示＆検索実行');
  I.waitForElement(locate('body').withText('候補生一覧'), TIMEOUTS.SCREEN);
  fillTextFieldsByName(I, { last_name });
  I.click(S.button.search);
  I.waitForElement(S.result.list, TIMEOUTS.RESULT);
  await logScreenUrl(I, '候補生一覧');
  const student_name = await I.grabTextFrom(S.result.link);
  I.click(locate(S.result.list));
  I.say(`link_: ${student_name}`);
  return student_name;
}

async function promoteKouhoseiToStudent(I, student_name) {
  I.say('【候補生詳細】受講生へ移動');
  I.waitForElement(locate('body').withText('候補生詳細'), TIMEOUTS.SCREEN);
  await logScreenUrl(I, '候補生詳細');
  const idnumber = await I.grabTextFrom('#td_idnumber');
  I.say(`受講生情報: ${idnumber}_${student_name}`);
  I.click('受講生へ移動');
}

async function openKeirisyoriScreenA(I, classMemberPageShimamura, { skipNav = false } = {}) {
  if (!skipNav) {
    I.say('【画面遷移】受講生登録・経理ビュー');
    I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);
    await logScreenUrl(I, '受講生詳細');
    await navigateToKeirisyoriView(I, classMemberPageShimamura);
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
    result: { link: '.listViewTdLinkS1' },
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

async function executeTaikai(I, classMemberPageShimamura, { taikaiYear, taikaiMonth }) {
  const label = `${taikaiYear}${taikaiMonth}`;
  I.say(`【退会処理】最終在籍年月 ${taikaiYear}/${taikaiMonth} を設定`);
  I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);
  await toggleGroupmenu(I, { icon_id: KEIRI_SUBMENU.icon_id, menuname: KEIRI_SUBMENU.groupName });
  await classMemberPageShimamura.clickSubMenuLink('受講生詳細', '個人情報１');
  I.click('退会処理');
  I.waitForElement('#final_enrollment_year', TIMEOUTS.SCREEN);
  await logScreenUrl(I, '退会処理_入力前');
  I.saveScreenshot(`taikai_01_before_${label}.png`);
  I.executeScript(([year, month]) => {
    document.querySelector('#final_enrollment_year').value = year;
    document.querySelector('#final_enrollment_month').value = month;
  }, [taikaiYear, taikaiMonth]);
  // 退会画面のチェックボックスはユーザー操作しないと選択されないためスクリプトで全選択
  I.executeScript(() => {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = true; });
  });
  await logScreenUrl(I, '退会処理_入力後');
  I.saveScreenshot(`taikai_02_filled_${label}.png`);
  await I.usePlaywrightTo('退会処理_更新ボタン押下', async ({ page }) => {
    await Promise.all([
      page.waitForLoadState('domcontentloaded', { timeout: 15000 }),
      page.locator('input[value="更新"]').click(),
    ]);
  });
  I.see('会員退会処理が完了しました。');
  await logScreenUrl(I, '退会処理（更新後）');
  I.saveScreenshot(`taikai_03_done_${label}.png`);

  I.say('【退会後確認】経理ビューへ遷移');
  await navigateToKeirisyoriView(I, classMemberPageShimamura);
  I.waitForElement(locate('body').withText('クラス追加/更新する'), TIMEOUTS.SCREEN);
  await logScreenUrl(I, '退会後_経理ビュー');
  I.saveScreenshot(`keiri_after_taikai_${label}.png`, true);
}

async function runRegistrationFlow(I, classMemberPageShimamura, input) {
  I.say('【管理メニュー】受講生 → 受講生登録');
  await classMemberPageShimamura.navigateToAdminTab(I, '受講生', '受講生登録');
  I.say('=== 候補生検索 開始 ===');
  await navigateToStudentGroup(I, classMemberPageShimamura);
  const student_name = await searchAndSelectKouhosei(I, input.lastName);
  await promoteKouhoseiToStudent(I, student_name);
  I.say('=== 候補生検索 終了 ===');
  I.say('=== 経理ビューA/B 処理 開始 ===');
  await openKeirisyoriScreenA(I, classMemberPageShimamura);
  await fillKeirisyoriScreenB(I, input);
  I.say('=== 経理ビューA/B 処理 終了 ===');
}

module.exports = {
  KEIRI_SCREEN_B_LOCATORS,
  runRegistrationFlow,
  openKeirisyoriScreenA,
  fillKeirisyoriScreenB,
  confirmKeirisyoriScreenE,
  executeTaikai
};
