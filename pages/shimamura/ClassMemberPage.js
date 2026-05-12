const { I } = inject();
const { attachScreenshotFromOutput, parseEnvBoolean } = require('../../support/utils');

module.exports = {
  /**
   * 画面遷移スクリーンショットのON/OFFを判定します。
   * @returns {boolean}
   */
  isNavScreenshotEnabled() {
    return parseEnvBoolean('SCREENSHOT_ON_NAVIGATION');
  },

  /**
   * スクリーンショット用の名前を簡易的に整形します。
   * @param {string} name
   * @returns {string}
   */
  buildNavScreenshotName(name) {
    return String(name || 'unknown')
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '_')
      .trim();
  },
  /**
   * ページ内の要素（セレクタ）を定義します
   */
  locators: {
    // メインメニュー
    kanriLink: 'a.myAreaLink:has-text("管理")', // 「管理」リンク
    // 管理メニューのタブを動的に見つけるための関数
    // 例: this.locators.otherTab('コース') は 'a.otherTab:has-text("コース")' を返す
    otherTab: (tabName) => `a.otherTab:has-text("${tabName}")`,
    subMenuLink: (linkText) => `a:has-text("${linkText}")`, // サブメニューのリンク
    // TODO: 以下のセレクタは推測です。実際の画面に合わせて修正してください。
    classNameInput: { name: 'name' },
    teacherStatusSelect: { name: 'contact_status' },
    courseCategorySelect: { name: 'course_category' },
    searchButton: { css: 'input[type="button"][value="検索"]' },
    searchResultsContainer: '#search_result_list', // 検索結果が表示されるコンテナ
    searchResultLink: (className) => ({ css: `a.listViewTdLinkS1:has-text("${className}")` }),
  },

  /**
   * 管理メニューのタブをクリックします。
   * @param {string} tabName - クリックするタブのテキスト（例: 'コース', '講師'）
   */
  clickOtherTab(tabName) {
    I.say(`【管理メニュー】「${tabName}」タブをクリック`);
    const tabSelector = this.locators.otherTab(tabName);
    I.waitForElement(tabSelector, 10);
    I.click(tabSelector);
  },

  /**
   * メインメニューから指定された管理タブへ遷移し、ヘッダーテキストを検証します。
   * @param {string} tabName - クリックするタブのテキスト（例: 'コース'）
   * @param {string} expectedTitle - 表示されるべきヘッダーのテキスト（例: 'コース一覧'）
   */
  async navigateToAdminTab(I,tabName, expectedTitle) {
    I.say('=== 管理メニュー遷移 開始 ===');
    I.say(`【メインメニュー】「${tabName}」機能一覧へ`);
    I.waitForElement(this.locators.kanriLink, 10);
    I.click(this.locators.kanriLink);
    this.clickOtherTab(tabName);
    I.say(`【画面確認】「${expectedTitle}」表示`);
    I.see(expectedTitle);
    I.say(`${expectedTitle}\nURL: ${await I.grabCurrentUrl()}`);
    I.say('=== 管理メニュー遷移 終了 ===');
  },

  /**
   * サブメニュー内のリンクをクリックして、指定されたヘッダーが表示されることを確認します。
   * @param {string} linkText - クリックするリンクのテキスト（例: 'クラス一覧'）
   * @param {string} [expectedTitle] - (任意) 表示されるべきヘッダーのテキスト（例: 'クラス登録'）
   */
  async clickSubMenuLink(linkText, expectedTitle) {
    const linkSelector = this.locators.subMenuLink(linkText);
    I.waitForElement(linkSelector, 10);
    if (this.isNavScreenshotEnabled()) {
      const baseName = this.buildNavScreenshotName(linkText);
      const fileName = await I.saveScreenshotWithTimestamp(`NAV_before_${baseName}.png`);
      attachScreenshotFromOutput(fileName, '画面遷移_前');
    }
    I.click(linkSelector);
    if (expectedTitle) {
      I.see(expectedTitle);
    }
    if (this.isNavScreenshotEnabled()) {
      const baseName = this.buildNavScreenshotName(expectedTitle || linkText);
      const fileName = await I.saveScreenshotWithTimestamp(`NAV_after_${baseName}.png`);
      attachScreenshotFromOutput(fileName, '画面遷移_後');
    }
  },

  /**
   * クラスを検索し、結果が表示されるのを待ちます。
   * @param {object} searchCriteria - 検索条件
   * @param {string} searchCriteria.className - クラス名
   * @param {string} searchCriteria.teacherStatus - 講師のステイタス
   * @param {string} searchCriteria.courseCategory - コースカテゴリー
   */
  searchClass(searchCriteria) {
    I.say('【クラス検索】条件入力');
    I.fillField(this.locators.classNameInput, searchCriteria.className);
    I.selectOption(this.locators.teacherStatusSelect, searchCriteria.teacherStatus);
    I.selectOption(this.locators.courseCategorySelect, searchCriteria.courseCategory);

    I.say('【クラス検索】入力内容の確認');
    I.seeInField(this.locators.classNameInput, searchCriteria.className);
    I.seeInField(this.locators.teacherStatusSelect, searchCriteria.teacherStatus);
    I.seeInField(this.locators.courseCategorySelect, searchCriteria.courseCategory);

    I.say('【クラス検索】検索実行');
    I.click(this.locators.searchButton);
    I.waitForVisible(this.locators.searchResultsContainer, 10);
    I.say('【クラス検索】結果表示');
  },

  /**
   * 検索結果から指定されたクラス名のリンクをクリックします。
   * @param {string} className - クリックするクラスの名称
   */
  selectClassFromSearchResult(className) {
    I.say(`【クラス検索】結果から「${className}」を選択`);
    const linkLocator = this.locators.searchResultLink(className);
    I.waitForElement(linkLocator, 10);
    I.click(linkLocator);
    // TODO: 次のページ（クラス詳細など）が表示されたことを確認する検証を追加してください。
  },

  // TODO: これ以降のクラス受講生登録に関する操作（例: registerNewMember）をメソッドとして追加してください。

  // ----------------------------------------------------------------
  //  入出金一覧（ListView）
  // ----------------------------------------------------------------

  /**
   * 入出金一覧画面へ遷移する（URL 直遷移）
   */
  navigateToTransactionListPage() {
    I.say('【入出金一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + '/index.php?module=Transaction&action=index&top_menu=1');
    I.waitForElement('input[name="search"]', 10);
    // 日付フィールドがデフォルトで今日のみに設定されるためクリアして全期間対象にする
    I.clearField('input[name="date_group1_rstart"]');
    I.clearField('input[name="date_group1_rend"]');
  },

  /**
   * 検索条件を入力する（空フィールドはスキップ）
   * @param {object} data - transaction_ichiran_search_data.csv の1行分
   */
  fillTransactionSearchConditions(data) {
    I.say('【入出金一覧】検索条件を入力');
    if (data.last_name)    I.fillField('input[name="last_name"]', data.last_name);
    if (data.course_name)  I.fillField('input[name="course_name"]', data.course_name);
    if (data.area_id)      I.selectOption('select[name="area_id"]', data.area_id);
    if (data.school_id)    I.selectOption('select[name="school_id"]', data.school_id);
    if (data.smsgroup)     I.selectOption('select[name="smsgroup"]', data.smsgroup);
    if (data.claim_type)   I.selectOption('select[name="claim_type"]', data.claim_type);
    if (data.payment_type) I.selectOption('select[name="payment_type"]', data.payment_type);
  },

  /**
   * 検索ボタンをクリックし、結果が表示されるまで待つ
   */
  clickTransactionSearchAndWait() {
    I.say('【入出金一覧】検索実行');
    I.click('input[name="search"]');
    I.waitForElement('a.listViewTdLinkS1', 15);
  },

  /**
   * 検索結果に1件以上のリンクがあることを確認する
   */
  verifyTransactionResultsExist() {
    I.say('【入出金一覧】検索結果が表示されることを確認');
    I.seeElement('a.listViewTdLinkS1');
  },

  /**
   * 検索結果に指定テキストが表示されることを確認する
   * @param {string} expectedText - 結果一覧に表示されるべき文字列
   */
  verifyTransactionRecordInResults(expectedText) {
    I.say(`【入出金一覧】"${expectedText}" が結果に表示されることを確認`);
    I.see(expectedText, 'a.listViewTdLinkS1');
  },

  // ----------------------------------------------------------------
  //  受講生検索 (student_search)
  // ----------------------------------------------------------------

  navigateToStudentSearchPage() {
    I.say('【受講生検索】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + '/index.php?module=Student&action=index&top_menu=1');
    I.waitForElement('input[name="search"]', 10);
    I.clearField('input[name="date_group1_rstart"]');
    I.clearField('input[name="date_group1_rend"]');
  },

  fillStudentSearchConditions(data) {
    I.say('【受講生検索】検索条件を入力');
    if (data.last_name)  I.fillField('input[name="last_name"]', data.last_name);
    if (data.first_name) I.fillField('input[name="first_name"]', data.first_name);
    if (data.school_id)  I.selectOption('select[name="school_id"]', data.school_id);
  },

  clickStudentSearchAndWait() {
    I.say('【受講生検索】検索実行');
    I.click('input[name="search"]');
    I.waitForElement('a.listViewTdLinkS1', 15);
  },

  verifyStudentResultsExist() {
    I.say('【受講生検索】検索結果が表示されることを確認');
    I.seeElement('a.listViewTdLinkS1');
  },

  verifyStudentRecordInResults(expectedText) {
    I.say(`【受講生検索】"${expectedText}" が結果に表示されることを確認`);
    I.see(expectedText, 'a.listViewTdLinkS1');
  },

  // ----------------------------------------------------------------
  //  問合せ一覧（候補生）(contact_list)
  // ----------------------------------------------------------------

  navigateToContactListPage() {
    I.say('【問合せ一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + '/index.php?module=Student&action=index&contact_status=5&top_menu=1');
    I.waitForElement('input[name="search"]', 10);
    I.clearField('input[name="date_group1_rstart"]');
    I.clearField('input[name="date_group1_rend"]');
  },

  fillContactListSearchConditions(data) {
    I.say('【問合せ一覧】検索条件を入力');
    if (data.last_name)  I.fillField('input[name="last_name"]', data.last_name);
    if (data.first_name) I.fillField('input[name="first_name"]', data.first_name);
  },

  clickContactListSearchAndWait() {
    I.say('【問合せ一覧】検索実行');
    I.click('input[name="search"]');
    I.waitForElement('a.listViewTdLinkS1', 15);
  },

  verifyContactListResultsExist() {
    I.say('【問合せ一覧】検索結果が表示されることを確認');
    I.seeElement('a.listViewTdLinkS1');
  },

  verifyContactListRecordInResults(expectedText) {
    I.say(`【問合せ一覧】"${expectedText}" が結果に表示されることを確認`);
    I.see(expectedText, 'a.listViewTdLinkS1');
  },

  // ----------------------------------------------------------------
  //  コース別受講生一覧 (course_by_student)
  // ----------------------------------------------------------------

  navigateToCourseByStudentPage() {
    I.say('【コース別受講生一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + '/index.php?module=Student&action=index&contact_status=0&course_list=true&initial_state&top_menu=1');
    I.waitForElement('input[name="search"]', 10);
  },

  fillCourseByStudentSearchConditions(data) {
    I.say('【コース別受講生一覧】検索条件を入力');
    if (data.course_name) I.fillField('input[name="course_name"]', data.course_name);
    if (data.school_id)   I.selectOption('select[name="school_id"]', data.school_id);
  },

  clickCourseByStudentSearchAndWait() {
    I.say('【コース別受講生一覧】検索実行');
    I.click('input[name="search"]');
    I.waitForElement('a.listViewTdLinkS1', 15);
  },

  verifyCourseByStudentResultsExist() {
    I.say('【コース別受講生一覧】検索結果が表示されることを確認');
    I.seeElement('a.listViewTdLinkS1');
  },

  verifyCourseByStudentRecordInResults(expectedText) {
    I.say(`【コース別受講生一覧】"${expectedText}" が結果に表示されることを確認`);
    I.see(expectedText, 'a.listViewTdLinkS1');
  },

  // ----------------------------------------------------------------
  //  クラス一覧 (class_list)
  // ----------------------------------------------------------------

  navigateToClassListPage() {
    I.say('【クラス一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + '/index.php?module=Course&action=ListView&course_list=true&query=true&initial_state');
    I.waitForElement('input[name="search"]', 10);
  },

  fillClassListSearchConditions(data) {
    I.say('【クラス一覧】検索条件を入力');
    if (data.name)      I.fillField('input[name="name"]', data.name);
    if (data.school_id) I.selectOption('select[name="school_id"]', data.school_id);
  },

  clickClassListSearchAndWait() {
    I.say('【クラス一覧】検索実行');
    I.click('input[name="search"]');
    I.waitForElement('a.listViewTdLinkS1', 15);
  },

  verifyClassListResultsExist() {
    I.say('【クラス一覧】検索結果が表示されることを確認');
    I.seeElement('a.listViewTdLinkS1');
  },

  verifyClassListRecordInResults(expectedText) {
    I.say(`【クラス一覧】"${expectedText}" が結果に表示されることを確認`);
    I.see(expectedText, 'a.listViewTdLinkS1');
  },

  // ----------------------------------------------------------------
  //  講師一覧 (teacher_list)
  // ----------------------------------------------------------------

  navigateToTeacherListPage() {
    I.say('【講師一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + '/index.php?module=Teacher&action=index&top_menu=1');
    I.waitForElement('input[name="search"]', 10);
  },

  fillTeacherListSearchConditions(data) {
    I.say('【講師一覧】検索条件を入力');
    if (data.last_name)  I.fillField('input[name="last_name"]', data.last_name);
    if (data.first_name) I.fillField('input[name="first_name"]', data.first_name);
    if (data.school_id)  I.selectOption('select[name="school_id"]', data.school_id);
  },

  clickTeacherListSearchAndWait() {
    I.say('【講師一覧】検索実行');
    I.click('input[name="search"]');
    I.waitForElement('a.listViewTdLinkS1', 15);
  },

  verifyTeacherListResultsExist() {
    I.say('【講師一覧】検索結果が表示されることを確認');
    I.seeElement('a.listViewTdLinkS1');
  },

  verifyTeacherListRecordInResults(expectedText) {
    I.say(`【講師一覧】"${expectedText}" が結果に表示されることを確認`);
    I.see(expectedText, 'a.listViewTdLinkS1');
  },

  // ----------------------------------------------------------------
  //  コース一覧（管理）(course_ichiran)
  // ----------------------------------------------------------------

  navigateToCourseIchiranPage() {
    I.say('【コース一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + '/index.php?module=Course&action=index&top_menu=1');
    I.waitForElement('input[name="search"]', 10);
  },

  fillCourseIchiranSearchConditions(data) {
    I.say('【コース一覧】検索条件を入力');
    if (data.name)      I.fillField('input[name="name"]', data.name);
    if (data.school_id) I.selectOption('select[name="school_id"]', data.school_id);
  },

  clickCourseIchiranSearchAndWait() {
    I.say('【コース一覧】検索実行');
    I.click('input[name="search"]');
    I.waitForElement('a.listViewTdLinkS1', 15);
  },

  verifyCourseIchiranResultsExist() {
    I.say('【コース一覧】検索結果が表示されることを確認');
    I.seeElement('a.listViewTdLinkS1');
  },

  verifyCourseIchiranRecordInResults(expectedText) {
    I.say(`【コース一覧】"${expectedText}" が結果に表示されることを確認`);
    I.see(expectedText, 'a.listViewTdLinkS1');
  },

  // ----------------------------------------------------------------
  //  コンタクト一覧 (contact_module_list)
  // ----------------------------------------------------------------

  navigateToContactModuleListPage() {
    I.say('【コンタクト一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + '/index.php?module=Contacts&action=index&top_menu=1');
    I.waitForElement('input[name="search"]', 10);
  },

  fillContactModuleListSearchConditions(data) {
    I.say('【コンタクト一覧】検索条件を入力');
    if (data.last_name)    I.fillField('input[name="last_name"]', data.last_name);
    if (data.company_name) I.fillField('input[name="company_name"]', data.company_name);
    if (data.school_id)    I.selectOption('select[name="school_id"]', data.school_id);
  },

  clickContactModuleListSearchAndWait() {
    I.say('【コンタクト一覧】検索実行');
    I.click('input[name="search"]');
    I.waitForElement('a.listViewTdLinkS1', 15);
  },

  verifyContactModuleListResultsExist() {
    I.say('【コンタクト一覧】検索結果が表示されることを確認');
    I.seeElement('a.listViewTdLinkS1');
  },

  verifyContactModuleListRecordInResults(expectedText) {
    I.say(`【コンタクト一覧】"${expectedText}" が結果に表示されることを確認`);
    I.see(expectedText, 'a.listViewTdLinkS1');
  },

  // ----------------------------------------------------------------
  //  未収金一覧 (mishukin_list)
  //  ※ 結果リンクは listViewTdLinkS1 を使わない特殊テーブル形式。
  //    ページネーションセレクタ .listViewPaginationTdS1 を結果確認に使う。
  // ----------------------------------------------------------------

  navigateToMishukinListPage() {
    I.say('【未収金一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + '/index.php?module=Transaction&action=LWMishukin_AN&query=true');
    I.waitForElement('input[name="search"]', 10);
  },

  fillMishukinSearchConditions(data) {
    I.say('【未収金一覧】検索条件を入力');
    if (data.last_name)  I.fillField('input[name="last_name"]', data.last_name);
    if (data.query_date) {
      I.clearField('input[name="query_date"]');
      I.fillField('input[name="query_date"]', data.query_date);
    }
    if (data.school_id)  I.selectOption('select[name="school_id"]', data.school_id);
  },

  clickMishukinSearchAndWait() {
    I.say('【未収金一覧】検索実行');
    I.click('input[name="search"]');
    I.waitForElement('.listViewPaginationTdS1', 15);
  },

  verifyMishukinTableVisible() {
    I.say('【未収金一覧】結果テーブルが表示されることを確認');
    I.seeElement('.listViewPaginationTdS1');
  },

  // ----------------------------------------------------------------
  //  受注・売上（経理）(keiri_invoices)
  //  ※ POST form: 表示ボタン = input[name="button"][value="表示"]
  //    日付は keiri_month_year / keiri_month_month / keiri_month_day の3セレクト。
  //    デフォルトは現在年月・日は "00"（月全体）。
  // ----------------------------------------------------------------

  navigateToKeiriInvoicesPage() {
    I.say('【受注・売上】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + '/index.php?module=Keiri&action=index&keiri_report_type=Invoices&top_menu=1');
    I.waitForElement('select[name="keiri_month_year"]', 10);
  },

  fillKeiriInvoicesSearchConditions(data) {
    I.say('【受注・売上】検索条件を入力');
    if (data.keiri_year)  I.selectOption('select[name="keiri_month_year"]',  data.keiri_year);
    if (data.keiri_month) I.selectOption('select[name="keiri_month_month"]', data.keiri_month);
    if (data.keiri_day)   I.selectOption('select[name="keiri_month_day"]',   data.keiri_day);
  },

  clickKeiriInvoicesDisplayAndWait() {
    I.say('【受注・売上】表示ボタンをクリック');
    I.click('input[name="button"][value="表示"]');
    I.waitForElement('select[name="keiri_month_year"]', 15);
  },

  verifyKeiriInvoicesPageLoaded() {
    I.say('【受注・売上】フォームが再表示されることを確認');
    I.seeElement('select[name="keiri_month_year"]');
  },

  // ----------------------------------------------------------------
  //  本日の出席表一覧 (attendance_today)
  //  ※ POST form: 表示ボタン = input[name="button"][value="出席表表示"]
  //    日付は start_date / end_date（テキスト入力 YYYY-MM-DD）。
  //    edit_button（出席表編集）は絶対クリックしないこと。
  // ----------------------------------------------------------------

  navigateToAttendanceTodayPage() {
    I.say('【出席表一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + '/index.php?module=Course&action=AttendanceViewDetailed&initial_state=menu');
    I.waitForElement('input[name="button"][value="出席表表示"]', 10);
  },

  fillAttendanceTodaySearchConditions(data) {
    I.say('【出席表一覧】検索条件を入力');
    if (data.start_date) {
      I.clearField('input[name="start_date"]');
      I.fillField('input[name="start_date"]', data.start_date);
    }
    if (data.end_date) {
      I.clearField('input[name="end_date"]');
      I.fillField('input[name="end_date"]', data.end_date);
    }
  },

  clickAttendanceTodayDisplayAndWait() {
    I.say('【出席表一覧】出席表表示ボタンをクリック');
    I.click('input[name="button"][value="出席表表示"]');
    I.waitForElement('.listViewPaginationTdS1', 15);
  },

  verifyAttendanceTodayPageLoaded() {
    I.say('【出席表一覧】ページが表示されることを確認');
    I.seeElement('.listViewPaginationTdS1');
  },
};
