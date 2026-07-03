'use strict';

const { logScreenUrl } = require('../../../support/utils');
const { assertNoShimamuraError, fillTextFieldsByName } = require('../../../support/shimamura/utils');
const { TIMEOUTS } = require('../../../support/shimamura/constants');

const BASE_URL = (process.env.BASE_URL || '').replace(/\/?$/, '/');

const S = {
  list:       { search: 'input[name="search"]', firstLink: 'a.listViewTdLinkS1' },
  basic:      { saveButton: 'input[name="save_button"]', editButton: 'input[name="edit_button"]' },
  accounting: { saveButton: 'input[name="save_button"]', editButton: 'input[name="edit_button"]' },
  error:      '#top_err_info_msg_div',
};

// 講師コードで検索して record ID を返す（存在しない場合は null）
async function findTeacherRecordId(I, idnumber) {
  I.say(`【講師検索】講師コード ${idnumber} で検索`);
  I.amOnPage(BASE_URL + 'index.php?module=Teacher&action=LW_AN');
  I.waitForElement(S.list.search, TIMEOUTS.SCREEN);
  fillTextFieldsByName(I, { idnumber });
  I.click(S.list.search);
  I.wait(TIMEOUTS.TAB_SWITCH);

  const count = await I.grabNumberOfVisibleElements(S.list.firstLink);
  if (count === 0) {
    I.say(`【講師検索】講師コード ${idnumber} は未登録`);
    return null;
  }

  const href = await I.grabAttributeFrom(locate(S.list.firstLink).first(), 'href');
  const match = href.match(/[?&]record=([^&]+)/);
  if (!match) throw new Error(`講師詳細 URL から record ID が取得できませんでした: ${href}`);
  const recordId = match[1];
  I.say(`【講師検索】既存レコード発見 (record=${recordId})`);
  return recordId;
}

// 講師を新規登録して record ID を返す
async function createTeacher(I, input) {
  I.say(`【講師新規登録】${input.last_name} ${input.first_name}（講師コード: ${input.idnumber}）`);
  I.amOnPage(
    BASE_URL + 'index.php?module=Teacher&action=EditView&return_module=Teacher&return_action=DW_AN'
  );
  I.waitForElement(S.basic.saveButton, TIMEOUTS.SCREEN);

  fillTextFieldsByName(I, {
    last_name:           input.last_name,
    first_name:          input.first_name,
    last_name_furigana:  input.last_name_furigana,
    first_name_furigana: input.first_name_furigana,
    idnumber:            input.idnumber,
  });
  I.selectOption('select[name="belong"]',         input.belong);
  I.selectOption('select[name="contact_status"]', input.contact_status);

  I.say('【講師新規登録】保存');
  I.click(S.basic.saveButton);
  I.waitForElement(S.basic.editButton, TIMEOUTS.SCREEN);
  await assertNoShimamuraError(I, '【講師新規登録】保存');

  const url = await I.grabCurrentUrl();
  const match = url.match(/[?&]record=([^&]+)/);
  if (!match) throw new Error(`講師登録後の URL から record ID が取得できませんでした: ${url}`);
  const recordId = match[1];
  I.say(`【講師新規登録】完了 (record=${recordId})`);
  return recordId;
}

// 経理タブ（EW_AccountingTab_AN）を設定して保存する
async function setAccountingTab(I, recordId, input) {
  I.say('【経理タブ】編集画面へ遷移');
  I.amOnPage(
    BASE_URL
    + `index.php?module=Teacher&action=EW_AccountingTab_AN`
    + `&record=${recordId}&return_module=Teacher&return_action=DW_AN&return_id=${recordId}`
  );
  I.waitForElement(S.accounting.saveButton, TIMEOUTS.SCREEN);
  await logScreenUrl(I, '経理タブ編集');

  if (input.zei_kubun)           I.selectOption('select[name="zei_kubun"]',           input.zei_kubun);
  if (input.t_bank_payment_type) I.selectOption('select[name="t_bank_payment_type"]', input.t_bank_payment_type);
  if (input.bank_account_type)   I.selectOption('select[name="bank_account_type"]',   input.bank_account_type);
  // tax_class は 0 が有効値のため truthy チェックではなく存在チェック
  if (input.tax_class !== undefined && input.tax_class !== '')
    I.selectOption('select[name="tax_class"]', input.tax_class);

  // 金融機関コード: value設定 + keyup発火でAJAX補完（bank_name を自動入力）
  if (input.bank_code) {
    await I.executeScript((code) => {
      const el = document.querySelector('#bank_code');
      if (el) {
        el.value = code;
        el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      }
    }, input.bank_code);
    I.wait(TIMEOUTS.AJAX_DEBOUNCE);
  }

  // 支店コード: 同様にkeyup発火でAJAX補完（bank_branch_name を自動入力）
  if (input.bank_branch_code) {
    await I.executeScript((code) => {
      const el = document.querySelector('#bank_branch_code');
      if (el) {
        el.value = code;
        el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      }
    }, input.bank_branch_code);
    I.wait(TIMEOUTS.AJAX_DEBOUNCE);
  }

  // 口座番号・口座名義人: 既存値が残っている場合を考慮して clearField してから入力
  if (input.bank_account_no) {
    I.clearField('#bank_account_no');
    I.fillField('#bank_account_no', input.bank_account_no);
  }
  if (input.bank_account_name) {
    I.clearField('#bank_account_name');
    I.fillField('#bank_account_name', input.bank_account_name);
  }

  if (input.reward_rate_1) fillTextFieldsByName(I, { reward_rate_1: input.reward_rate_1 });

  I.say('【経理タブ】保存');
  I.click(S.accounting.saveButton);
  // バリデーションエラーが出るか edit_button が現れるまで動的に待機
  await I.waitForFunction(
    () => document.querySelector('#top_err_info_msg_div')?.textContent.trim() ||
          !!document.querySelector('input[name="edit_button"]'),
    TIMEOUTS.RESULT
  );
  await assertNoShimamuraError(I, '【経理タブ】保存');
  I.say('【経理タブ】設定完了');
  await logScreenUrl(I, '経理タブ設定後');
}

// オーケストレーター: 検索→新規登録（必要な場合）→経理タブ設定
async function runTeacherKeiriSetup(I, input) {
  let recordId = await findTeacherRecordId(I, input.idnumber);

  if (!recordId) {
    recordId = await createTeacher(I, input);
  }

  await setAccountingTab(I, recordId, input);
}

module.exports = { runTeacherKeiriSetup };
