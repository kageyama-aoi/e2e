'use strict';

/**
 * 候補生 → 受講生への昇格（候補生検索 → 姓で検索 → 「受講生へ移動」）。
 * 初回登録・月謝一括作成準備・発表会準備など、受講生を1人用意するフローが共通で使う（#300 で SyokaiFlowPage から切り出し）。
 */

const { logScreenUrl } = require('../../../support/utils');
const { toggleGroupmenu, fillTextFieldsByName } = require('../../../support/shimamura/utils');
const { TIMEOUTS, SELECTORS } = require('../../../support/shimamura/constants');

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

module.exports = {
  navigateToStudentGroup,
  navigateToKouhosei,
};
