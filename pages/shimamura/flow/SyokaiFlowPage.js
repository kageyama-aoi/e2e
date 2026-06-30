'use strict';

const { logScreenUrl } = require('../../../support/utils');
const {
  toggleGroupmenu,
  verifyNavigationByUrlChange,
  clickCheckboxByLabelOrName,
  verifyCheckboxCheckedByLabelOrName,
  verifyValidationErrors
} = require('../../../support/shimamura/utils');
const { TIMEOUTS } = require('../../../support/shimamura/constants');
const { prepareInput, buildExecutionPlan } = require('../../../support/shimamura/syokai_helpers');

const KEIRI_SCREEN_B_LOCATORS = {
  textbox: { keiyaku_date: '#contract_dateclass_operation', kaishi_date: '#start_dateclass_operation', class_name: '#course_name' },
  pulldown: { area: '#AN_1_area_id', tenpo: '#school_id', couse_category: '#course_category', remaining_classes: '#remaining_times' },
  checkbox: { mid_month: '#ltd_mid_month' },
  button: { class_select: '#course_popup_popup_button', label_class_set: 'クラス適用', label_course_set: 'コース料金設定', label_tran_set: '売上計上する' },
  screen: { name: '受講生詳細' },
  error: { container: '#top_err_info_msg_div' }
};

async function fillClassSearchForm(I, locators, className, options) {
  I.say('【クラス選択】検索条件入力');
  I.retry({ retries: 5, minTimeout: 200 }).switchToNextTab();
  I.waitForElement(locators.pulldown.area, TIMEOUTS.SCREEN);
  I.fillField(locators.textbox.class_name, className);
  I.selectOption(locators.pulldown.couse_category, options.couse_category);
  I.selectOption(locators.pulldown.area, options.area);
  I.selectOption(locators.pulldown.tenpo, options.tenpo);
}

async function fillAccountingDates(I, locators, dates) {
  I.say('【経理日付入力】契約日・開始日');
  I.waitForEnabled(locators.textbox.keiyaku_date, TIMEOUTS.ENABLED);
  I.fillField(locators.textbox.keiyaku_date, dates.keiyaku_date);
  I.fillField(locators.textbox.kaishi_date, dates.kaishi_date);

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
      await ShouldBeOnClassSelectPopup(I, locators, input.class_name01, input.course_category);
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

async function ShouldBeOnStudentGroup(I, classMemberPageShimamura) {
  I.say('【画面遷移】候補生検索 メニュー');
  await toggleGroupmenu(I, { icon_id: 'submenu__candidates_grp_sub', menuname: '候補生' });
  await classMemberPageShimamura.clickSubMenuLink('候補生検索', '候補生検索');
  await logScreenUrl(I, '候補生検索ページ');
}

async function ShouldBeOnKouhoseiList(I, last_name) {
  const S = {
    field: { lastName: 'last_name' },
    button: { search: '検索' },
    result: { list: '.listViewTdLinkS1', link: 'a.listViewTdLinkS1' }
  };
  I.say('【候補生検索】一覧表示＆検索実行');
  I.waitForElement(locate('body').withText('候補生一覧'), TIMEOUTS.SCREEN);
  I.fillField(S.field.lastName, last_name);
  I.click(S.button.search);
  I.waitForElement(S.result.list, TIMEOUTS.RESULT);
  await logScreenUrl(I, '候補生一覧');
  const student_name = await I.grabTextFrom(S.result.link);
  I.click(locate(S.result.list));
  I.say(`link_: ${student_name}`);
  return student_name;
}

async function ShouldBeOnKouhouseiDetail(I, student_name) {
  I.say('【候補生詳細】受講生へ移動');
  I.waitForElement(locate('body').withText('候補生詳細'), TIMEOUTS.SCREEN);
  await logScreenUrl(I, '候補生詳細');
  const idnumber = await I.grabTextFrom('#td_idnumber');
  I.say(`受講生情報: ${idnumber}_${student_name}`);
  I.click('受講生へ移動');
}

async function ShouldBeOnKeirisyoriScreenA(I, classMemberPageShimamura) {
  const S = {
    submenu: {
      icon_id: 'submenu__detailviews_sub',
      groupName: '閲覧/登録・経理ビュー',
      linkName: '受講生登録・経理ビュー（個人）'
    },
    button: { addUpdateClass: 'クラス追加/更新する' }
  };
  I.say('【画面遷移】受講生登録・経理ビュー');
  I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);
  await toggleGroupmenu(I, { icon_id: S.submenu.icon_id, menuname: S.submenu.groupName });
  await classMemberPageShimamura.clickSubMenuLink(S.submenu.linkName, S.submenu.linkName);
  await logScreenUrl(I, '受講生詳細');
  I.waitForElement(locate('body').withText(S.button.addUpdateClass), TIMEOUTS.SCREEN);
  I.click(S.button.addUpdateClass);
}

async function ShouldBeOnClassSelectPopup(I, parentLocators, class_name01, course_category) {
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
  I.click(locate(SS.result.link));
}

async function ShouldBeOnKeirisyoriScreenB(I, {
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

async function ShouldBeOnKeirisyoriScreenE(I) {
  I.say('【確認完了】経理ビューへ戻る');
  await logScreenUrl(I, '経理ビューE');
  await verifyNavigationByUrlChange(I, 5, 'DWConfirmCarteKeiri_AN', '確認完了（経理ビューへ）');
  await logScreenUrl(I, '経理ビューA');
}

async function ShouldBeOnTaikai(I, classMemberPageShimamura, { taikaiYear, taikaiMonth }) {
  I.say('【退会処理】最終在籍年月の入力');
  I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);
  await toggleGroupmenu(I, { icon_id: 'submenu__detailviews_sub', menuname: '閲覧/登録・経理ビュー' });
  await classMemberPageShimamura.clickSubMenuLink('受講生詳細', '個人情報１');
  I.click('退会処理');
  await logScreenUrl(I, '退会処理');
  I.executeScript(([year, month]) => {
    document.querySelector('#final_enrollment_year').value = year;
    document.querySelector('#final_enrollment_month').value = month;
  }, [taikaiYear, taikaiMonth]);
}

async function runRegistrationFlow(I, classMemberPageShimamura, input) {
  I.say('【管理メニュー】受講生 → 受講生登録');
  await classMemberPageShimamura.navigateToAdminTab(I, '受講生', '受講生登録');
  I.say('=== 候補生検索 開始 ===');
  await ShouldBeOnStudentGroup(I, classMemberPageShimamura);
  const student_name = await ShouldBeOnKouhoseiList(I, input.lastName);
  await ShouldBeOnKouhouseiDetail(I, student_name);
  I.say('=== 候補生検索 終了 ===');
  I.say('=== 経理ビューA/B 処理 開始 ===');
  await ShouldBeOnKeirisyoriScreenA(I, classMemberPageShimamura);
  await ShouldBeOnKeirisyoriScreenB(I, input);
  I.say('=== 経理ビューA/B 処理 終了 ===');
}

module.exports = {
  KEIRI_SCREEN_B_LOCATORS,
  runRegistrationFlow,
  ShouldBeOnKeirisyoriScreenA,
  ShouldBeOnKeirisyoriScreenB,
  ShouldBeOnKeirisyoriScreenE,
  ShouldBeOnTaikai
};
