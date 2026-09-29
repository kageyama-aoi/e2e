/**
 * @fileoverview shimamura 売掛金検索テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果エリアに1件以上表示される
 * - 基準日＋姓で絞り込み → 該当会員番号が結果に表示される
 *
 * **データソース**
 * - `data/shimamura/urikakekin_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario    : シナリオラベル（必須）
 * - query_date  : 基準日（必須。未入力だと画面がエラーになる）（任意）
 * - last_name   : 姓（任意）
 * - first_name  : 名（任意）
 * - school_id   : 店舗（select の表示名）（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('urikakekin_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('売掛金検索');

Before(beforeShimamura);

Data(csvData).Scenario('売掛金で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToUrikakekinPage();

  const hasCondition = current.query_date || current.last_name || current.first_name || current.school_id;
  if (hasCondition) ichiranPageShimamura.fillUrikakekinSearchConditions(current);

  ichiranPageShimamura.clickUrikakekinSearchAndWait();
  I.saveScreenshotWithTimestamp('urikakekin_ichiran_search', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyUrikakekinRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyUrikakekinResultsExist();
  }
});
