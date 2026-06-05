'use strict';

const { logScreenUrl } = require('../../support/utils');
const { verifyValidationErrors } = require('../../support/shimamura/utils');
const { TIMEOUTS } = require('../../support/shimamura/constants');

// ── 保存完了を動的検知するヘルパー ──────────────────────────────
// エラーが出るか editButton が現れた時点で即座に次へ進む（固定待ちを排除）
async function waitForSaveResult(I) {
  await I.waitForFunction(
    () => document.querySelector('#top_err_info_msg_div')?.innerText.trim() ||
          !!document.querySelector('input[name="edit_button"]'),
    TIMEOUTS.RESULT
  );
}

// ── ローカルロケーター ────────────────────────────────────────
const S = {
  detail: {
    editButton:   'input[name="edit_button"]',
    saikenkaiBtn: 'input[name="smbc_button"]',  // 債権買取顧客情報登録
  },
  edit: {
    bankPaymentType: 'select[name="bank_payment_type"]',
    saveButton:      'input[name="save_button"]',
  },
  smbc: {
    saveButton: 'input[name="save_button"]',   // value="申込情報登録"
    fields: {
      // editable フィールド（受講生レコードから引用されない）
      phoneMobile:          'input[name="phone_mobile"]',       // 必須（ハイフン付き半角）
      lastNameFurigana:     'input[name="last_name_furigana"]', // 必須（半角カタカナ）
      firstNameFurigana:    'input[name="first_name_furigana"]',// 必須（半角カタカナ）
      phoneHome:            'input[name="phone_home"]',
      gengo:                'select[name="gengo"]',             // 元号: 3=昭和, 4=平成, 5=令和
      year:                 'input[name="year"]',
      month:                'input[name="month"]',
      day:                  'input[name="day"]',
      areaId:               'select[name="area_id"]',
      schoolId:             'select[name="school_id"]',
      stateKana:            'input[name="primary_address_state_kana"]',
      cityKana:             'input[name="primary_address_city_kana"]',
    },
  },
  error: '#top_err_info_msg_div',
};

// ── Step 1: 受講生検索 → DW_AN → DetailView ──────────────────

async function ShouldSearchAndNavigateToDetailView(I, ichiranPageShimamura, idnumber) {
  I.say('【受講生検索】会員番号で絞り込み');
  await ichiranPageShimamura.navigateToStudentSearchPage();
  ichiranPageShimamura.fillStudentSearchConditions({ idnumber });
  ichiranPageShimamura.clickStudentSearchAndWait();

  I.say('【受講生検索】最初の結果をクリック → DW_AN へ');
  I.click('a.listViewTdLinkS1');
  I.waitForElement(S.detail.editButton, TIMEOUTS.SCREEN);

  // DW_AN URL から record ID を取得し DetailView へ切替
  const url = await I.grabCurrentUrl();
  const match = url.match(/[?&]record=([^&]+)/);
  if (!match) throw new Error(`record ID が URL から取得できませんでした: ${url}`);
  const recordId = match[1];
  I.say(`【受講生詳細】DetailView へ切替 (record=${recordId})`);
  // detailview=1 が必須: これがないと smbc_button が表示されない
  I.amOnPage(process.env.BASE_URL
    + `/index.php?detailview=1&module=Student&action=DetailView`
    + `&return_module=Student&return_action=DetailView&record=${recordId}`);
  I.waitForElement(S.detail.editButton, TIMEOUTS.SCREEN);
  await logScreenUrl(I, '受講生詳細(DetailView)');
}

// ── Step 2: 受講生基本情報の事前入力（SMBCフォームの readonly 項目用） ──

async function ShouldFillAndSaveStudentBasicInfo(I, input) {
  I.say('【受講生基本情報】編集ボタンをクリック');
  I.click(S.detail.editButton);
  I.waitForElement(S.edit.saveButton, TIMEOUTS.SCREEN);
  await logScreenUrl(I, '受講生編集(基本情報)');

  I.say('【受講生基本情報】フォームに入力');
  // SMBCフォームで readonly になっているため、受講生レコードに先に設定する
  if (input.student_gender)         I.selectOption('select[name="gender"]',            input.student_gender);
  if (input.student_phone_mobile)   I.fillField('input[name="phone_mobile"]',           input.student_phone_mobile);
  if (input.student_postalcode) {
    I.fillField('input[name="primary_address_postalcode"]', input.student_postalcode);
    I.click('input[value="〒"]');  // shimamura 郵便番号検索ボタン
    I.wait(0.5); // 郵便番号 API 待ち
  }
  // zipCodeBtn で自動補完されない場合は直接入力
  if (input.student_address_state)  I.fillField('input[name="primary_address_state"]',  input.student_address_state);
  if (input.student_address_city)   I.fillField('input[name="primary_address_city"]',   input.student_address_city);
  if (input.student_address_street) {
    // primary_address_street は textarea かつ郵便番号APIで自動補完されるため JS で直接セット
    I.executeScript((val) => {
      const el = document.querySelector('textarea[name="primary_address_street"]');
      if (el) { el.removeAttribute('readonly'); el.value = val; }
    }, input.student_address_street);
  }
  // 口座情報（SMBCフォームの readonly 項目として引用される）
  if (input.student_bank_account_type) I.selectOption('select[name="bank_account_type"]',  input.student_bank_account_type);
  if (input.student_bank_code) {
    I.fillField('input[name="bank_code"]', input.student_bank_code);
    I.wait(0.5); // 銀行名 AJAX 補完待ち
  }
  if (input.student_bank_branch_code) I.fillField('input[name="bank_branch_code"]', input.student_bank_branch_code);
  if (input.student_bank_account_no)  I.fillField('input[name="bank_account_no"]',  input.student_bank_account_no);
  if (input.student_bank_account_name)I.fillField('input[name="bank_account_name"]',input.student_bank_account_name);

  I.say('【受講生基本情報】保存');
  I.click(S.edit.saveButton);
  await waitForSaveResult(I);

  const errorText = await I.executeScript(() => {
    const el = document.querySelector('#top_err_info_msg_div');
    return el ? el.innerText.trim() : '';
  });
  if (errorText) throw new Error(`【受講生基本情報】保存エラー: ${errorText}`);

  I.say('【受講生基本情報】保存成功 → DetailView へ戻る');
  await logScreenUrl(I, '受講生詳細(DetailView)_基本情報保存後');
}

