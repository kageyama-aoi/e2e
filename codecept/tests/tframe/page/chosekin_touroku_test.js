/**
 * @fileoverview 調整金登録テスト
 *
 * **テスト内容**
 * - 管理者ログイン後、調整金登録画面でフォームを入力して新規登録
 *
 * **データソース**
 * - `data/tframe/chosekin_touroku_data.csv`
 *
 * **CSV カラム一覧**
 * - すべて必須: school_area_id, school_branch_id, fromDatetime, keijoubi, shareiKomoku, houshugaku
 *
 * **注意**
 * - school_area_id / school_branch_id / shareiKomoku はドロップダウンの実際の値を CSV に設定すること
 *   （culture_beta 環境でフォームを開いて選択肢を確認）
 */

const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('chosekin_touroku_data', 'tframe'),
  (row) => `${row.fromDatetime} ${row.houshugaku}円`
);

Feature('調整金登録');

Data(csvData).Scenario('管理者ログイン後に調整金を新規登録できる @admin', async ({ I, loginKannrisyaPage, chosekinPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  chosekinPage.navigateToRegisterPage();
  chosekinPage.fillRegistrationForm(current);
  I.saveScreenshotWithTimestamp('chosekin_touroku_input', true);

  await chosekinPage.submitAndVerifyRegistration('調整金詳細');
  I.saveScreenshotWithTimestamp('chosekin_touroku_saved', true);
});
