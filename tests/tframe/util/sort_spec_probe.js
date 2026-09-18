/**
 * @fileoverview 一覧ソート検証の調査ツール（#226）— テストスイートには含まれない（_test.js 非末尾）
 *
 * 1つの一覧を実機で開き、ソート可能な全列を昇順・降順に並べ替えて1ページ目を採取し、
 * `createSortableTable` に書く sortSpec の案（列の型・第2キー候補）を出力する。
 * 推定は1ページ分の標本に基づくので、最後は採取した行を目視して決めること。
 *
 * **起動例**（環境変数で対象を指定）
 * ```
 * # 一覧画面（検索条件を全クリアして検索してから採取）
 * SORT_PROBE_ROUTE=staff/sw/_default npx codeceptjs run tests/tframe/util/sort_spec_probe.js --profile tframe.culture_beta
 * # 詳細画面のタブ内一覧
 * SORT_PROBE_ROUTE=course/dw/_default SORT_PROBE_RECORD=<レコードID> SORT_PROBE_TAB=#student \
 *   SORT_PROBE_PANEL=studentSubpanel npx codeceptjs run tests/tframe/util/sort_spec_probe.js --profile tframe.culture_beta
 * ```
 * - SORT_PROBE_ROUTE : `r=` の値（例: `staff/sw/_default`。`?` 以降の追加パラメータは `&` で続けて書く）
 * - SORT_PROBE_RECORD: 詳細画面のレコードID（任意）
 * - SORT_PROBE_TAB   : 開くタブの href（任意。例: `#student`）
 * - SORT_PROBE_PANEL : タブ内一覧のパネル名（任意。例: `studentSubpanel`。省略時は一覧画面の枠）
 *
 * **出力**: コンソールに推定結果、`output/sort_probe/<route>_<日時>.json` に採取した全行と推定結果
 */
const fs = require('fs');
const path = require('path');
const repoRoot = require('../../../support/repoRoot');
const { inferSortSpec } = require('../../../support/tframe/sortVerify');
const { createSortableTable, subpanelContainer, LIST_CONTAINER } = require('../../../pages/tframe/_common/SortableTable');
const { resetSearchForm } = require('../../../pages/tframe/_common/IchiranSearchMixin');

const ROUTE = process.env.SORT_PROBE_ROUTE || '';
const RECORD = process.env.SORT_PROBE_RECORD || '';
const TAB = process.env.SORT_PROBE_TAB || '';
const PANEL = process.env.SORT_PROBE_PANEL || '';

Feature('一覧ソート調査ツール');

Scenario('ソート可能列を全方向で採取して sortSpec を推定する', async ({ I, loginKannrisyaPage }) => {
  if (!ROUTE) throw new Error('SORT_PROBE_ROUTE を指定してください（例: staff/sw/_default）');

  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  const [r, ...extra] = ROUTE.split('&');
  let url = `${process.env.BASE_URL}index.php?r=${encodeURIComponent(r)}${extra.length ? '&' + extra.join('&') : ''}`;
  if (RECORD) url += `&record=${encodeURIComponent(RECORD)}`;
  I.amOnPage(url);

  if (TAB) {
    I.waitForElement(`a[href="${TAB}"]`, 15);
    I.executeScript((h) => document.querySelector(`a[href="${h}"]`).click(), TAB);
  } else {
    I.waitForElement('#swSearchButton', 15);
    resetSearchForm();
    I.click('#swSearchButton');
  }

  const table = createSortableTable({
    label: `調査 ${ROUTE}`,
    container: PANEL ? subpanelContainer(PANEL) : LIST_CONTAINER,
    columns: {},
    secondary: null,
  });
  const count = await table.waitForRows();
  const pageCount = await I.executeScript((sel) => (document.querySelector(`${sel} .page-count`) || {}).textContent || '', table.container);
  const keys = await table.grabSortableKeys();
  I.say(`表示 ${count} 件 ${pageCount} / ソート可能列: ${keys.join(', ') || '(なし)'}`);

  const samples = {};
  for (const key of keys) {
    for (const dir of ['asc', 'desc']) {
      await table.sortBy(key, dir);
      samples[`${key}|${dir}`] = await table.grabRows();
    }
  }
  const result = inferSortSpec(samples);

  I.say(`推定 columns: ${JSON.stringify(result.columns)}`);
  if (result.secondaryCandidates.length === 0) {
    I.say('第2キー候補: なし（第2キーの無い画面か、標本に同値がない）');
  } else {
    result.secondaryCandidates.slice(0, 5).forEach((c) =>
      I.say(`第2キー候補: ${c.key} ${c.dir}（型 ${c.type} / 同値ペア ${c.pairs} / 裏付け ${c.strictPairs}）`));
  }

  const outDir = path.join(repoRoot, 'output', 'sort_probe');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T-]/g, '');
  const outPath = path.join(outDir, `${ROUTE.replace(/[^\w]+/g, '_')}${TAB ? TAB.replace('#', '_') : ''}_${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ route: ROUTE, record: RECORD, tab: TAB, count, pageCount, ...result, samples }, null, 1));
  I.say(`採取結果 → ${outPath}`);
});
