/**
 * @fileoverview tframe 受講生画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');
const createIchiranMixin = require('../_common/IchiranMixin');
const { fillTextFields, submitTframeFormAndVerify } = require('../../../support/utils');

module.exports = {
  /** 受講生アイコンのセレクタ（日英） */
  locators: {
    studentIconJa: 'a:has-text("受講生")',
    studentIconEn: 'a:has-text("Student")',
  },

  /**
   * メインメニューの受講生アイコンをクリックする
   */
  clickJukuseiIcon() {
    I.say('【メインメニュー】受講生アイコンをクリック');
    I.waitForElement(this.studentIconLocator(), 10);
    I.click(this.studentIconLocator());
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
   * 現在の言語設定に合わせた受講生アイコンのロケーターを返す
   * @returns {string} セレクタ文字列
   */
  studentIconLocator() {
    return this.isEnglish() ? this.locators.studentIconEn : this.locators.studentIconJa;
  },

  /**
   * 言語設定が英語かどうかを返す
   * @returns {boolean} 英語の場合 true
   */
  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },

  /**
   * 受講生登録画面へ遷移する
   */
  navigateToRegisterPage() {
    I.say('【受講生登録】登録画面へ遷移');
    if (process.env.USE_MENU_NAV === 'true') {
      const studentText = this.isEnglish() ? 'Student' : '受講生';
      I.click('a:has-text("' + studentText + '")');
      I.waitForElement('a[href*="student%2Few%2F_default"]', 10);
      I.click('a[href*="student%2Few%2F_default"]');
    } else {
      I.amOnPage(process.env.BASE_URL + 'index.php?r=student%2Few%2F_default');
    }
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * 登録フォームの全セクションを入力する
   * @param {object} data - jukusei_touroku_data.csv の1行分
   */
  fillRegistrationForm(data) {
    this.fillPersonalInfo1(data);
    this.fillPersonalInfo2(data);
    this.fillAddressInfo(data);
    this.fillMemoInfo(data);
  },

  /**
   * 個人情報1を入力する（姓・名・ふりがな・電話・性別・生年月日・メール）
   * @param {object} data
   */
  fillPersonalInfo1(data) {
    I.say('【受講生登録】個人情報1 を入力');
    fillTextFields(I, {
      lastName:          data.lastName,
      firstName:         data.firstName,
      lastNameFurigana:  data.lastNameFurigana,
      firstNameFurigana: data.firstNameFurigana,
      phone1Number:      data.phone1Number,
      email1:            data.email1,
    });
    if (data.gender)         I.selectOption('#gender', data.gender);
    if (data.birthdateYear)  I.selectOption('#birthdateYear', data.birthdateYear);
    if (data.birthdateMonth) I.selectOption('#birthdateMonth', data.birthdateMonth);
    if (data.birthdateDay)   I.selectOption('#birthdateDay', data.birthdateDay);
  },

  /**
   * 個人情報2を入力する（ID番号・ステイタス・校舎・入学日など）
   * @param {object} data
   */
  fillPersonalInfo2(data) {
    I.say('【受講生登録】個人情報2 を入力');
    fillTextFields(I, {
      idnumber:    data.idnumber,
      enrollDate:  data.enrollDate,
    });
    if (data.personStatus) I.selectOption('#personStatus', data.personStatus);
    if (data.school_area_id) {
      I.selectOption('#school_area_id', data.school_area_id);
      I.wait(1); // AJAX: エリア選択後に校舎ドロップダウンを更新
    }
    if (data.school_branch_id) I.selectOption('#school_branch_id', data.school_branch_id);
    if (data.grade)            I.selectOption('#grade', data.grade);
  },

  /**
   * 住所情報を入力する（郵便番号ボタンで都道府県・市区町村を自動入力）
   * @param {object} data
   */
  fillAddressInfo(data) {
    if (!data.primaryAddressPostalcode && !data.primaryAddressStreet) return;
    I.say('【受講生登録】住所情報 を入力');
    if (data.primaryAddressPostalcode) {
      I.fillField('#primaryAddressPostalcode', data.primaryAddressPostalcode);
      I.click('#zipCodeBtn');
      I.wait(1); // AJAX: 郵便番号から都道府県・市区町村を自動入力
    }
    fillTextFields(I, {
      primaryAddressStreet: data.primaryAddressStreet,
      primaryAddressKana:   data.primaryAddressKana,
    });
  },

  /**
   * メモ情報を入力する
   * @param {object} data
   */
  fillMemoInfo(data) {
    if (!data.description) return;
    I.say('【受講生登録】メモ情報 を入力');
    fillTextFields(I, { description: data.description });
  },

  /**
   * 保存して受講生名が表示されることを確認する
   * @param {string} expectedName - 保存後の確認に使用する受講生の姓
   */
  async submitAndVerifyRegistration(expectedName) {
    I.say('【受講生登録】保存ボタンをクリック');
    await submitTframeFormAndVerify(I, expectedName);
  },

  // ----------------------------------------------------------------
  //  受講生一覧（SW）
  // ----------------------------------------------------------------

  /**
   * 受講生一覧画面へ遷移する
   */
  navigateToListPage() {
    I.say('【受講生一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=student%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 検索条件を入力する（空フィールドはスキップ）
   * @param {object} data - jukusei_ichiran_search_data.csv の1行分
   */
  fillSearchConditions(data) {
    I.say('【受講生一覧】検索条件を入力');
    if (data.lastName)     I.fillField('#lastName', data.lastName);
    if (data.firstName)    I.fillField('#firstName', data.firstName);
    if (data.idnumber)     I.fillField('#idnumber', data.idnumber);
    if (data.personStatus) I.selectOption('#personStatus', data.personStatus);
    if (data.school_area_id) {
      I.selectOption('#school_area_id', data.school_area_id);
      I.wait(1); // AJAX: エリア選択後に校舎ドロップダウンを更新
    }
    if (data.school_branch_id) I.selectOption('#school_branch_id', data.school_branch_id);
  },

  ...createIchiranMixin('受講生一覧'),

  // ----------------------------------------------------------------
  //  コース別受講生一覧（SW: student/sw/stByCourse）
  // ----------------------------------------------------------------

  /**
   * コース別受講生一覧画面へ遷移する
   */
  navigateToStByCourseListPage() {
    I.say('【コース別受講生一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=student%2Fsw%2FstByCourse');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * コース別受講生一覧の検索条件を入力する（空フィールドはスキップ）
   * @param {object} data - stByCourse_ichiran_search_data.csv の1行分
   */
  fillStByCourseSearchConditions(data) {
    I.say('【コース別受講生一覧】検索条件を入力');
    if (data.courseName) I.fillField('#name', data.courseName);
    if (data.lastName)   I.fillField('#lastName', data.lastName);
  },

  // ----------------------------------------------------------------
  //  受講生別コース一覧（SW: student/sw/courseBySt）
  // ----------------------------------------------------------------

  /**
   * 受講生別コース一覧画面へ遷移する
   */
  navigateToCourseByStListPage() {
    I.say('【受講生別コース一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=student%2Fsw%2FcourseBySt');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 受講生別コース一覧の検索条件を入力する（空フィールドはスキップ）
   * @param {object} data - courseBySt_ichiran_search_data.csv の1行分
   */
  fillCourseByStSearchConditions(data) {
    I.say('【受講生別コース一覧】検索条件を入力');
    if (data.lastName)   I.fillField('#lastName', data.lastName);
    if (data.courseName) I.fillField('#name', data.courseName);
  },

  ...createMenuNavigationMixin('tframe_student'),
};
