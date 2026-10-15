/**
 * @fileoverview tframe 一覧ソート検証の共通ランナー（#225）
 *
 * 1ログインのまま CSV の全ケースを順に回し、ケースごとに
 *   一覧を開く（openCase）→ 列ヘッダでソート → 1ページ目を抽出 → 並び順を検証
 * を行う。違反は全ケース分を集めて最後にまとめて失敗させる（途中で打ち切らない）。
 * 最初に「画面のソート可能列が sortSpec と一致するか」も確認する（仕様ドリフト検知）。
 *
 * 画面ごとに用意するのは次の3つだけ:
 * - Page Object の `createSortableTable({...})`（枠・列の型・第2キー）
 * - 一覧を開いて検索するまでの手順（openCase）
 * - CSV（scenario, sortKey, sortDir ＋ 画面固有の絞り込み列）
 */

const assert = require('assert');
const { findSortViolations } = require('./sortVerify');

/**
 * @param {CodeceptJS.I} I
 * @param {object} opts
 * @param {object} opts.table - `createSortableTable` の戻り値
 * @param {Array<Object>} opts.cases - CSV 行（scenario / sortKey / sortDir ＋ 絞り込み列）
 * @param {function(Object): Promise<void>} opts.openCase - 1ケース分の一覧を表示するまでの手順（ログイン後に呼ばれる）
 */
async function runSortCases(I, { table, cases, openCase }) {
  const { columns, secondary } = table.sortSpec;
  if (cases.length === 0) {
    I.say(`【${table.label}】このプロファイルのソート検証ケースが未定義のためスキップ`);
    return;
  }
  cases.forEach((c) => assert.ok(columns[c.sortKey], `[${c.scenario}] sortSpec に未定義の列キー: ${c.sortKey}`));
  if (!secondary) I.say(`【${table.label}】第2キーなしの画面のため第1キーのみ検証`);

  const failures = [];

  for (const [i, c] of cases.entries()) {
    I.say(`===== ${c.scenario}（${c.sortKey} ${c.sortDir}） =====`);
    await openCase(c);
    const count = await table.waitForRows();

    if (i === 0) {
      const sortable = await table.grabSortableKeys();
      if ([...sortable].sort().join() !== Object.keys(columns).sort().join()) {
        failures.push(`[ソート可能列] 画面 [${sortable.join(', ')}] が sortSpec [${Object.keys(columns).join(', ')}] と不一致`);
      }
    }
    if (count < 2) {
      failures.push(`[${c.scenario}] 並び順を検証するには2件以上必要（表示 ${count} 件）`);
      continue;
    }

    await table.sortBy(c.sortKey, c.sortDir);
    const rows = await table.grabRows();
    I.saveScreenshotWithTimestamp(`sort_${c.sortKey}_${c.sortDir}`, true);

    const { violations, tiePairs, emptyRows } = findSortViolations(rows, {
      key: c.sortKey, type: columns[c.sortKey], dir: c.sortDir, secondary,
    });
    I.say(`${rows.length} 件を検証（第2キー判定ペア: ${tiePairs} / 空値で対象外: ${emptyRows}）→ ${violations.length ? 'NG' : 'OK'}`);
    violations.forEach((v) => failures.push(`[${c.scenario}] ${v}`));
  }

  assert.strictEqual(failures.length, 0, `【${table.label}】ソート検証の失敗 ${failures.length} 件:\n${failures.join('\n')}`);
}

module.exports = { runSortCases };