// ── Step 4: 編集 → 請求方法変更 → 保存 ──────────────────────

async function ShouldEditStudentPaymentType(I, input) {
  I.say('【受講生編集】編集ボタンをクリック');
  I.click(S.detail.editButton);
  I.waitForElement(S.edit.saveButton, TIMEOUTS.SCREEN);
  await logScreenUrl(I, '受講生編集(EW_AN)');

  I.say(`【受講生編集】請求方法を「債権買取」(${input.bank_payment_type}) に変更`);
  I.selectOption(S.edit.bankPaymentType, input.bank_payment_type);
  I.wait(1);
}

async function ShouldSaveStudentEdit(I, expectedErrors) {
  I.say('【受講生編集】保存');
  I.click(S.edit.saveButton);
  await waitForSaveResult(I);

  const errorText = await I.executeScript(() => {
    const el = document.querySelector('#top_err_info_msg_div');
    return el ? el.innerText.trim() : '';
  });

  if (expectedErrors && expectedErrors.length > 0) {
    await verifyValidationErrors(I, expectedErrors, S.error);
    return;
  }
  if (errorText) {
    // 毎月 1〜6 日はシステム日付バリデーションで債権買取変更が不可のためスキップ
    const day = new Date().getDate();
    if (day <= 6) {
      I.say(`【受講生編集】日付制限期間中（${day}日）のため保存エラーをスキップ: ${errorText}`);
      return;
    }
    throw new Error(`【受講生編集】保存エラー: ${errorText}`);
  }

  I.say('【受講生編集】保存成功 → DetailView へ戻る');
  await logScreenUrl(I, '受講生詳細(DetailView)_保存後');
}

// ── Step 3: 債権買取顧客情報登録ボタン → SMBCフォーム ─────────

async function ShouldClickSaikenkaiButton(I) {
  I.say('【債権買取顧客情報登録】smbc_button をクリック');
  I.waitForElement(S.detail.saikenkaiBtn, TIMEOUTS.ELEMENT);
  I.click(S.detail.saikenkaiBtn);
  I.waitForElement(S.smbc.saveButton, TIMEOUTS.SCREEN);
  await logScreenUrl(I, '債権買取顧客情報登録フォーム(SmbcContacts EW_AN)');
}

