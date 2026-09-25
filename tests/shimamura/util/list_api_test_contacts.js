'use strict';

/**
 * shimamura 候補生テストデータの一覧ランナー（読み取りのみ・変更しない）
 *
 * このファイルは通常のテストスイートには含まれない（`_test.js` 非末尾）。
 * 検証で作った候補生（姓が指定プレフィックスで始まるもの）を検索し、
 * 姓名と record UUID をログに出すだけ。データは一切変更しない。
 *
 * 実行例:
 *   npx codeceptjs run ./tests/shimamura/util/list_api_test_contacts.js --profile shimamura.testgcp
 *
 * 検索は姓の完全一致のため、探したい姓は `LAST_NAMES` に列挙する
 * （日本語は環境変数で渡すと文字化けしうるのでソースに持つ）。
 */

const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { SELECTORS, TIMEOUTS } = require('../../../support/shimamura/constants');

/** 検証で作ったテストデータの姓 */
const LAST_NAMES = ['API調査0924', 'API登録0924', 'API登録0925'];

Feature('shimamura 候補生テストデータの一覧');

Before(beforeShimamura);

Scenario('姓で候補生を検索して record UUID を出す', async ({ I, ichiranPageShimamura }) => {
  const all = [];

  for (const lastName of LAST_NAMES) {
    // 候補生一覧（contact_status=5）と受講生検索の両方を見る。
    // 登録時の送信内容に contact_status が含まれないため、どちらに入ったかを確かめる。
    for (const screen of ['候補生一覧', '受講生検索']) {
      I.say(`【一覧】${screen} / 姓「${lastName}」で検索（読み取りのみ）`);

      if (screen === '候補生一覧') {
        await ichiranPageShimamura.navigateToContactListPage();
        ichiranPageShimamura.fillContactListSearchConditions({ last_name: lastName });
      } else {
        await ichiranPageShimamura.navigateToStudentSearchPage();
        ichiranPageShimamura.fillStudentSearchConditions({ last_name: lastName });
      }
      // 0件でも先に進みたいので、結果リンクの出現を待つ共通メソッドは使わない
      I.click('input[name="search"]');
      I.wait(TIMEOUTS.TAB_SWITCH);

      const targets = await collectResults(I);
      I.say(`【一覧】${screen} /「${lastName}」: ${targets.length} 件`);
      targets.forEach((t, i) => I.say(`  ${i + 1}. ${t.label}  record=${t.recordId}`));
      all.push(...targets);
    }
  }

  I.say(`【一覧】合計 ${all.length} 件`);
  I.saveScreenshotWithTimestamp('CONTACT_LIST_API_TEST_DATA', true);
});

/**
 * 検索結果の一覧から record UUID と表示名を集める。
 * @param {CodeceptJS.I} I
 * @returns {Promise<Array<Object>>}
 */
async function collectResults(I) {
  return I.executeScript((linkSelector) => {
    const found = [];
    const seen = new Set();
    document.querySelectorAll(linkSelector).forEach((a) => {
      const matched = /[?&]record=([^&]+)/.exec(a.getAttribute('href') || '');
      if (!matched || seen.has(matched[1])) return;
      seen.add(matched[1]);
      const row = a.closest('tr');
      const cells = row
        ? Array.from(row.querySelectorAll('td')).map((td) => td.textContent.trim()).filter(Boolean)
        : [];
      found.push({ recordId: matched[1], label: cells.slice(0, 5).join(' / ') });
    });
    return found;
  }, `a${SELECTORS.RESULT_LINK}`);
}
