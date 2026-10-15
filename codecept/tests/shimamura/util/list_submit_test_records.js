'use strict';

/**
 * shimamura 動作確認データの一覧ランナー（読み取りのみ・変更しない）#238
 *
 * このファイルは通常のテストスイートには含まれない（`_test.js` 非末尾）。
 * フォーム送信版の動作確認ランナー（`*_by_submit_check.js`）が作ったデータを検索し、
 * 画面・表示名・module・record UUID をログに出すだけ。データは一切変更しない。
 * 消すときは、ここで出た行を delete_listed_test_records.js の TARGETS に書き写す。
 *
 * 実行例:
 *   npx codeceptjs run ./tests/shimamura/util/list_submit_test_records.js --profile shimamura.testgcp
 *
 * 一覧の検索欄は前方一致なので、検索語は頭の部分だけ書く（`%` は付けなくてよい。
 * testgcp で確認済み: 「月謝テスト」でも「月謝テスト%」でも同じ 15 件）。
 * 日付入りの姓（`送信登録MMDD` 等）も日付を書き足さずに拾える。
 * 日本語は環境変数で渡すと文字化けしうるので、検索語はソースに持つ。
 *
 * クラスは探せない。クラス一覧はコースと紐づいたクラスしか出さないため、
 * create_class_by_submit_check.js が作る紐づけ無しのクラスは一覧に現れない。
 * クラスは作成ランナーがログに出す record を控えて消す。
 * 発表会テスト（happyoukai_*）が作るコース・クラスは後続テストが使うので、ここでは探さない。
 */

const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { SELECTORS, TIMEOUTS } = require('../../../support/shimamura/constants');

/**
 * 探す画面と検索語。
 * - 受講生・候補生: 動作確認ランナーのテスト姓。`API登録` / `API調査` は #238 で改名する前の姓。
 *   `問合せテスト` は contact_register_test.js の姓（テスト内で削除するので、残っていたら削除に失敗した分）
 *   （問合せ登録で作ると受講生になるが、念のため候補生一覧も見る）
 * - コース: create_course_by_submit_check.js が作る名前
 * module は結果リンクの href から読む（受講生検索・候補生一覧の行には他の module のリンクも並ぶため、
 * 探したい module に絞る）。
 */
const SEARCHES = [
  { screen: '受講生検索', navKey: 'StudentSearch', coreKey: 'Student',       field: 'last_name', module: 'Student',     patterns: ['送信登録', 'API登録', 'API調査', '問合せテスト'] },
  { screen: '候補生一覧', navKey: 'ContactList',   coreKey: 'ContactList',   field: 'last_name', module: 'Student',     patterns: ['送信登録', 'API登録', 'API調査', '問合せテスト'] },
  { screen: 'コース一覧', navKey: 'CourseIchiran', coreKey: 'CourseIchiran', field: 'name',      module: 'ShimaCourse', patterns: ['E2E_UI版_', 'E2E_送信版_'] },
];

Feature('shimamura 動作確認データの一覧');

Before(beforeShimamura);

Scenario('動作確認で作ったデータを検索して module と record UUID を出す', async ({ I, ichiranPageShimamura }) => {
  const all = [];

  for (const { screen, navKey, coreKey, field, module, patterns } of SEARCHES) {
    for (const pattern of patterns) {
      I.say(`【一覧】${screen} / ${field}「${pattern}」で検索（読み取りのみ）`);
      await ichiranPageShimamura[`navigateTo${navKey}Page`]();
      ichiranPageShimamura[`fill${coreKey}SearchConditions`]({ [field]: pattern });
      // 0件でも先に進みたいので、結果リンクの出現を待つ共通メソッドは使わない
      I.click('input[name="search"]');
      I.wait(TIMEOUTS.TAB_SWITCH);

      const found = (await collectResults(I)).filter((t) => t.module === module);
      I.say(`【一覧】${screen} /「${pattern}」: ${found.length} 件`);
      found.forEach((t) => {
        // そのまま TARGETS に貼れる形で出す
        I.say(`  { module: '${t.module}', recordId: '${t.recordId}', label: '${t.label}' },`);
      });
      all.push(...found);
    }
  }

  I.say(`【一覧】合計 ${all.length} 件`);
  I.saveScreenshotWithTimestamp('SUBMIT_TEST_RECORDS', true);
});

/**
 * 検索結果の一覧から module・record UUID・表示名を集める。
 * @param {CodeceptJS.I} I
 * @returns {Promise<Array<{module: string, recordId: string, label: string}>>}
 */
async function collectResults(I) {
  return I.executeScript((linkSelector) => {
    const found = [];
    const seen = new Set();
    document.querySelectorAll(linkSelector).forEach((a) => {
      const href = a.getAttribute('href') || '';
      const record = /[?&]record=([^&]+)/.exec(href);
      if (!record || seen.has(record[1])) return;
      seen.add(record[1]);
      const module = (/[?&]module=([^&]+)/.exec(href) || [])[1] || '(不明)';
      const row = a.closest('tr');
      const cells = row
        ? Array.from(row.querySelectorAll('td')).map((td) => td.textContent.trim()).filter(Boolean)
        : [];
      found.push({ module, recordId: record[1], label: cells.slice(0, 5).join(' / ').replace(/'/g, '') });
    });
    return found;
  }, `a${SELECTORS.RESULT_LINK}`);
}
