/**
 * @fileoverview tframe 講師画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('./MenuNavigationMixin');
const { fillTextFields } = require('../../support/utils');

module.exports = {
  /** 講師アイコンのセレクタ（日英） */
  locators: {
    teacherIconJa: 'a:has-text("講師")',
    teacherIconEn: 'a:has-text("Teacher")',
  },

  /**
   * メインメニューの講師アイコンをクリックする
   */
  clickKoshiIcon() {
    I.say('【メインメニュー】講師アイコンをクリック');
    I.waitForElement(this.teacherIconLocator(), 10);
    I.click(this.teacherIconLocator());
  },

  /**
   * メニュー定義に従い全メニュー項目を順番に押下・検証する
   * @param {{groups: Array.<{items: Array.<{name: string, href: string, altName: string}>}>}} menuDefinition - メニュー定義
   * @returns {Promise.<void>}
   */
  async verifyMenuNavigation(menuDefinition) {
    for (const group of menuDefinition.groups) {
      for (const item of group.items) {
        await this.clickMenuItemAndVerify(item);
      }
    }
  },

  /**
   * 1つのメニュー項目を押下し、URL遷移・スクリーンショットを検証する
   * @param {{name: string, href: string, altName: string}} item - メニュー項目
   * @returns {Promise.<void>}
   */
  async clickMenuItemAndVerify(item) {
    const itemName = item.name;
    const expectedHref = item.href;
    I.say(`【子メニュー押下】${itemName}`);
    const resolvedHref = expectedHref || await this.grabHrefByTexts([item.name, item.altName].filter(Boolean));

    if (expectedHref) {
      this.scrollToHref(expectedHref);
      I.waitForElement(locate(`a[href="${expectedHref}"]`), 10);
      this.clickLinkByHref(expectedHref);
    } else {
      this.scrollMenuToTexts([item.name, item.altName].filter(Boolean));
      this.clickLinkByTexts([item.name, item.altName].filter(Boolean));
    }

    I.wait(1);
    const currentUrl = await I.grabCurrentUrl();
    this.assertCurrentUrlMatches(currentUrl, resolvedHref);
    I.saveScreenshotWithTimestamp(this.buildScreenshotName(itemName), true);
    await this.clickSearchIfPresentAndCapture(itemName);
  },

  /**
   * 指定 href のリンクが画面内に表示されるようスクロールする
   * @param {string} href - スクロール先リンクの href
   */
  scrollToHref(href) {
    I.executeScript(
      ({ targetHref }) => {
        const target = document.querySelector(`a[href="${targetHref}"]`);
        if (!target) return false;
        target.scrollIntoView({ block: 'center', inline: 'nearest' });
        return true;
      },
      { targetHref: href }
    );
  },

  /**
   * 複数テキストのいずれかに一致するリンクが画面内に表示されるようスクロールする
   * @param {Array.<string>} texts - 候補テキストの配列
   */
  scrollMenuToTexts(texts) {
    I.executeScript(
      ({ targetTexts }) => {
        const links = Array.from(document.querySelectorAll('a'));
        const target = links.find((link) =>
          targetTexts.some((text) => link.textContent && link.textContent.includes(text))
        );
        if (!target) return false;

        target.scrollIntoView({ block: 'center', inline: 'nearest' });
        return true;
      },
      { targetTexts: texts }
    );
  },

  /**
   * 指定 href のリンクをクリックする
   * @param {string} href - クリックするリンクの href
   */
  clickLinkByHref(href) {
    I.executeScript(
      ({ targetHref }) => {
        const target = document.querySelector(`a[href="${targetHref}"]`);
        if (!target) {
          throw new Error(`link not found: ${targetHref}`);
        }
        target.click();
      },
      { targetHref: href }
    );
  },

  /**
   * 複数テキストのいずれかに一致するリンクをクリックする
   * @param {Array.<string>} texts - 候補テキストの配列
   */
  clickLinkByTexts(texts) {
    I.executeScript(
      ({ targetTexts }) => {
        const links = Array.from(document.querySelectorAll('a'));
        const target = links.find((link) =>
          targetTexts.some((text) => link.textContent && link.textContent.includes(text))
        );
        if (!target) {
          throw new Error(`link not found: ${targetTexts.join(', ')}`);
        }
        target.click();
      },
      { targetTexts: texts }
    );
  },

  /**
   * 複数テキストのいずれかに一致するリンクの href を取得する
   * @param {Array.<string>} texts - 候補テキストの配列
   * @returns {Promise.<string|null>} href 属性値（見つからない場合 null）
   */
  async grabHrefByTexts(texts) {
    return I.executeScript(
      ({ targetTexts }) => {
        const links = Array.from(document.querySelectorAll('a'));
        const target = links.find((link) =>
          targetTexts.some((text) => link.textContent && link.textContent.includes(text))
        );
        return target ? target.getAttribute('href') : null;
      },
      { targetTexts: texts }
    );
  },

  /**
   * 現在の言語設定に合わせた講師アイコンのロケーターを返す
   * @returns {string} セレクタ文字列
   */
  teacherIconLocator() {
    return this.isEnglish() ? this.locators.teacherIconEn : this.locators.teacherIconJa;
  },

  /**
   * 言語設定が英語かどうかを返す
   * @returns {boolean} 英語の場合 true
   */
  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },

  /**
   * 講師登録画面に直接遷移する
   */
  navigateToRegisterPage() {
    I.say('【講師登録】登録画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=teacher%2Few%2F_default');
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * 講師登録フォームの全セクションを入力する
   * @param {object} data - teacherRegisterData.generateTestTeacher() の戻り値
   */
  fillRegistrationForm(data) {
    this.fillPersonalInfo1(data);
    this.fillPersonalInfo2(data);
    this.fillPaymentInfo(data);
    this.fillAddressInfo(data);
    this.fillMemoInfo(data);
  },

  /**
   * 個人情報 1 を入力する（姓・名・ふりがな・電話・性別・生年月日・メール）
   * @param {object} data
   */
  fillPersonalInfo1(data) {
    I.say('【講師登録】個人情報1 を入力');
    fillTextFields(I, {
      lastName:          data.lastName,
      firstName:         data.firstName,
      lastNameFurigana:  data.lastNameFurigana,
      firstNameFurigana: data.firstNameFurigana,
      phone1Number:      data.phone1Number,
      phone2Number:      data.phone2Number,
      email1:            data.email1,
      email2:            data.email2,
    });
    // ドロップダウンは個別処理
    if (data.gender)        I.selectOption('#gender', data.gender);
    if (data.birthdateYear)  I.selectOption('#birthdateYear', data.birthdateYear);
    if (data.birthdateMonth) I.selectOption('#birthdateMonth', data.birthdateMonth);
    if (data.birthdateDay)   I.selectOption('#birthdateDay', data.birthdateDay);
  },

  /**
   * 個人情報 2 を入力する（ID番号・ステイタス・校舎・入社日）
   * @param {object} data
   */
  fillPersonalInfo2(data) {
    I.say('【講師登録】個人情報2 を入力');
    fillTextFields(I, {
      idnumber:   data.idnumber,
      enrollDate: data.enrollDate,
      leaveDate:  data.leaveDate,
    });
    // ドロップダウン・AJAX連動フィールドは個別処理
    if (data.personStatus) I.selectOption('#personStatus', data.personStatus);
    if (data.schoolAreaId) {
      I.selectOption('#school_area_id', data.schoolAreaId);
      I.wait(1);
    }
    if (data.schoolBranchId) I.selectOption('#school_branch_id', data.schoolBranchId);
  },

  /**
   * 支払規定等を入力する（契約形態・支払方法・口座情報）
   * @param {object} data
   */
  fillPaymentInfo(data) {
    I.say('【講師登録】支払規定等 を入力');
    // ドロップダウンは個別処理
    if (data.zeiKubun)        I.selectOption('#zeiKubun', data.zeiKubun);
    if (data.bankPaymentType) I.selectOption('#bankPaymentType', data.bankPaymentType);
    if (data.bankAccountType) I.selectOption('#bankAccountType', data.bankAccountType);
    // AJAX補完フィールドは wait が必要なため個別処理
    if (data.bankCode) {
      I.fillField('#bankCode', data.bankCode);
      I.wait(1);
    }
    if (data.bankBranchCode) {
      I.fillField('#bankBranchCode', data.bankBranchCode);
      I.wait(1);
    }
    fillTextFields(I, {
      bankAccountNo:   data.bankAccountNo,
      bankName:        data.bankName,
      bankBranchName:  data.bankBranchName,
      bankAccountName: data.bankAccountName,
    });
  },

  /**
   * 住所情報を入力する（郵便番号・都道府県・市区町村・番地・住所カナ）
   * @param {object} data
   */
  fillAddressInfo(data) {
    I.say('【講師登録】住所情報 を入力');
    fillTextFields(I, {
      primaryAddressPostalcode: data.primaryAddressPostalcode,
      primaryAddressState:      data.primaryAddressState,
      primaryAddressCity:       data.primaryAddressCity,
      primaryAddressStreet:     data.primaryAddressStreet,
      primaryAddressKana:       data.primaryAddressKana,
    });
  },

  /**
   * メモ情報を入力する
   * @param {object} data
   */
  fillMemoInfo(data) {
    if (!data.description) return;
    I.say('【講師登録】メモ情報 を入力');
    fillTextFields(I, { description: data.description });
  },

  /**
   * 保存ボタンをクリックして登録を実行し、保存後の画面に講師名が表示されることを確認する
   * @param {string} expectedName - 保存後の確認に使用する講師名（姓）
   */
  async submitAndVerifyRegistration(expectedName) {
    I.say('【講師登録】保存ボタンをクリック');
    I.click('#ewSaveButton');
    I.waitForText(expectedName, 10);
  },

  ...createMenuNavigationMixin('tframe_teacher'),
};
