/**
 * @fileoverview shimamura 受講生編集：債権買取変更＋顧客情報登録 E2E テスト
 *
 * **テスト内容**
 * - 受講生一覧で会員番号を絞り込み → 受講生詳細（DetailView）
 * - 先に「債権買取顧客情報登録」ボタン（smbc_button）をクリック → SMBCフォームを編集して保存
 * - 次に受講生編集で請求方法を「債権買取」に変更して保存
 *
 * **制約事項**
 * - 請求方法変更の保存は「7日〜月末」のみ成功する（システム日付バリデーション）
 * - 上記期間外は `expectedErrors` にエラーを記載してエラー系シナリオとして実行すること
 *
 * **データソース**
 * - `data/shimamura/student_saikenkai_data.csv`
 *
 * **パターン**: A（複数画面フロー型）
 * **FlowPage**: `pages/shimamura/StudentSaikenkaiFlowPage.js`
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
const { runSaikenkaiFlow } = require('../../../pages/shimamura/StudentSaikenkaiFlowPage');

const csvData = withScenarioLabel(
  loadCsvWithProfile('student_saikenkai_data', 'shimamura'),
  (row) => row.scenario
);

Feature('受講生編集：債権買取変更＋顧客情報登録');

Before(beforeShimamura);

Data(csvData).Scenario('債権買取に変更して顧客情報を登録できる @dev @normal', async ({ I, ichiranPageShimamura, current }) => {
  setBusinessLabels({ epic: '受講生管理', feature: '債権買取変更＋顧客情報登録', story: '正常フロー' });

  const input = {
    idnumber:              current.idnumber,
    bank_payment_type:     current.bank_payment_type,
    // 受講生基本情報（SMBCフォームの readonly 項目事前入力用）
    student_gender:              current.student_gender              || '',
    student_phone_mobile:        current.student_phone_mobile        || '',
    student_postalcode:          current.student_postalcode          || '',
    student_address_state:       current.student_address_state       || '',
    student_address_city:        current.student_address_city        || '',
    student_address_street:      current.student_address_street      || '',
    student_bank_account_type:   current.student_bank_account_type   || '',
    student_bank_code:           current.student_bank_code           || '',
    student_bank_branch_code:    current.student_bank_branch_code    || '',
    student_bank_account_no:     current.student_bank_account_no     || '',
    student_bank_account_name:   current.student_bank_account_name   || '',
    // SMBCフォーム editable フィールド（受講生レコードから引用されない）
    smbc_phone_mobile:               current.smbc_phone_mobile               || '',
    smbc_last_name_furigana:         current.smbc_last_name_furigana         || '',
    smbc_first_name_furigana:        current.smbc_first_name_furigana        || '',
    smbc_phone_home:                 current.smbc_phone_home                 || '',
    smbc_gengo:                      current.smbc_gengo                      || '',
    smbc_year:                       current.smbc_year                       || '',
    smbc_month:                      current.smbc_month                      || '',
    smbc_day:                        current.smbc_day                        || '',
    smbc_area_id:                    current.smbc_area_id                    || '',
    smbc_school_id:                  current.smbc_school_id                  || '',
    smbc_state_kana:                 current.smbc_state_kana                 || '',
    smbc_city_kana:                  current.smbc_city_kana                  || '',
    smbc_street_kana:                current.smbc_street_kana                || '',
    smbc_keiyakusha_honnin_def:      current.smbc_keiyakusha_honnin_def      || '',
    smbc_k_last_name:                current.smbc_k_last_name                || '',
    smbc_k_first_name:               current.smbc_k_first_name               || '',
    smbc_k_gender:                   current.smbc_k_gender                   || '',
    smbc_k_last_furigana:            current.smbc_k_last_furigana            || '',
    smbc_k_first_furigana:           current.smbc_k_first_furigana           || '',
    smbc_k_gengo:                    current.smbc_k_gengo                    || '',
    smbc_k_year:                     current.smbc_k_year                     || '',
    smbc_k_month:                    current.smbc_k_month                    || '',
    smbc_k_day:                      current.smbc_k_day                      || '',
    smbc_k_phone_mobile:             current.smbc_k_phone_mobile             || '',
    smbc_jusho_honnin_def:           current.smbc_jusho_honnin_def           || '',
    smbc_k_postalcode:               current.smbc_k_postalcode               || '',
    smbc_k_state:                    current.smbc_k_state                    || '',
    smbc_k_state_kana:               current.smbc_k_state_kana               || '',
    smbc_k_city:                     current.smbc_k_city                     || '',
    smbc_k_city_kana:                current.smbc_k_city_kana                || '',
    smbc_k_street:                   current.smbc_k_street                   || '',
    smbc_k_street_kana:              current.smbc_k_street_kana              || '',
    expectedErrors:        parseExpectedErrors(current.expectedErrors),
  };

  attachBusinessContext({ label: '正常フロー', input });

  await runSaikenkaiFlow(I, ichiranPageShimamura, input);

  I.saveScreenshotWithTimestamp('STUDENT_SAIKENKAI_success', true);
  I.say('=== 債権買取変更＋顧客情報登録 完了 ===');
});

Data(csvData).Scenario('バリデーションエラーを確認する @dev @error', async ({ I, ichiranPageShimamura, current }) => {
  if (!current.expectedErrors) return;

  const storyLabel = current.scenario;
  setBusinessLabels({ epic: '受講生管理', feature: '債権買取変更＋顧客情報登録', story: storyLabel });

  const input = {
    idnumber:          current.idnumber,
    bank_payment_type: current.bank_payment_type,
    expectedErrors:    parseExpectedErrors(current.expectedErrors),
  };

  attachBusinessContext({ label: storyLabel, input, expectedErrors: input.expectedErrors });

  await runSaikenkaiFlow(I, ichiranPageShimamura, input);
  await attachErrorScreenshot(I, 'STUDENT_SAIKENKAI_validation_error');
});
