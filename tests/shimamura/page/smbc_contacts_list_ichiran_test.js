/**
 * @fileoverview shimamura 債権買取状態一覧検索テスト
 *
 * **テスト内容**
 * - 空条件で検索 → 結果に1件以上表示される（既定の店舗 TESTモール太田店で絞られた状態）
 * - 姓で絞り込み → 該当者の会員番号が結果に表示される（結果のリンクは会員番号）
 *
 * **データソース**
 * - `data/shimamura/smbc_contacts_list_ichiran_search_data.csv`
 *
 * **CSV カラム一覧**
 * - scenario    : シナリオラベル（必須）
 * - last_name   : 姓（任意）
 * - idnumber    : 会員番号（任意）
 * - school_id   : 店舗（select の表示名）（任意）
 * - expectedName: 結果確認用テキスト（空の場合は「結果あり」のみ確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');

const csvData = withScenarioLabel(
  loadCsvWithProfile('smbc_contacts_list_ichiran_search_data', 'shimamura'),
  (row) => row.scenario
);

Feature('債権買取状態一覧検索');

Before(beforeShimamura);

Data(csvData).Scenario('債権買取状態一覧で検索できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  await ichiranPageShimamura.navigateToSmbcContactsListPage();

  const hasCondition = current.last_name || current.idnumber || current.school_id;
  if (hasCondition) ichiranPageShimamura.fillSmbcContactsListSearchConditions(current);

  ichiranPageShimamura.clickSmbcContactsListSearchAndWait();
  I.saveScreenshotWithTimestamp('smbc_contacts_list_ichiran_search', true);

  if (current.expectedName) {
    ichiranPageShimamura.verifySmbcContactsListRecordInResults(current.expectedName);
  } else {
    ichiranPageShimamura.verifySmbcContactsListResultsExist();
  }
});
