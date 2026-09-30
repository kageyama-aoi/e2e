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
 * - 結果は URL とエラー枠で3つに分けて記録する（#243）
 *   - 登録成功: 詳細画面へ遷移し URL に record= が付く → 作った受講生はその場で削除する
 *   - エラー: エラー枠にメッセージ（必須フィールド不足など）
 *   - 保存されず: どちらでもない別画面（例: 同姓同名の「二重登録の可能性のある受講生一覧」）
 * - 同姓同名で二重登録画面に止まらないよう、名に実行時刻を付けて毎回一意にする
 */
const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { fillTextFieldsByName, clickAndWaitForReload, extractRecordId } = require('../../../support/shimamura/utils');
const { submitDeleteForm } = require('../../../support/shimamura/editViewSubmit');
const { TIMEOUTS, URLS, SELECTORS, BASE_URL } = require('../../../support/shimamura/constants');

const S = {
  fields: {
    lastName:          'last_name',
    firstName:         'first_name',
    lastNameFurigana:  'last_name_furigana',
    firstNameFurigana: 'first_name_furigana',
    bankPaymentType:   'select[name="bank_payment_type"]',
  },
  button: { save: 'input[name="save_button"]' },
  error:  { container: SELECTORS.ERROR_CONTAINER },
};

const BASE_INPUT = {
  last_name:           '探索',
  first_name:          'テスト',
  last_name_furigana:  'たんさく',
  first_name_furigana: 'てすと',
};

const csvData = withScenarioLabel(
  loadCsvWithProfile('bank_payment_type_check_data', 'shimamura'),
  (row) => row.scenario
);

Feature('bank_payment_type 別必須フィールド探索');

Before(beforeShimamura);

Data(csvData).Scenario('請求方法ごとの必須フィールドを確認する @dev @explore', async ({ I, current }) => {
  I.say(`【探索】bank_payment_type=${current.bank_payment_type} (${current.scenario})`);

  I.amOnPage(BASE_URL + URLS.CONTACT_REGISTER);
  I.waitForElement(S.button.save, TIMEOUTS.SCREEN);

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const input = { ...BASE_INPUT, first_name: `${BASE_INPUT.first_name}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}` };
  fillTextFieldsByName(I, input);
  I.selectOption(S.fields.bankPaymentType, current.bank_payment_type);

  I.say('【探索】保存ボタンをクリック');
  await clickAndWaitForReload(I, S.button.save, { timeout: TIMEOUTS.SCREEN });

  I.saveScreenshotWithTimestamp(`bank_payment_type_${current.bank_payment_type}_result`, true);

  const label = `bank_payment_type=${current.bank_payment_type}`;
  const url = await I.grabCurrentUrl();
  const recordId = extractRecordId(url);
  const errorText = await I.executeScript((selector) => {
    const el = document.querySelector(selector);
    return el ? el.innerText.trim() : '';
  }, SELECTORS.ERROR_CONTAINER);

  if (recordId) {
    I.say(`【探索結果】${label}: 登録成功（record=${recordId}）→ 削除する`);
    await submitDeleteForm(I, { module: 'Student', recordId, label: `${input.last_name} ${input.first_name}` });
  } else if (errorText) {
    I.say(`【探索結果】${label}: エラー: ${errorText}`);
  } else {
    const title = await I.executeScript(() => (document.querySelector('h2, .moduleTitle') || document.body).innerText.trim().slice(0, 80));
    I.say(`【探索結果】${label}: 保存されず（エラー表示のない別画面: ${title} / ${url}）`);
  }
});
