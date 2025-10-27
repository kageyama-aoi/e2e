const { I } = inject();

module.exports = {
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
    I.say(`管理メニューの「${tabName}」タブをクリックします。`);
    const tabSelector = this.locators.otherTab(tabName);
    I.waitForElement(tabSelector, 10);
    I.click(tabSelector);
  },

  /**
   * メインメニューから指定された管理タブへ遷移し、ヘッダーテキストを検証します。
   * @param {string} tabName - クリックするタブのテキスト（例: 'コース'）
   * @param {string} expectedTitle - 表示されるべきヘッダーのテキスト（例: 'コース一覧'）
   */
  navigateToAdminTab(tabName, expectedTitle) {
    I.say(`メインメニューから「${tabName}」機能一覧へ遷移します。`);
    I.waitForElement(this.locators.kanriLink, 10);
    I.click(this.locators.kanriLink);
    this.clickOtherTab(tabName);
    I.say(`「${expectedTitle}」が表示されたことを確認します。`);
    I.see(expectedTitle);
  },

  /**
   * サブメニュー内のリンクをクリックして、指定されたヘッダーが表示されることを確認します。
   * @param {string} linkText - クリックするリンクのテキスト（例: 'クラス一覧'）
   * @param {string} [expectedTitle] - (任意) 表示されるべきヘッダーのテキスト（例: 'クラス登録'）
   */
  clickSubMenuLink(linkText, expectedTitle) {
    I.say(`「${linkText}」をクリックしてページへ遷移します。`);
    const linkSelector = this.locators.subMenuLink(linkText);
    I.waitForElement(linkSelector, 10);
    I.click(linkSelector);
    if (expectedTitle) {
      I.say(`「${expectedTitle}」が表示されたことを確認します。`);
      I.see(expectedTitle);
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
    I.say('クラスの検索条件を入力します...');
    I.fillField(this.locators.classNameInput, searchCriteria.className);
    I.selectOption(this.locators.teacherStatusSelect, searchCriteria.teacherStatus);
    I.selectOption(this.locators.courseCategorySelect, searchCriteria.courseCategory);

    I.say('入力された値を確認します...');
    I.seeInField(this.locators.classNameInput, searchCriteria.className);
    I.seeInField(this.locators.teacherStatusSelect, searchCriteria.teacherStatus);
    I.seeInField(this.locators.courseCategorySelect, searchCriteria.courseCategory);

    I.say('検索ボタンをクリックし、結果が表示されるのを待ちます...');
    I.click(this.locators.searchButton);
    I.waitForVisible(this.locators.searchResultsContainer, 10);
    I.say('検索結果が表示されました。');
  },

  /**
   * 検索結果から指定されたクラス名のリンクをクリックします。
   * @param {string} className - クリックするクラスの名称
   */
  selectClassFromSearchResult(className) {
    I.say(`検索結果のクラス「${className}」をクリックします。`);
    const linkLocator = this.locators.searchResultLink(className);
    I.waitForElement(linkLocator, 10);
    I.click(linkLocator);
    // TODO: 次のページ（クラス詳細など）が表示されたことを確認する検証を追加してください。
  },

  // TODO: これ以降のクラス会員登録に関する操作（例: registerNewMember）をメソッドとして追加してください。
};