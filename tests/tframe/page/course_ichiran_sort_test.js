/**
 * @fileoverview コース一覧 列ヘッダソート検証テスト（#223・一覧ソート検証の代表画面）
 *
 * **テスト内容**
 * - エリア・校舎を「すべて」にして検索（確実にデータを出す）
 * - 列ヘッダの矢印で指定列を昇順/降順にソート
 * - 1ページ目の行が「第1キー＝指定列（指定方向）→ 第2キー＝画面の裏設定（レコードID昇順）」
 *   の順に並んでいることを検証
 * - 画面のソート可能列が Page Object の `sortSpec` と一致すること（仕様ドリフト検知）
 *
 * **データソース**
 * - `data/tframe/course_ichiran_sort_data.csv`
 *
 * **CSV カラム**
 * - scenario: シナリオラベル（必須）
 * - sortKey: ソート列キー（`th#swDataList[キー]` のキー。name / courseCategory / nendo）
 * - sortDir: asc / desc
 * - courseCategory, nendoYear: 絞り込み（任意）。第1キーを全行同値にすると第2キーを全行で検証できる
 *
 * **注意**
 * - 検証対象は1ページ目（15件）のみ。ページ送りはしない。
 * - 文字列の並びはコードポイント順（DB のバイナリ照合）として判定する（support/tframe/sortVerify.js）。
 */
const assert = require('assert');
const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { findSortViolations } = require('../../../support/tframe/sortVerify');

const csvData = withScenarioLabel(
  loadCsvWithProfile('course_ichiran_sort_data', 'tframe'),
  (row) => row.scenario
);

Feature('コース一覧 ソート検証');

Scenario('ソート可能列が sortSpec の定義と一致する @admin', async ({ coursePage, loginKannrisyaPage }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  coursePage.navigateToListPage();
  coursePage.widenAreaBranchScope();
  coursePage.clickSearchAndWait();
  await coursePage.verifyListRowsExist();

  const actual = await coursePage.grabSortableColumnKeys();
  assert.deepStrictEqual(
    [...actual].sort(),
    Object.keys(coursePage.sortSpec.columns).sort(),
    `画面のソート可能列 [${actual.join(', ')}] が sortSpec と一致しません`
  );
});

Data(csvData).Scenario('列ヘッダソートで第1キー・第2キーの順に並ぶ @admin', async ({ I, coursePage, loginKannrisyaPage, current }) => {
  const type = coursePage.sortSpec.columns[current.sortKey];
  assert.ok(type, `sortSpec に未定義の列キー: ${current.sortKey}`);

  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  coursePage.navigateToListPage();
  coursePage.widenAreaBranchScope();
  coursePage.fillSearchConditions(current);
  coursePage.clickSearchAndWait();
  await coursePage.verifyListRowsExist();

  await coursePage.sortByColumnKey(current.sortKey, current.sortDir);
  const rows = await coursePage.grabResultRowsByKey();
  I.saveScreenshotWithTimestamp('course_ichiran_sort', true);

  assert.ok(rows.length >= 2, `並び順を検証するには2件以上必要（取得 ${rows.length} 件）`);

  const { violations, tiePairs } = findSortViolations(rows, {
    key: current.sortKey,
    type,
    dir: current.sortDir,
    secondary: coursePage.sortSpec.secondary,
  });
  I.say(`${rows.length} 件を検証（第1キー同値で第2キーを判定したペア: ${tiePairs}）`);

  assert.strictEqual(violations.length, 0, `並び順の違反:\n${violations.join('\n')}`);
});
