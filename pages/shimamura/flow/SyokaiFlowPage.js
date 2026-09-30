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
const { TIMEOUTS, SELECTORS } = require('../../../support/shimamura/constants');
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

async function navigateToStudentGroup(I, classMemberPageShimamura) {
  I.say('【画面遷移】候補生検索 メニュー');
  await toggleGroupmenu(I, { icon_id: 'submenu__candidates_grp_sub', menuname: '候補生' });
  await classMemberPageShimamura.clickSubMenuLink('候補生検索', '候補生検索');
  await logScreenUrl(I, '候補生検索ページ');
}

const RESULT_LINK = `a${SELECTORS.RESULT_LINK}`;

// 会員番号重複エラーのとき、原因調査用に表示する SQL
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

// 候補生一覧へ移動し姓で検索、「受講生へ移動」で昇格する（受講生詳細に着いた状態で返る）。
// 候補を先頭から順に試し、昇格できない（URL が変わらない）候補はスキップして次を試みる。
// 会員番号重複エラーは DB 側の問題なので、確認用 SQL を添えて止める。
// 新規登録・月謝一括作成準備・発表会準備の候補生昇格はすべてこれを使う（#269 で簡易版を廃止）。
async function navigateToKouhosei(I, classMemberPageShimamura, lastName) {
  I.say('【候補生一覧】サイドバー → 候補生グループ → 候補生検索');
  await classMemberPageShimamura.navigateToAdminTab(I, '受講生', '受講生登録');
  await navigateToStudentGroup(I, classMemberPageShimamura);

  I.say(`【候補生一覧】姓 "${lastName}" で検索`);
  I.waitForElement(locate('body').withText('候補生一覧'), TIMEOUTS.SCREEN);
  fillTextFieldsByName(I, { last_name: lastName });
  I.click('検索');
  I.waitForElement(RESULT_LINK, TIMEOUTS.RESULT);
  await logScreenUrl(I, '候補生一覧');

  // 一覧に出ている全候補生のリンクを取り、昇格できない候補は次を試みる。
  // grabAttributeFrom は先頭1件しか返さないため、全件取れる grabAttributeFromAll を使う（#269。以前は常に1件だった）
  const hrefs = await I.grabAttributeFromAll(RESULT_LINK, 'href');
  const links = hrefs.filter(h => h?.startsWith('http'));
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

// 退会処理画面（#final_enrollment_year が表示された状態）にいることを前提に、
// 最終在籍年月の入力・全チェックボックス選択・更新ボタン押下・完了確認までを行う。
// 「退会処理画面への遷移方法」は呼び出し元ごとに異なりうる（新規登録直後の継続 / 会員番号検索など）ため、
// このフォーム操作部分だけを共通化している。
async function fillTaikaiFormAndSubmit(I, { taikaiYear, taikaiMonth }) {
  const label = `${taikaiYear}${taikaiMonth}`;
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
}

async function executeTaikai(I, classMemberPageShimamura, { taikaiYear, taikaiMonth }) {
  const label = `${taikaiYear}${taikaiMonth}`;
  I.say(`【退会処理】最終在籍年月 ${taikaiYear}/${taikaiMonth} を設定`);
  I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);
  await toggleGroupmenu(I, { icon_id: KEIRI_SUBMENU.icon_id, menuname: KEIRI_SUBMENU.groupName });
  await classMemberPageShimamura.clickSubMenuLink('受講生詳細', '個人情報１');
  I.click('退会処理');

  await fillTaikaiFormAndSubmit(I, { taikaiYear, taikaiMonth });

  I.say('【退会後確認】経理ビューへ遷移');
  await navigateToKeirisyoriView(I, classMemberPageShimamura);
  I.waitForElement(locate('body').withText('クラス追加/更新する'), TIMEOUTS.SCREEN);
  await logScreenUrl(I, '退会後_経理ビュー');
  I.saveScreenshot(`keiri_after_taikai_${label}.png`, true);
}

async function runRegistrationFlow(I, classMemberPageShimamura, input) {
  I.say('=== 候補生検索 開始 ===');
  await navigateToKouhosei(I, classMemberPageShimamura, input.lastName);
  I.say('=== 候補生検索 終了 ===');
  I.say('=== 経理ビューA/B 処理 開始 ===');
  await openKeirisyoriScreenA(I, classMemberPageShimamura);
  await fillKeirisyoriScreenB(I, input);
  I.say('=== 経理ビューA/B 処理 終了 ===');
}

module.exports = {
  navigateToKouhosei,
  KEIRI_SCREEN_B_LOCATORS,
  runRegistrationFlow,
  navigateToStudentGroup,
  navigateToKeirisyoriView,
  openKeirisyoriScreenA,
  fillKeirisyoriScreenB,
  confirmKeirisyoriScreenE,
  executeTaikai,
  fillTaikaiFormAndSubmit,
  resolveUnfinishedKeiriDataIfPresent
};
