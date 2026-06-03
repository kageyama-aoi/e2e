/**
 * @fileoverview shimamura 問合せ登録 bank_payment_type 別必須フィールド探索テスト
 *
 * **テスト内容**
 * - bank_payment_type を 1〜4 それぞれに設定し、姓名・ふりがなのみで保存する
 * - 保存後のエラーメッセージをログ・スクリーンショットに記録する
 * - 結果から「請求方法ごとの必須フィールド」を把握する（目視確認用）
 *
 * **データソース**
 * - `data/shimamura/bank_payment_type_check_data.csv`
 *
 * **注意**
 * - このテストは探索用途。PASS/FAIL でなくエラー内容の記録が目的
 * - エラーコンテナが存在しない場合は「エラーなし（登録成功）」と記録する
 */
const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { TIMEOUTS } = require('../../../support/shimamura/constants');

const CONTACT_REGISTER_URL = '/index.php?module=Student&action=EditView'
  + '&contact_status=5&return_module=Student&return_action=DetailView&from_mainmenu=true';

const S = {
  fields: {
    lastName:          'last_name',
    firstName:         'first_name',
    lastNameFurigana:  'last_name_furigana',
    firstNameFurigana: 'first_name_furigana',
    bankPaymentType:   'select[name="bank_payment_type"]',
  },
  button: { save: 'input[name="save_button"]' },
  error:  { container: '#top_err_info_msg_div' },
};

const BASE_INPUT = {
  last_name:           '探索',
  first_name:          'テスト',
  last_name_furigana:  'たんさく',
  first_name_furigana: 'てすと',
};

const csvData = withScenarioLabel(
  loadCsvWithProfile('bank_payment_type_check_data'),
  (row) => row.scenario
);

Feature('bank_payment_type 別必須フィールド探索');

Before(beforeShimamura);

Data(csvData).Scenario('請求方法ごとの必須フィールドを確認する @dev @explore', async ({ I, current }) => {
  I.say(`【探索】bank_payment_type=${current.bank_payment_type} (${current.scenario})`);

  I.amOnPage(process.env.BASE_URL + CONTACT_REGISTER_URL);
  I.waitForElement(S.button.save, TIMEOUTS.SCREEN);

  I.fillField(S.fields.lastName,          BASE_INPUT.last_name);
  I.fillField(S.fields.firstName,         BASE_INPUT.first_name);
  I.fillField(S.fields.lastNameFurigana,  BASE_INPUT.last_name_furigana);
  I.fillField(S.fields.firstNameFurigana, BASE_INPUT.first_name_furigana);
  I.selectOption(S.fields.bankPaymentType, current.bank_payment_type);

  I.say('【探索】保存ボタンをクリック');
  I.click(S.button.save);
  I.waitForElement('body', TIMEOUTS.SCREEN);

  I.saveScreenshotWithTimestamp(`bank_payment_type_${current.bank_payment_type}_result`, true);

  const errorText = await I.executeScript(() => {
    const el = document.querySelector('#top_err_info_msg_div');
    return el ? el.innerText.trim() : '';
  });

  if (errorText) {
    I.say(`【探索結果】bank_payment_type=${current.bank_payment_type}: ${errorText}`);
  } else {
    I.say(`【探索結果】bank_payment_type=${current.bank_payment_type}: エラーなし（登録成功）`);
  }
});
