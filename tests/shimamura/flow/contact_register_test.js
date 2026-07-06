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
} = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { verifyValidationErrors, fillTextFieldsByName } = require('../../../support/shimamura/utils');
const { TIMEOUTS, SELECTORS } = require('../../../support/shimamura/constants');

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
  error:  { container: SELECTORS.ERROR_CONTAINER },
};

const csvData = withScenarioLabel(
  loadCsvWithProfile('contact_register_data', 'shimamura'),
  (row) => row.scenario
);

const validationErrorData = withScenarioLabel(
  loadCsvWithProfile('contact_register_validation_errors', 'shimamura'),
  (row) => row.scenario
);

Feature('問合せ登録（候補生登録）');

Before(beforeShimamura);

async function fillContactForm(I, data) {
  I.say('【問合せ登録】フォーム入力');
  // テキストフィールド一括入力（bank_code は AJAX 自動補完のため除外）
  fillTextFieldsByName(I, {
    last_name:           data.last_name,
    first_name:          data.first_name,
    last_name_furigana:  data.last_name_furigana,
    first_name_furigana: data.first_name_furigana,
    phone_mobile:        data.phone_mobile,
    application_date:    data.application_date,
    bank_branch_code:    data.bank_branch_code,
    bank_account_no:     data.bank_account_no,
    bank_account_name:   data.bank_account_name,
    acsno:               data.acsno,
    acsno_check:         data.acsno_check,
    expis_date:          data.expis_date,
  });
  if (data.gender)            I.selectOption(S.fields.gender,          data.gender);
  if (data.bank_payment_type) I.selectOption(S.fields.bankPaymentType, data.bank_payment_type);
  if (data.bank_code)         I.fillField(S.fields.bankCode,           data.bank_code);
}

Data(csvData).Scenario('候補生を登録できる @dev @normal', async ({ I, current, contactRegisterPageShimamura }) => {
  setBusinessLabels({ epic: '受講生管理', feature: '問合せ登録', story: '正常フロー' });

  attachBusinessContext({ label: '正常フロー', input: current });

  contactRegisterPageShimamura.navigateToContactRegister();
  await fillContactForm(I, current);

  I.say('【問合せ登録】保存');
  I.click(S.button.save);
  I.waitForElement('body', TIMEOUTS.SCREEN);

  I.saveScreenshotWithTimestamp('CONTACT_REGISTER_success', true);

  I.say('【問合せ登録】成功確認（エラーが出ていないこと）');
  I.dontSee('は必須', S.error.container);
  I.say('【問合せ登録】完了');
});

Data(validationErrorData).Scenario('必須項目未入力でエラーが出る @dev @error', async ({ I, current, contactRegisterPageShimamura }) => {
  const storyLabel = current.scenario;
  setBusinessLabels({ epic: '受講生管理', feature: '問合せ登録', story: storyLabel });

  const expectedErrors = parseExpectedErrors(current.expectedErrors);
  const input = {
    last_name:  current.last_name,
    first_name: current.first_name,
  };
  attachBusinessContext({ label: storyLabel, input, expectedErrors });

  contactRegisterPageShimamura.navigateToContactRegister();
  await fillContactForm(I, input);

  I.say('【問合せ登録】保存（エラー確認）');
  I.click(S.button.save);

  await verifyValidationErrors(I, expectedErrors, S.error.container);
  await attachErrorScreenshot(I, 'CONTACT_REGISTER_validation_error');
});