async function ShouldFillSmbcForm(I, input) {
  I.say('【債権買取顧客情報登録】フォームに入力（editable フィールドのみ）');
  // readonly フィールド（gender, address, bank_* など）は受講生レコードから自動引用される

  // ─ テキスト系（input + textarea）を executeScript で一括入力
  const mainTextFields = [
    ['phone_mobile',                input.smbc_phone_mobile],
    ['last_name_furigana',          input.smbc_last_name_furigana],
    ['first_name_furigana',         input.smbc_first_name_furigana],
    ['phone_home',                  input.smbc_phone_home],
    ['year',                        input.smbc_year],
    ['month',                       input.smbc_month],
    ['day',                         input.smbc_day],
    ['primary_address_state_kana',  input.smbc_state_kana],
    ['primary_address_city_kana',   input.smbc_city_kana],
    ['primary_address_street_kana', input.smbc_street_kana],
  ].filter(([, v]) => v);

  if (mainTextFields.length > 0) {
    I.executeScript((fields) => {
      fields.forEach(([name, value]) => {
        const el = document.querySelector(`[name="${name}"]`);
        if (el) el.value = value;
      });
    }, mainTextFields);
  }

  // ─ セレクト系（change イベントが必要なため個別に）
  if (input.smbc_gengo)     I.selectOption(S.smbc.fields.gengo,    input.smbc_gengo);
  if (input.smbc_area_id)   I.selectOption(S.smbc.fields.areaId,   input.smbc_area_id);
  if (input.smbc_school_id) I.selectOption(S.smbc.fields.schoolId, input.smbc_school_id);

  // ─ 契約者情報（keiyakusha_honnin_def で editable 化）
  if (input.smbc_keiyakusha_honnin_def) {
    // =1 にすると契約者フィールドが editable になる（受講生と契約者が異なる場合）
    I.selectOption('select[name="keiyakusha_honnin_def"]', input.smbc_keiyakusha_honnin_def);
    I.wait(1); // JS のイベント待ち
  }
  if (input.smbc_keiyakusha_honnin_def === '1') {
    const keiyakushaTextFields = [
      ['keiyakusha_last_name',           input.smbc_k_last_name],
      ['keiyakusha_first_name',          input.smbc_k_first_name],
      ['keiyakusha_last_name_furigana',  input.smbc_k_last_furigana],
      ['keiyakusha_first_name_furigana', input.smbc_k_first_furigana],
      ['keiyakusha_year',                input.smbc_k_year],
      ['keiyakusha_month',               input.smbc_k_month],
      ['keiyakusha_day',                 input.smbc_k_day],
      ['keiyakusha_phone_mobile',        input.smbc_k_phone_mobile],
    ].filter(([, v]) => v);

    if (keiyakushaTextFields.length > 0) {
      I.executeScript((fields) => {
        fields.forEach(([name, value]) => {
          const el = document.querySelector(`[name="${name}"]`);
          if (el) el.value = value;
        });
      }, keiyakushaTextFields);
    }

    if (input.smbc_k_gender) I.selectOption('select[name="keiyakusha_gender"]', input.smbc_k_gender);
    if (input.smbc_k_gengo)  I.selectOption('select[name="keiyakusha_gengo"]',  input.smbc_k_gengo);
  }

  if (input.smbc_jusho_honnin_def) {
    I.selectOption('select[name="jusho_honnin_def"]', input.smbc_jusho_honnin_def);
    I.wait(1);
  }
  if (input.smbc_keiyakusha_honnin_def === '1' && input.smbc_jusho_honnin_def === '1') {
    const addressTextFields = [
      ['keiyakusha_address_postalcode',  input.smbc_k_postalcode],
      ['keiyakusha_address_state',       input.smbc_k_state],
      ['keiyakusha_address_state_kana',  input.smbc_k_state_kana],
      ['keiyakusha_address_city',        input.smbc_k_city],
      ['keiyakusha_address_city_kana',   input.smbc_k_city_kana],
      ['keiyakusha_address_street',      input.smbc_k_street],
      ['keiyakusha_address_street_kana', input.smbc_k_street_kana],
    ].filter(([, v]) => v);

    if (addressTextFields.length > 0) {
      I.executeScript((fields) => {
        fields.forEach(([name, value]) => {
          const el = document.querySelector(`[name="${name}"]`);
          if (el) el.value = value;
        });
      }, addressTextFields);
    }
  }
}

async function ShouldSaveSmbcForm(I, expectedErrors) {
  I.say('【債権買取顧客情報登録】申込情報登録ボタンをクリック');
  I.click(S.smbc.saveButton);
  await waitForSaveResult(I);

  const errorText = await I.executeScript(() => {
    const el = document.querySelector('#top_err_info_msg_div');
    return el ? el.innerText.trim() : '';
  });

  if (expectedErrors && expectedErrors.length > 0) {
    await verifyValidationErrors(I, expectedErrors, S.error);
    return;
  }
  if (errorText) throw new Error(`【債権買取顧客情報登録】保存エラー: ${errorText}`);

  I.say('【債権買取顧客情報登録】保存成功 → DetailView へ戻る');
  // 保存後は return_action=DetailView で受講生詳細へ戻る
  await logScreenUrl(I, '受講生詳細(DetailView)_SMBC保存後');
}

// ── オーケストレーター ────────────────────────────────────────
// 手順: 先に債権買取顧客情報登録 → 次に請求方法を債権買取に変更して保存

async function runSaikenkaiFlow(I, ichiranPageShimamura, input) {
  // Step 1: 受講生を検索して DetailView へ
  await ShouldSearchAndNavigateToDetailView(I, ichiranPageShimamura, input.idnumber);

  // Step 2: 受講生基本情報を先に登録（SMBCフォームの readonly 項目の事前準備）
  await ShouldFillAndSaveStudentBasicInfo(I, input);

  // Step 3: 債権買取顧客情報登録（smbc_button）
  await ShouldClickSaikenkaiButton(I);
  await ShouldFillSmbcForm(I, input);
  await ShouldSaveSmbcForm(I, input.expectedErrors);

  // Step 4: 受講生編集 → 請求方法：債権買取 → 保存（7日〜月末のみ成功）
  await ShouldEditStudentPaymentType(I, input);
  await ShouldSaveStudentEdit(I, input.expectedErrors);
}

module.exports = { runSaikenkaiFlow };
