/**
 * @fileoverview shimamura AFS会員番号検索検索テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果エリアに1件以上表示される
 * - カナ氏名で絞り込み → 該当者が結果の行に表示される（結果はリンクではなく行）
 *
 * **データソース**
 * - `data/shimamura/afs_member_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario     : シナリオラベル（必須）
 * - acsno        : AFS会員番号（任意）
 * - idnumber     : 会員番号（任意）
 * - card_kananame: カナ氏名（任意）
 * - expectedName : 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('afs_member_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('AFS会員番号検索検索');

Before(beforeShimamura);

Data(csvData).Scenario('AFS会員番号検索で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToAfsMemberSearchPage();

  const hasCondition = current.acsno || current.idnumber || current.card_kananame;
  if (hasCondition) ichiranPageShimamura.fillAfsMemberSearchConditions(current);

  ichiranPageShimamura.clickAfsMemberSearchAndWait();
  I.saveScreenshotWithTimestamp('afs_member_ichiran_search', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifyAfsMemberRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifyAfsMemberResultsExist();
  }
});
