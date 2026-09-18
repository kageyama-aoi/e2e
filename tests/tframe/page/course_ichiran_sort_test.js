/**
 * @fileoverview コース一覧 列ヘッダソート検証テスト（#223・一覧ソート検証の代表画面）
 *
 * **テスト内容**（ログインは1回。CSV の全ケースを同じセッションで順に検証する）
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
 * - name, code, courseCategory, nendoYear, school_area_id, school_branch_id: 絞り込み（任意・空欄はスキップ）
 *   - プルダウンは値（例: `a1`）と表示名（例: `関東`）のどちらでも指定できる
 *   - エリア・校舎が空欄なら「すべて」で検索する（初期値の東京校舎に絞られない）
 *   - 第1キーを全行同値にする絞り込み（例: 年度で絞って年度ソート）なら第2キーを全行で検証できる
 *
 * **注意**
 * - 検証対象は1ページ目（15件）のみ。ページ送りはしない。
 * - ケースごとに一覧を開き直して検索条件を全クリアする（前ケースの条件を持ち越さない）。
 * - 並び順の違反は全ケース分を集めて最後にまとめて失敗させる（1件目の違反で残りを打ち切らない）。
 * - 文字列の並びはコードポイント順（DB のバイナリ照合）として判定する（support/tframe/sortVerify.js）。
 */
const assert = require('assert');
const { loadCsvWithProfile } = require('../../../support/utils');
const { findSortViolations } = require('../../../support/tframe/sortVerify');

const cases = loadCsvWithProfile('course_ichiran_sort_data', 'tframe');

Feature('コース一覧 ソート検証');

Scenario('列ヘッダソートで第1キー・第2キーの順に並ぶ（CSV全ケース） @admin', async ({ I, coursePage, loginKannrisyaPage }) => {
  const { columns, secondary } = coursePage.sortSpec;
  cases.forEach((c) => assert.ok(columns[c.sortKey], `[${c.scenario}] sortSpec に未定義の列キー: ${c.sortKey}`));

  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  const failures = [];

  // 画面のソート可能列が sortSpec と一致するか（仕様ドリフト検知）
  coursePage.navigateToListPage();
  coursePage.resetSearchConditions();
  coursePage.clickSearchAndWait();
  await coursePage.verifyListRowsExist();
  const sortable = await coursePage.grabSortableColumnKeys();
  if ([...sortable].sort().join() !== Object.keys(columns).sort().join()) {
    failures.push(`[ソート可能列] 画面 [${sortable.join(', ')}] が sortSpec [${Object.keys(columns).join(', ')}] と不一致`);
  }

  for (const c of cases) {
    I.say(`===== ${c.scenario}（${c.sortKey} ${c.sortDir}） =====`);
    coursePage.navigateToListPage();
    coursePage.resetSearchConditions();
    coursePage.fillSearchConditions(c);
    coursePage.clickSearchAndWait();
    await coursePage.verifyListRowsExist();

    await coursePage.sortByColumnKey(c.sortKey, c.sortDir);
    const rows = await coursePage.grabResultRowsByKey();
    I.saveScreenshotWithTimestamp(`course_ichiran_sort_${c.sortKey}_${c.sortDir}`, true);

    if (rows.length < 2) {
      failures.push(`[${c.scenario}] 並び順を検証するには2件以上必要（取得 ${rows.length} 件）`);
      continue;
    }
    const { violations, tiePairs } = findSortViolations(rows, {
      key: c.sortKey, type: columns[c.sortKey], dir: c.sortDir, secondary,
    });
    I.say(`${rows.length} 件を検証（第1キー同値で第2キーを判定したペア: ${tiePairs}）→ ${violations.length ? 'NG' : 'OK'}`);
    violations.forEach((v) => failures.push(`[${c.scenario}] ${v}`));
  }

  assert.strictEqual(failures.length, 0, `ソート検証の失敗 ${failures.length} 件:\n${failures.join('\n')}`);
});
