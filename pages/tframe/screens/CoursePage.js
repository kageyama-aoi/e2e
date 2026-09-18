/**
 * @fileoverview tframe コース画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');
const createIchiranMixin = require('../_common/IchiranMixin');
const { fillTextFields } = require('../../../support/utils');
const { isEnglish, submitTframeFormAndVerify, selectAreaThenBranch } = require('../../../support/tframe/utils');
const { setDateField, resetSelects, verifyResultRowsExist } = require('../_common/IchiranSearchMixin');
const { TIMEOUTS } = require('../../../support/tframe/constants');

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
    selectAreaThenBranch(I, { area: data.school_area_id, branch: data.school_branch_id });
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
   * @param {object} data - course_ichiran_search_data.csv / course_ichiran_sort_data.csv の1行分
   */
  fillSearchConditions(data) {
    I.say('【コース一覧】検索条件を入力');
    fillTextFields(I, { name: data.name, code: data.code });
    if (data.courseCategory) I.selectOption('#courseCategory', data.courseCategory);
    if (data.nendoYear)    I.selectOption('#nendoYear', data.nendoYear);
    selectAreaThenBranch(I, { area: data.school_area_id, branch: data.school_branch_id });
  },

  /**
   * 検索条件をすべてクリアし、エリア・校舎を「すべて」にする（検索範囲を最大にする）。
   * 同一ログインで複数ケースを回すとき、前ケースの条件が残らないようにするために使う。
   */
  resetSearchConditions() {
    I.say('【コース一覧】検索条件をクリア（エリア・校舎は「すべて」）');
    I.fillField('#name', '');
    I.fillField('#code', '');
    resetSelects(['courseCategory', 'nendoYear']);
    I.selectOption('#school_area_id', '');
    I.wait(TIMEOUTS.AJAX_SELECT); // AJAX: エリア変更で校舎ドロップダウンを更新
    I.selectOption('#school_branch_id', '');
  },

  /**
   * 検索結果に実データ行が出るまで待って確認する（thead 行で空振りしない版）
   */
  async verifyListRowsExist() {
    await verifyResultRowsExist('コース一覧');
  },

  /**
   * コース一覧の列ヘッダソート仕様（#223・culture_beta で実機確認）。
   * - columns: ソート可能列のキー → 値の型
   * - secondary: 第1キー同値時の並び（画面側の裏設定）。コース一覧はレコードID昇順で、
   *   第1キーの昇順/降順に関係なく常に昇順。
   */
  sortSpec: {
    columns: { name: 'string', courseCategory: 'string', nendo: 'number' },
    secondary: { key: '_recordId', type: 'string', dir: 'asc' },
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
    fillTextFields(I, {
      name:        data.name,
      productName: data.productName,
    });
  },

  // ----------------------------------------------------------------
  //  本日の出席表一覧（SW: attendance/sw/_default）
  // ----------------------------------------------------------------
  // 校舎により出席データの在庫に大きな差があり、既定の東京(b1)は0件になりやすい。
  // また rangeFrom/rangeTo の既定値は「本日」のみなので検索前に広げる（#213）。

  /**
   * 本日の出席表一覧画面へ遷移する
   */
  navigateToAttendanceListPage() {
    I.say('【出席表一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=attendance%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 出席表一覧の検索条件を入力する
   * @param {object} data - attendance_ichiran_search_data.csv の1行分
   *                        （dateFrom / dateTo / branchValue / courseCategory / courseSubtype）
   */
  fillAttendanceSearchConditions(data) {
    I.say('【出席表一覧】検索条件を入力');
    resetSelects(['courseSubtype', 'courseCategory']);
    setDateField('rangeFrom', data.dateFrom);
    setDateField('rangeTo', data.dateTo);
    selectAreaThenBranch(I, {
      areaSelector: '#branchId_area_id', branchSelector: '#branchId_branch_id',
      area: data.areaValue, branch: data.branchValue,
    });
    if (data.courseCategory) I.selectOption('#courseCategory', data.courseCategory);
    if (data.courseSubtype) I.selectOption('#courseSubtype', data.courseSubtype);
  },

  /**
   * 検索結果テーブルに実データ行が1件以上あることを確認する（`IchiranSearchMixin` へ委譲）。
   * AJAX描画のタイミング差が大きい画面のため `verifyResultsExist`（即時判定）ではなくこちらを使う。
   */
  async verifyAttendanceResultRowsExist() {
    await verifyResultRowsExist('出席表一覧');
  },

  // 出席表一括出力（SW: attendance/sw/attendanceBulkOutput）は #218 で追跡（未着手）。
  // コース選択は selectFirstFromPopupPicker（support/tframe/utils.js）でモーダルから選択できる
  // ところまで確認したが、先頭コースの実施期間が出力対象のスケジュール範囲（既定=当月・
  // 最大21日まで）と重ならず「コースが選択されていません。」エラーになる（実機で選択できて
  // いることは確認済み。コース未選択エラーではなくメッセージが誤解を招く）。
  // 21日上限があるため #213 の校舎スイープのような単純な範囲拡大では回避できず、
  // 出力対象期間内にスケジュールを持つコースを選ぶ工夫が必要。

  ...createMenuNavigationMixin('tframe_course'),
};
