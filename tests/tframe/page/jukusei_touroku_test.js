/**
 * @fileoverview 受講生登録テスト
 *
 * **テスト内容**
 * - 管理者ログイン後、受講生登録画面でフォームを入力して新規登録
 *
 * **データソース**
 * - `data/tframe/jukusei_touroku_data.csv`
 *
 * **CSV カラム一覧**
 * - 必須: lastName, firstName
 * - 任意: lastNameFurigana, firstNameFurigana, phone1Number, gender,
 *         birthdateYear, birthdateMonth, birthdateDay, email1,
 *         idnumber, personStatus, school_area_id, school_branch_id, enrollDate,
 *         primaryAddressPostalcode, primaryAddressStreet, primaryAddressKana, description
 * - 請求方法: bankPaymentType（"" =設定なし, 1=口座振替, 2=手続き不備, 3=現金, 4=Web申込）
 *   - 口座振替（1）のみ追加必須: bankCode（4桁）, bankBranchCode（3桁）, bankAccountNo, bankAccountName（カナ）
 *   - bankName / bankBranchName は AJAX 自動補完のため CSV 不要
 *   - bankAccountType: 1=普通（default）, 2=当座
 */

const { loadCsvWithProfile, withScenarioLabel, updateCsvIdnumber } = require('../../../support/utils');

const csvData = withScenarioLabel(
  loadCsvWithProfile('jukusei_touroku_data', 'tframe'),
  (row) => `${row.lastName} ${row.firstName}`
);

Feature('受講生登録');

Data(csvData).Scenario('管理者ログイン後に受講生を新規登録できる @admin', async ({ I, jukuseiPage, loginKannrisyaPage, current }) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  jukuseiPage.navigateToRegisterPage();
  jukuseiPage.fillRegistrationForm(current);
  I.saveScreenshotWithTimestamp('jukusei_touroku_input', true);

  const usedId = await jukuseiPage.submitAndVerifyWithIdRetry(current.lastName, current.idnumber);
  updateCsvIdnumber('jukusei_touroku_data', 'tframe', current.idnumber, usedId);
  I.saveScreenshotWithTimestamp('jukusei_touroku_saved', true);
});
