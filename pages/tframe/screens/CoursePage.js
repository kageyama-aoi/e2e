/**
 * @fileoverview tframe コース画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');
const createIchiranMixin = require('../_common/IchiranMixin');
const { fillTextFields } = require('../../../support/utils');
const { isEnglish, submitTframeFormAndVerify } = require('../../../support/tframe/utils');

module.exports = {
  /** コースアイコンのセレクタ（日英） */
  locators: {
    courseIconJa: 'a:has-text("コース")',
    courseIconEn: 'a:has-text("Course")',
  },

  /**
   * メインメニューのコースアイコンをクリックする
   */
  clickCourseIcon() {
    I.say('【メインメニュー】コースアイコンをクリック');
    I.waitForElement(this.courseIconLocator(), 10);
    I.click(this.courseIconLocator());
  },

  /**
   * 指定グループ名のリンクが表示されていることを確認する
   * @param {string} groupName - グループ名
   */
  seeGroup(groupName) {
    I.say(`【グループ確認】${groupName}`);
    this.scrollMenuToText(groupName);
    I.waitForElement(this.linkByText(groupName), 10);
    I.see(groupName);
  },

  /**
   * 指定メニュー項目のリンクが表示されていることを確認する
   * @param {string} itemName - メニュー項目名
   */
  seeMenuItem(itemName) {
    I.say(`【子メニュー確認】${itemName}`);
    this.scrollMenuToText(itemName);
    I.waitForElement(this.linkByText(itemName), 10);
    I.see(itemName);
  },

  /**
   * テキストに一致するリンクのロケーターを返す
   * @param {string} text - リンクテキスト
   * @returns {CodeceptJS.Locator} ロケーター
   */
  linkByText(text) {
    return locate('a').withText(text);
  },

  /**
   * テキストに一致するリンクが画面内に表示されるようスクロールする
   * @param {string} text - スクロール先リンクのテキスト
   */
  scrollMenuToText(text) {
    I.executeScript(
      ({ targetText }) => {
        const links = Array.from(document.querySelectorAll('a'));
        const target = links.find((link) => link.textContent && link.textContent.includes(targetText));
        if (!target) return false;

        target.scrollIntoView({ block: 'center', inline: 'nearest' });
        return true;
      },
      { targetText: text }
    );
  },

  /**
   * メニュー項目に合わせたスクロール処理を行う（href 優先、なければテキスト）
   * @param {{name: string, href: string}} item - メニュー項目
   */
  scrollToItem(item) {
    const itemName = item.name;
    const expectedHref = item.href;
    if (expectedHref) {
      this.scrollToHref(expectedHref);
      return;
    }
    this.scrollMenuToText(itemName);
  },

  /**
   * メニュー項目に対応するリンクロケーターを返す（href 優先、なければテキスト）
   * @param {{name: string, href: string}} item - メニュー項目
   * @returns {CodeceptJS.Locator} ロケーター
   */
  itemLinkLocator(item) {
    const itemName = item.name;
    const expectedHref = item.href;
    if (expectedHref) {
      return locate(`a[href="${expectedHref}"]`);
    }
    return this.linkByText(itemName);
  },

  /**
   * 現在の言語設定に合わせたコースアイコンのロケーターを返す
   * @returns {string} セレクタ文字列
   */
  courseIconLocator() {
    return isEnglish() ? this.locators.courseIconEn : this.locators.courseIconJa;
  },

  /**
   * コース登録画面へ遷移する
   */
  navigateToRegisterPage() {
    I.say('【コース登録】登録画面へ遷移');
    if (process.env.USE_MENU_NAV === 'true') {
      const courseText = isEnglish() ? 'Course' : 'コース';
      I.click('a:has-text("' + courseText + '")');
      I.waitForElement('a[href*="course%2Few"]', 10);
      I.click('a[href*="course%2Few"]');
    } else {
      I.amOnPage(process.env.BASE_URL + 'index.php?r=course%2Few%2F_default');
    }
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * 登録フォームの全セクションを入力する
   * @param {object} data - course_touroku_data.csv の1行分
   */
  fillRegistrationForm(data) {
    this.fillCourseBasicInfo(data);
    this.fillMemoInfo(data);
  },

  /**
   * 基本情報を入力する（コース名・校舎・略称・カテゴリ・年度等）
   * @param {object} data
   */
  fillCourseBasicInfo(data) {
    I.say('【コース登録】基本情報 を入力');
    fillTextFields(I, {
      name:      data.name,
      shortname: data.shortname,
    });
    if (data.school_area_id) {
      I.selectOption('#school_area_id', data.school_area_id);
      I.wait(1); // AJAX: エリア選択後に校舎ドロップダウンを更新
    }
    if (data.school_branch_id)     I.selectOption('#school_branch_id', data.school_branch_id);
    if (data.calendarColorSetting) I.selectOption('#calendarColorSetting', data.calendarColorSetting);
    if (data.subtype)              I.selectOption('#subtype', data.subtype);
    if (data.courseCategory)       I.selectOption('#courseCategory', data.courseCategory);
    if (data.nendoYear)            I.selectOption('#nendoYear', data.nendoYear);
    if (data.gesshaEndYear)        I.selectOption('#gesshaEndYear', data.gesshaEndYear);
    if (data.gesshaEndMonth)       I.selectOption('#gesshaEndMonth', data.gesshaEndMonth);
  },

  /**
   * メモ情報を入力する
   * @param {object} data
   */
  fillMemoInfo(data) {
    if (!data.description) return;
    I.say('【コース登録】メモ情報 を入力');
    fillTextFields(I, { description: data.description });
  },

  /**
   * 保存してコース名が表示されることを確認する
   * @param {string} expectedName - 保存後の確認に使用するコース名
   */
  async submitAndVerifyRegistration(expectedName) {
    I.say('【コース登録】保存ボタンをクリック');
    await submitTframeFormAndVerify(I, expectedName);
  },

  // ----------------------------------------------------------------
  //  コース一覧（SW）
  // ----------------------------------------------------------------

  /**
   * コース一覧画面へ遷移する
   */
  navigateToListPage() {
    I.say('【コース一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=course%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 検索条件を入力する（空フィールドはスキップ）
   * @param {object} data - course_ichiran_search_data.csv の1行分
   */
  fillSearchConditions(data) {
    I.say('【コース一覧】検索条件を入力');
    if (data.name)         I.fillField('#name', data.name);
    if (data.courseCategory) I.selectOption('#courseCategory', data.courseCategory);
    if (data.nendoYear)    I.selectOption('#nendoYear', data.nendoYear);
    if (data.school_area_id) {
      I.selectOption('#school_area_id', data.school_area_id);
      I.wait(1); // AJAX: エリア選択後に校舎ドロップダウンを更新
    }
    if (data.school_branch_id) I.selectOption('#school_branch_id', data.school_branch_id);
  },

  ...createIchiranMixin('コース一覧'),

  // ----------------------------------------------------------------
  //  コース別商品一覧（SW）
  // ----------------------------------------------------------------

  /**
   * コース別商品一覧画面へ遷移する
   */
  navigateToProByCourseListPage() {
    I.say('【コース別商品一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=course%2Fsw%2FproByCourse');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * コース別商品一覧の検索条件を入力する（空フィールドはスキップ）
   * @param {object} data - proByCourse_ichiran_search_data.csv の1行分
   */
  fillProByCourseSearchConditions(data) {
    I.say('【コース別商品一覧】検索条件を入力');
    if (data.name)        I.fillField('#name', data.name);
    if (data.productName) I.fillField('#productName', data.productName);
  },

  ...createMenuNavigationMixin('tframe_course'),
};
