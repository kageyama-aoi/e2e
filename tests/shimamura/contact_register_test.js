/**
 * @fileoverview shimamura 問合せ登録（候補生登録）E2E テスト
 *
 * **テスト内容**
 * - 正常系: 必須項目（姓・名・フリガナ）を入力して保存できる
 * - 異常系: 必須項目を空にして保存するとエラーが表示される
 *
 * **データソース**
 * - `data/shimamura/contact_register_data.csv`（正常系）
 * - `data/shimamura/contact_register_validation_errors.csv`（異常系）
 *
 * **パターン**: B（フォーム入力型・FlowPage なし）
 * **URL**: index.php?module=Student&action=EditView&contact_status=5&...
 */
const {
  loadCsvWithProfile,
  withScenarioLabel,
  parseExpectedErrors,
  setBusinessLabels,
  attachBusinessContext,
  attachErrorScreenshot
} = require('../../support/utils');
const { validateShimamuraEnv, verifyValidationErrors } = require('../../support/shimamura/utils');
const { TIMEOUTS } = require('../../support/shimamura/constants');

const CONTACT_REGISTER_URL = '/index.php?module=Student&action=EditView'
  + '&contact_status=5&return_module=Student&return_action=DetailView&from_mainmenu=true';

const S = {
  screen:  { name: '問合せ' },
  fields: {
    lastName:          'last_name',
    firstName:         'first_name',
    lastNameFurigana:  'last_name_furigana',
    firstNameFurigana: 'first_name_furigana',
    gender:            'select[name="gender"]',
    phoneMobile:        'phone_mobile',
    applicationDate:    'application_date',
    bankPaymentType:    'select[name="bank_payment_type"]',
    bankCode:           'bank_code',
    bankBranchCode:     'bank_branch_code',
    bankAccountNo:      'bank_account_no',
    bankAccountName:    'bank_account_name',
    acsno:              'acsno',
    acsnoCheck:         'acsno_check',
    expisDate:          'expis_date',
  },
  button: { save: 'input[name="save_button"]' },
  error:  { container: '#top_err_info_msg_div' },
};

const csvData = withScenarioLabel(
  loadCsvWithProfile('contact_register_data'),
  (row) => row.scenario
);

const validationErrorData = withScenarioLabel(
  loadCsvWithProfile('contact_register_validation_errors'),
  (row) => row.scenario
);

Feature('問合せ登録（候補生登録）');

Before(async ({ login, loginPageShimamura }) => {
  const tantousyaNumber = validateShimamuraEnv();
  await login('user');
  await loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);
});

async function navigateToContactRegister(I) {
  I.say('【問合せ登録】URL 直遷移');
  I.amOnPage(process.env.BASE_URL + CONTACT_REGISTER_URL);
  I.waitForElement(S.button.save, TIMEOUTS.SCREEN);
}

async function fillContactForm(I, data) {
  I.say('【問合せ登録】フォーム入力');
  if (data.last_name)           I.fillField(S.fields.lastName,          data.last_name);
  if (data.first_name)          I.fillField(S.fields.firstName,         data.first_name);
  if (data.last_name_furigana)  I.fillField(S.fields.lastNameFurigana,  data.last_name_furigana);
  if (data.first_name_furigana) I.fillField(S.fields.firstNameFurigana, data.first_name_furigana);
  if (data.gender)              I.selectOption(S.fields.gender,          data.gender);
  if (data.phone_mobile)        I.fillField(S.fields.phoneMobile,        data.phone_mobile);
  if (data.application_date)    I.fillField(S.fields.applicationDate,    data.application_date);
  if (data.bank_payment_type)   I.selectOption(S.fields.bankPaymentType, data.bank_payment_type);
  if (data.bank_code)           I.fillField(S.fields.bankCode,           data.bank_code);
  if (data.bank_branch_code)    I.fillField(S.fields.bankBranchCode,     data.bank_branch_code);
  if (data.bank_account_no)     I.fillField(S.fields.bankAccountNo,      data.bank_account_no);
  if (data.bank_account_name)   I.fillField(S.fields.bankAccountName,    data.bank_account_name);
  if (data.acsno)               I.fillField(S.fields.acsno,              data.acsno);
  if (data.acsno_check)         I.fillField(S.fields.acsnoCheck,         data.acsno_check);
  if (data.expis_date)          I.fillField(S.fields.expisDate,          data.expis_date);
}

Data(csvData).Scenario('候補生を登録できる @dev @normal', async ({ I, current }) => {
  setBusinessLabels({ epic: '受講生管理', feature: '問合せ登録', story: '正常フロー' });

  attachBusinessContext({ label: '正常フロー', input: current });

  await navigateToContactRegister(I);
  await fillContactForm(I, current);

  I.say('【問合せ登録】保存');
  I.click(S.button.save);
  I.waitForElement('body', TIMEOUTS.SCREEN);

  I.saveScreenshotWithTimestamp('CONTACT_REGISTER_success', true);

  I.say('【問合せ登録】成功確認（エラーが出ていないこと）');
  I.dontSee('は必須', S.error.container);
  I.say('【問合せ登録】完了');
});

Data(validationErrorData).Scenario('必須項目未入力でエラーが出る @dev @error', async ({ I, current }) => {
  const storyLabel = current.scenario;
  setBusinessLabels({ epic: '受講生管理', feature: '問合せ登録', story: storyLabel });

  const expectedErrors = parseExpectedErrors(current.expectedErrors);
  const input = {
    last_name:  current.last_name,
    first_name: current.first_name,
  };
  attachBusinessContext({ label: storyLabel, input, expectedErrors });

  await navigateToContactRegister(I);
  await fillContactForm(I, input);

  I.say('【問合せ登録】保存（エラー確認）');
  I.click(S.button.save);

  await verifyValidationErrors(I, expectedErrors, S.error.container);
  await attachErrorScreenshot(I, 'CONTACT_REGISTER_validation_error');
});
