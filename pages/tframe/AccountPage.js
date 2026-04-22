/**
 * @fileoverview tframe 法人・団体登録画面 Page Object
 */

const { I } = inject();

module.exports = {

  /**
   * 法人・団体登録画面に直接遷移する
   */
  navigateToRegisterPage() {
    I.say('【法人・団体登録】登録画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=account%2Few%2F_default');
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * 登録フォームの全セクションを入力する
   * @param {object} data - account_touroku_data.csv の1行分
   */
  fillRegistrationForm(data) {
    this.fillGeneralInfo(data);
    this.fillAddressInfo(data);
    this.fillMemoInfo(data);
  },

  /**
   * 全体設定を入力する（法人コード・校舎・法人名・電話番号など）
   * @param {object} data
   */
  fillGeneralInfo(data) {
    I.say('【法人・団体登録】全体設定 を入力');
    if (data.idnumber)           I.fillField('#idnumber', data.idnumber);
    if (data.branchId_area_id) {
      I.selectOption('#branchId_area_id', data.branchId_area_id);
      I.wait(1); // エリア変更後のAJAXリロードを待機
    }
    if (data.branchId_branch_id) I.selectOption('#branchId_branch_id', data.branchId_branch_id);
    if (data.name)               I.fillField('#name', data.name);               // *必須
    if (data.nameFurigana)       I.fillField('#nameFurigana', data.nameFurigana); // *必須
    if (data.phone1Number)       I.fillField('#phone1Number', data.phone1Number);
    if (data.houjinTantosha)     I.fillField('#houjinTantosha', data.houjinTantosha);
    if (data.shareiMeisaiNo)     I.fillField('#shareiMeisaiNo', data.shareiMeisaiNo);
  },

  /**
   * 住所情報を入力する
   * @param {object} data
   */
  fillAddressInfo(data) {
    I.say('【法人・団体登録】住所情報 を入力');
    if (data.primaryAddressPostalcode) I.fillField('#primaryAddressPostalcode', data.primaryAddressPostalcode);
    if (data.primaryAddressState)      I.fillField('#primaryAddressState', data.primaryAddressState);
    if (data.primaryAddressCity)       I.fillField('#primaryAddressCity', data.primaryAddressCity);
    if (data.primaryAddressStreet)     I.fillField('#primaryAddressStreet', data.primaryAddressStreet);
    if (data.primaryAddressKana)       I.fillField('#primaryAddressKana', data.primaryAddressKana);
  },

  /**
   * メモ情報を入力する
   * @param {object} data
   */
  fillMemoInfo(data) {
    if (!data.description) return;
    I.say('【法人・団体登録】メモ情報 を入力');
    I.fillField('#description', data.description);
  },

  /**
   * 保存ボタンをクリックして登録を実行し、保存後の画面に法人名が表示されることを確認する
   * @param {string} expectedName - 保存後の確認に使用する法人・団体名
   */
  async submitAndVerifyRegistration(expectedName) {
    I.say('【法人・団体登録】保存ボタンをクリック');
    I.click('#ewSaveButton');
    I.waitForText(expectedName, 10);
  },
};
