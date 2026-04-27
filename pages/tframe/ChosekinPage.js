/**
 * @fileoverview tframe 調整金登録画面 Page Object
 * URL: index.php?r=shareiDetail%2Few%2F_default
 */

const { I } = inject();
const { fillTextFields, submitTframeFormAndVerify, isEnglish } = require('../../support/utils');

module.exports = {

  /**
   * 調整金登録画面へ遷移する
   */
  navigateToRegisterPage() {
    I.say('【調整金登録】登録画面へ遷移');
    if (process.env.USE_MENU_NAV === 'true') {
      I.click(`a:has-text("${isEnglish() ? 'Accounting' : '経理'}")`);
      I.waitForElement('a[href*="shareiDetail%2Few"]', 10);
      I.click('a[href*="shareiDetail%2Few"]');
    } else {
      I.amOnPage(process.env.BASE_URL + 'index.php?r=shareiDetail%2Few%2F_default');
    }
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * 登録フォームの全セクションを入力する
   * @param {object} data - chosekin_touroku_data.csv の1行分
   */
  fillRegistrationForm(data) {
    this.fillChosekinInfo(data);
  },

  /**
   * 調整金設定を入力する（校舎・対象日・計上日・謝礼項目・金額）
   * すべて必須フィールド
   * @param {object} data
   */
  fillChosekinInfo(data) {
    I.say('【調整金登録】調整金設定 を入力');

    // 講師はポップアップピッカー: CSV に personId があれば JS で直接設定、なければ一覧から先頭を選択
    if (data.personId) {
      I.executeScript((id) => { document.getElementById('personId').value = id; }, data.personId);
    } else {
      I.click('#personId_start');
      // ポップアップ内の tf-radio span（カスタム radio）が表示されるまで待つ
      I.waitForVisible('.tf-radio.tf-radio-primary', 10);
      I.click(locate('.tf-radio.tf-radio-primary').first());
      I.waitForInvisible('.tf-radio.tf-radio-primary', 10);
      I.wait(0.5);
    }

    // 校舎はAJAX連動ドロップダウン（エリア→校舎）
    if (data.school_area_id) {
      I.selectOption('#school_area_id', data.school_area_id);
      I.wait(1); // AJAX: エリア選択後に校舎ドロップダウンを更新
    }
    if (data.school_branch_id) I.selectOption('#school_branch_id', data.school_branch_id);

    fillTextFields(I, {
      fromDatetime: data.fromDatetime,
      keijoubi:     data.keijoubi,
      houshugaku:   data.houshugaku,
    });
    if (data.shareiKomoku) I.selectOption('#shareiKomoku', data.shareiKomoku);
  },

  /**
   * 保存して調整金詳細ページへ遷移したことを確認する
   * @param {string} expectedValue - 保存後の確認テキスト（通常は "調整金詳細"）
   */
  async submitAndVerifyRegistration(expectedValue) {
    I.say('【調整金登録】保存ボタンをクリック');
    await submitTframeFormAndVerify(I, expectedValue);
  },
};
