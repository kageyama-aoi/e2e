'use strict';

const { I } = inject();
const { URLS, TIMEOUTS, BASE_URL, SELECTORS } = require('../../../support/shimamura/constants');
const { extractRecordId, fillTextFieldsByName, pickBankCandidate } = require('../../../support/shimamura/utils');
const { submitEditViewForm } = require('../../../support/shimamura/editViewSubmit');

module.exports = {

  locators: {
    saveButton: 'input[name="save_button"]',
    editForm: 'EditView',
    error: SELECTORS.ERROR_CONTAINER,
    gender:          'select[name="gender"]',
    bankPaymentType: 'select[name="bank_payment_type"]',
    shimaStorageId:  'select[name="shima_storage_id"]',
    bankCode:        '#bank_code',
    bankName:        '#bank_name',
    bankBranchCode:  '#bank_branch_code',
    bankBranchName:  '#bank_branch_name',
  },

  /**
   * 問合せ登録画面へ直接遷移します。
   */
  navigateToContactRegister() {
    I.say('【問合せ登録】URL 直遷移');
    I.amOnPage(BASE_URL + URLS.CONTACT_REGISTER);
    I.waitForElement(this.locators.saveButton, TIMEOUTS.SCREEN);
  },

  /**
   * 問合せ登録フォームに入力します（#302 でテストから移動）。空の項目は入力しません。
   * @param {Object<string, string>} data 入力値（キーは画面の name 属性。例: last_name / bank_code）
   */
  fillForm(data) {
    const L = this.locators;
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
    if (data.gender)            I.selectOption(L.gender,          data.gender);
    if (data.bank_payment_type) I.selectOption(L.bankPaymentType, data.bank_payment_type);
    if (data.shima_storage_id)  I.selectOption(L.shimaStorageId,  data.shima_storage_id);
    // 支店の候補は金融機関コードで絞られるので必ずこの順
    if (data.bank_code)        pickBankCandidate(I, L.bankCode,       data.bank_code,        L.bankName);
    if (data.bank_branch_code) pickBankCandidate(I, L.bankBranchCode, data.bank_branch_code, L.bankBranchName);
  },

  /**
   * 保存ボタンを押します。成功の確認は {@link waitForSavedRecordId}、エラーの確認は呼び出し側で行います。
   */
  clickSave() {
    I.say('【問合せ登録】保存');
    I.click(this.locators.saveButton);
  },

  /**
   * 問合せ登録画面のフォームをそのまま送信して1件登録します（UI 操作を経由しない）。
   *
   * **何が作られるか**
   * **受講生**が1件できる（testgcp で確認）。ただしこれは検証用に開けてある近道の経路で、
   * 運用の正しい流れとは違う。運用では、年1回 DB に直接流し込まれた候補生
   * （受講生番号は別の基幹システムが発番・個人情報は基本空）を**候補生一覧で検索して
   * 受講生へ登録（昇格）する**。昇格のときに個人情報が入る。
   * つまりここで作られるのは「昇格を経ていない受講生」で、候補生は作れない。
   *
   * **用途**
   * 「受講生が1人いればよい」テストの前提データをすばやく用意するためのもの。
   * 昇格の手順や昇格で作られるデータに依存するテスト、候補生が必要なテストには使えない。
   * 登録画面そのものの検証にも使わない（検証は UI 経由の Scenario で行う）。
   *
   * **仕組み**
   * 送信処理は共通ヘルパー `submitEditViewForm()`（support/shimamura/editViewSubmit.js）に任せる。
   * この画面固有の注意として、URL の `contact_status=5` は送信内容に含まれない
   * （候補生を作る手段ではない）。
   *
   * @param {Object<string, string>} fields 入力する項目（キーは画面の name 属性。例: `{last_name: '山田'}`）
   * @returns {Promise<{status: number, url: string, recordId: string}>} 応答と作成されたレコードの UUID
   * @throws {Error} 未知の項目名が渡された・レコードが作成されなかった場合
   */
  async createContactBySubmit(fields) {
    return submitEditViewForm(I, { path: URLS.CONTACT_REGISTER, fields, label: '問合せ登録' });
  },

  /**
   * 保存ボタンを押した後、受講生詳細へ遷移して URL に record= が付くまで待ち、UUID を返す（#302 でテストから移動）。
   * 付かなければ保存されていない。エラー枠（無ければ本文の先頭）を添えて失敗させる。
   * 二重登録の確認画面のようにエラー枠を使わない画面もあるので、「エラーが出ていない」では判定しない。
   * @returns {Promise<string>} 作成された受講生の record UUID
   * @throws {Error} TIMEOUTS.SCREEN 秒たっても URL に record= が付かない場合
   */
  async waitForSavedRecordId() {
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
    }, SELECTORS.ERROR_CONTAINER);
    throw new Error(`【問合せ登録】保存されませんでした（url=${url}）\n画面の表示: ${shown}`);
  },

};
