'use strict';

/**
 * 退会処理（受講生詳細 → 個人情報１ → 退会処理 → 最終在籍年月を入れて更新）。
 * 初回登録テスト・月謝一括作成準備・退会テストが共通で使う（#300 で SyokaiFlowPage から切り出し）。
 */

const { logScreenUrl } = require('../../../support/utils');
const { toggleGroupmenu } = require('../../../support/shimamura/utils');
const { TIMEOUTS } = require('../../../support/shimamura/constants');
const { KEIRI_SUBMENU, navigateToKeirisyoriView } = require('./KeiriViewSteps');

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

async function executeTaikai(I, classMemberPageShimamura, { taikaiYear, taikaiMonth, recordId }) {
  const label = `${taikaiYear}${taikaiMonth}`;
  I.say(`【退会処理】最終在籍年月 ${taikaiYear}/${taikaiMonth} を設定`);
  I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);
  await toggleGroupmenu(I, { icon_id: KEIRI_SUBMENU.icon_id, menuname: KEIRI_SUBMENU.groupName });
  await classMemberPageShimamura.clickSubMenuLink('受講生詳細', '個人情報１');
  I.click('退会処理');

  await fillTaikaiFormAndSubmit(I, { taikaiYear, taikaiMonth });

  I.say('【退会後確認】経理ビューへ遷移');
  await navigateToKeirisyoriView(I, classMemberPageShimamura, { recordId });
  I.waitForElement(locate('body').withText('クラス追加/更新する'), TIMEOUTS.SCREEN);
  await logScreenUrl(I, '退会後_経理ビュー');
  I.saveScreenshot(`keiri_after_taikai_${label}.png`, true);
}

module.exports = {
  fillTaikaiFormAndSubmit,
  executeTaikai,
};
