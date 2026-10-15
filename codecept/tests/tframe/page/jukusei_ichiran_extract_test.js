/**
 * @fileoverview 受講生一覧 検索結果抽出 POC（#194）
 *
 * **テスト内容**
 * - 検索条件（任意）とソートキー（任意）を指定して受講生一覧を検索
 * - 検索結果テーブル（1ページ目のみ・ページ送りなし）を抽出
 * - `output/tframe/jukusei_ichiran_<scenario>_<timestamp>.csv` に保存
 * - 1件以上抽出できたことだけ検証
 *
 * **データソース**
 * - `data/tframe/jukusei_ichiran_extract_data.csv`
 *
 * **CSV カラム**
 * - scenario: シナリオラベル（必須）
 * - lastName, firstName, idnumber, personStatus, school_area_id, school_branch_id: 検索条件（任意）
 * - sortKey: ソートする列のヘッダー表示名（任意。juku_test は英語表記 例: `Id Number` / `Updated At`）
 * - sortDir: `asc` / `desc`（省略時 asc）
 *
 * **注意**
 * - ソート列名は画面表示言語に依存する（juku_test = 英語）。
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const repoRoot = require('../../../support/repoRoot');
const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('jukusei_ichiran_extract_data', 'tframe'),
  (row) => row.scenario
);

const BOM = String.fromCharCode(0xfeff); // Excel で開いても文字化けしないように先頭へ付与

/** 行オブジェクト配列を CSV 文字列にする（全項目ダブルクオート） */
function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const lines = [headers.map(esc).join(',')];
  for (const row of rows) lines.push(headers.map((h) => esc(row[h])).join(','));
  return lines.join('\r\n');
}

Feature('受講生一覧 検索結果抽出');

Data(csvData).Scenario('受講生一覧の検索結果を抽出してCSV保存する @admin', async ({ I, jukuseiPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  jukuseiPage.navigateToListPage();

  const hasCondition = current.lastName || current.firstName || current.idnumber ||
    current.personStatus || current.school_area_id || current.school_branch_id;
  if (hasCondition) jukuseiPage.fillSearchConditions(current);

  jukuseiPage.clickSearchAndWait();

  if (current.sortKey) {
    await jukuseiPage.sortByColumn(current.sortKey, current.sortDir || 'asc');
  }

  const rows = await jukuseiPage.grabResultRows();
  I.say(`抽出 ${rows.length} 件（列: ${rows.length ? Object.keys(rows[0]).join(' / ') : '-'}）`);

  const safeScenario = String(current.scenario).replace(/[\\/:*?"<>|\s]/g, '_');
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '');
  const outPath = path.join(repoRoot, 'output', 'tframe', `jukusei_ichiran_${safeScenario}_${stamp}.csv`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, BOM + toCsv(rows), 'utf-8');
  I.say(`保存 → ${outPath}`);

  I.saveScreenshotWithTimestamp('jukusei_ichiran_extract', true);

  assert.ok(rows.length > 0, '検索結果が1件以上抽出できること');
});
