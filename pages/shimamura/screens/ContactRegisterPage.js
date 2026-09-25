'use strict';

const { I } = inject();
const { URLS, TIMEOUTS, BASE_URL } = require('../../../support/shimamura/constants');
const { submitEditViewForm } = require('../../../support/shimamura/editViewSubmit');

module.exports = {

  locators: {
    saveButton: 'input[name="save_button"]',
    editForm: 'EditView',
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

};
