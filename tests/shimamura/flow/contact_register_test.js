/**
 * @fileoverview shimamura 問合せ登録（受講生の直接登録）E2E テスト
 *
 * **何が作られるか**
 * 問合せ登録画面で保存すると**受講生**が1件できる（URL の contact_status=5 は送信内容に含まれない）。
 * 運用では候補生を候補生一覧から昇格させるので、これは検証用の近道の経路（#231 / #232）。
 *
 * **テスト内容**
 * - 正常系: 入力して保存すると、受講生詳細へ遷移し URL に `record=<UUID>` が付く。確認後にその1件を削除する
 * - 異常系: 必須項目を空にして保存するとエラーが表示される
 *
 * **姓名は実行ごとに一意にする**
 * 同姓同名で保存すると「二重登録の可能性のある受講生一覧」画面に移って保存されない。以前はこの画面を
 * 成功と見なして偽合格していた（#232）。姓は CSV の値＋月日、名は CSV の値＋時刻にする。
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
const { verifyValidationErrors, fillTextFieldsByName, extractRecordId } = require('../../../support/shimamura/utils');
const { TIMEOUTS, SELECTORS } = require('../../../support/shimamura/constants');
const { submitDeleteForm } = require('../../../support/shimamura/editViewSubmit');

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
    bankCode:           '#bank_code',
    bankName:           '#bank_name',
    bankBranchCode:     '#bank_branch_code',
    bankBranchName:     '#bank_branch_name',
    shimaStorageId:     'select[name="shima_storage_id"]',
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

Feature('問合せ登録（受講生の直接登録）');

Before(beforeShimamura);

async function fillContactForm(I, data) {
  I.say('【問合せ登録】フォーム入力');
  // テキストフィールド一括入力（金融機関・支店コードは名称の自動入力があるので下で別に入れる）
  fillTextFieldsByName(I, {
    last_name:               data.last_name,
    first_name:              data.first_name,
    last_name_furigana:      data.last_name_furigana,
    first_name_furigana:     data.first_name_furigana,
    phone_mobile:            data.phone_mobile,
    application_date:        data.application_date,
    hikiotoshi_startdate:    data.hikiotoshi_startdate,
    bank_account_no:         data.bank_account_no,
    bank_account_name:       data.bank_account_name,
    acsno:                   data.acsno,
    acsno_check:             data.acsno_check,
    expis_date:              data.expis_date,
    hikiotoshi_startdate_cr: data.hikiotoshi_startdate_cr,
  });
  if (data.gender)            I.selectOption(S.fields.gender,          data.gender);
  if (data.bank_payment_type) I.selectOption(S.fields.bankPaymentType, data.bank_payment_type);
  if (data.shima_storage_id)  I.selectOption(S.fields.shimaStorageId,  data.shima_storage_id);
  // 支店の候補は金融機関コードで絞られるので必ずこの順
  if (data.bank_code)        pickBankCandidate(I, S.fields.bankCode,       data.bank_code,        S.fields.bankName);
  if (data.bank_branch_code) pickBankCandidate(I, S.fields.bankBranchCode, data.bank_branch_code, S.fields.bankBranchName);
}

/**
 * 金融機関・支店コードを入れ、出てくる候補ポップアップからコードが一致する先頭の候補を選ぶ。
 * 名称欄は読み取り専用で、候補をクリックしたときだけ埋まる（put_into_targets）。名称が空のまま
 * 保存すると「銀行情報を入力してください」で保存されない（#232）。候補はキー入力（keyup）で
 * 出るので fillField ではなく type で入れる。同じ支店コードの候補が複数出ることがある（001 等）。
 */
function pickBankCandidate(I, codeSelector, code, nameSelector) {
  I.clearField(codeSelector);
  I.click(codeSelector);
  I.type(code);
  const candidate = `#overDiv div[onclick^="put_into_targets('${code}'"]`;
  I.waitForElement(candidate, TIMEOUTS.SCREEN);
  I.click(candidate);
  I.waitForFunction((sel) => document.querySelector(sel).value.trim() !== '', [nameSelector], TIMEOUTS.SCREEN);
}

/**
 * 姓名を実行ごとに一意にする（同姓同名だと二重登録の確認画面に移り保存されないため）。
 * 姓は CSV の値＋月日（list_submit_test_records.js で前方一致で探せる）、名は CSV の値＋時分秒。
 */
function uniqueName(row) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return {
    last_name:  `${row.last_name}${pad(now.getMonth() + 1)}${pad(now.getDate())}`,
    first_name: `${row.first_name}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
  };
}

/**
 * 引落開始充当年月（YYYYMM・6桁）。CSV に「来月」と書いたら実行日の翌月にする
 * （固定の年月だと日がたつと過去の月になるため）。それ以外は CSV の値のまま。
 */
function toYearMonth(value) {
  if (String(value || '').trim() !== '来月') return value;
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * 保存ボタンを押した後、受講生詳細へ遷移して URL に record= が付くまで待ち、UUID を返す。
 * 付かなければ保存されていない。エラー枠（無ければ本文の先頭）を添えて失敗させる。
 * 二重登録の確認画面のようにエラー枠を使わない画面もあるので、「エラーが出ていない」では判定しない。
 */
async function waitForSavedRecordId(I) {
  let url = '';
  for (let waited = 0; waited < TIMEOUTS.SCREEN; waited += 1) {
    url = await I.grabCurrentUrl();
    if (extractRecordId(url)) return extractRecordId(url);
    I.wait(1);
  }
  const shown = await I.executeScript((selector) => {
    const el = document.querySelector(selector);
    const text = el ? el.innerText.trim() : '';
    return text || document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 300);
  }, S.error.container);
  throw new Error(`【問合せ登録】保存されませんでした（url=${url}）\n画面の表示: ${shown}`);
}

Data(csvData).Scenario('受講生を直接登録できる @dev @normal', async ({ I, current, contactRegisterPageShimamura }) => {
  setBusinessLabels({ epic: '受講生管理', feature: '問合せ登録', story: '正常フロー' });

  const input = {
    ...current,
    ...uniqueName(current),
    hikiotoshi_startdate:    toYearMonth(current.hikiotoshi_startdate),
    hikiotoshi_startdate_cr: toYearMonth(current.hikiotoshi_startdate_cr),
  };
  attachBusinessContext({ label: '正常フロー', input });

  contactRegisterPageShimamura.navigateToContactRegister();
  await fillContactForm(I, input);

  I.say('【問合せ登録】保存');
  I.click(S.button.save);

  I.say('【問合せ登録】成功確認（受講生詳細へ遷移し record が付くこと）');
  const recordId = await waitForSavedRecordId(I);
  I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);
  I.see(input.last_name);
  I.see(input.first_name);
  I.saveScreenshotWithTimestamp('CONTACT_REGISTER_success', true);
  I.say(`【問合せ登録】保存を確認 record=${recordId}`);

  // 実行のたびに受講生が増えないよう、このテストが作った1件だけを消す
  await submitDeleteForm(I, { module: 'Student', recordId, label: `${input.last_name} ${input.first_name}` });
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
