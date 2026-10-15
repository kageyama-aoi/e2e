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
 * **パターン**: B（フォーム入力型・FlowPage なし）。画面操作は `pages/shimamura/screens/ContactRegisterPage.js`
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
const { verifyValidationErrors } = require('../../../support/shimamura/utils');
const { TIMEOUTS } = require('../../../support/shimamura/constants');
const { submitDeleteForm } = require('../../../support/shimamura/editViewSubmit');
const { firstOfMonth, formatDate } = require('../../../support/dateFormat');

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

/**
 * 姓名を実行ごとに一意にする（同姓同名だと二重登録の確認画面に移り保存されないため）。
 * 姓は CSV の値＋月日（list_submit_test_records.js で前方一致で探せる）、名は CSV の値＋時分秒。
 */
function uniqueName(row) {
  const now = new Date();
  return {
    last_name:  `${row.last_name}${formatDate(now, 'MMDD')}`,
    first_name: `${row.first_name}${formatDate(now, 'hhmmss')}`,
  };
}

/**
 * 引落開始充当年月（YYYYMM・6桁）。CSV に「来月」と書いたら実行日の翌月にする
 * （固定の年月だと日がたつと過去の月になるため）。それ以外は CSV の値のまま。
 */
function toYearMonth(value) {
  if (String(value || '').trim() !== '来月') return value;
  return formatDate(firstOfMonth(1), 'YYYYMM');
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
  contactRegisterPageShimamura.fillForm(input);

  contactRegisterPageShimamura.clickSave();

  I.say('【問合せ登録】成功確認（受講生詳細へ遷移し record が付くこと）');
  const recordId = await contactRegisterPageShimamura.waitForSavedRecordId();
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
  contactRegisterPageShimamura.fillForm(input);

  contactRegisterPageShimamura.clickSave();

  await verifyValidationErrors(I, expectedErrors, contactRegisterPageShimamura.locators.error);
  await attachErrorScreenshot(I, 'CONTACT_REGISTER_validation_error');
});
