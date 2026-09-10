const { I } = inject();
const { attachScreenshotFromOutput, parseEnvBoolean, logScreenUrl } = require('../../../support/utils');
const { TIMEOUTS, SELECTORS } = require('../../../support/shimamura/constants');
const { toggleGroupmenu } = require('../../../support/shimamura/utils');
const { resolveUnfinishedKeiriDataIfPresent } = require('../flow/SyokaiFlowPage');

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

    // 退会処理: 受講生詳細画面の個人情報1タブ操作
    taikai: {
      detailTitle: '受講生詳細',
      submenuIconId: 'submenu__detailviews_sub',
      submenuMenuName: '閲覧/登録・経理ビュー',
      paymentGroupAccordion: 'div[onclick*="payment_det_group"]',
      kojin1Accordion: 'div[onclick*="kojin_1"]',
      detailMainTitle: '受講生詳細',
      detailSubTitle: '個人情報１',
      taikaiButton: '退会処理',
    },

    // 受講生一覧検索（ID番号検索→詳細へ）
    studentSearch: {
      screenName: '受講生一覧',
      idnumberField: '#idnumber',
      searchButton: '検索',
      resultList: SELECTORS.RESULT_LINK,
      resultLink: `a${SELECTORS.RESULT_LINK}`,
    },

    // クラス受講生登録: クラス一覧検索
    classListSearch: {
      fields: {
        name: 'name',
        display: 'display_hyouji',
        status: 'contact_status',
        area: 'area_id',
        school: 'school_id',
        courseCategory: 'course_category',
      },
      options: {
        display: 'すべて',
        status: '下記の項目のすべて',
        area: 'すべて',
        school: 'すべて',
        courseCategory: '発表会',
      },
      buttons: { search: '検索' },
      results: {
        row: SELECTORS.RESULT_LINK,
        link: `a${SELECTORS.RESULT_LINK}`,
        linkIndex: 2,
      },
    },

    // クラス受講生登録: クラス詳細の受講生タブ・コース選択
    classDetailTabs: {
      studentTabLink: '#tab_link_student_tab',
      studentTabActive: '#tab_li_student_tab.active',
      coursePulldown: '#cs_course_seletion_pulldown',
      selectButton: '発表会選択',
    },

    // 経理返金処理: 経理メニュー→返金一覧
    keiriRefundList: {
      submenuIconId: 'submenu__transaction_sub',
      submenuMenuName: '入出金',
      linkName: '返金一覧',
    },
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
   * 受講生詳細画面から「個人情報１」タブへ移動します。
   * 「経理処理が完了してないデータがあります」警告解消フロー（navigateToTaikaiScreen）から
   * 状態リセットのため複数回呼ばれることがあります。
   */
  async navigateToKojin1Tab() {
    const l = this.locators.taikai;
    I.waitForElement(locate('body').withText(l.detailTitle), TIMEOUTS.SCREEN);

    await toggleGroupmenu(I, {
      icon_id: l.submenuIconId,
      menuname: l.submenuMenuName,
    });

    I.click(l.paymentGroupAccordion);
    I.click(l.kojin1Accordion);

    this.clickSubMenuLink(l.detailMainTitle, l.detailSubTitle);
  },

  /**
   * 受講生詳細画面から退会処理画面まで遷移します。
   * 「経理処理が完了してないデータがあります」警告が出ていると退会処理ボタンが表示されないため、
   * 警告を検知したら解消してから個人情報1タブへ遷移し直します
   * （解消操作自体が経理ビューAへ遷移してしまい個人情報1タブの状態が崩れるため）。
   */
  async navigateToTaikaiScreen() {
    await this.navigateToKojin1Tab();

    const resolved = await resolveUnfinishedKeiriDataIfPresent(I);
    if (resolved) {
      await this.navigateToKojin1Tab();
    }

    I.click(this.locators.taikai.taikaiButton);
    I.say(`退会処理\nURL: ${await I.grabCurrentUrl()}`);
  },

  /**
   * 受講生一覧画面でID番号検索を行い、結果の詳細画面へ遷移します。
   * @param {string} idnumber - 受講生番号
   * @returns {Promise<string>} 取得した受講生氏名
   */
  async searchStudentAndOpenDetail(idnumber) {
    const l = this.locators.studentSearch;
    await I.waitForElement(locate('body').withText(l.screenName), TIMEOUTS.SCREEN);
    await I.waitForElement(l.idnumberField, TIMEOUTS.ELEMENT);
    await I.fillField(l.idnumberField, idnumber);
    await I.click(l.searchButton);
    await I.waitForElement(l.resultList, TIMEOUTS.RESULT);

    await I.say(`${l.screenName}\nURL: ${await I.grabCurrentUrl()}`);

    const studentName = await I.grabTextFrom(l.resultLink);
    await I.click(locate(l.resultList));
    await I.say(`★link_: ${studentName}`);

    return studentName;
  },

  /**
   * クラス一覧画面にて検索条件を入力し、結果のリンクをクリックして詳細へ移動します。
   * @returns {Promise<string>} 選択したコース名
   */
  async selectClassFromList() {
    const l = this.locators.classListSearch;
    I.fillField(l.fields.name, '鈴木');
    I.selectOption(l.fields.display, l.options.display);
    I.selectOption(l.fields.status, l.options.status);
    I.selectOption(l.fields.area, l.options.area);
    I.selectOption(l.fields.school, l.options.school);
    I.selectOption(l.fields.courseCategory, l.options.courseCategory);
    I.click(l.buttons.search);
    I.say(`Search Result Page\nURL: ${await I.grabCurrentUrl()}`);
    I.waitForElement(l.results.row, 10);
    const courseName = await I.grabTextFrom(l.results.link);
    I.say(`リンクラベル: ${courseName}`);
    I.click(locate(l.results.row).at(l.results.linkIndex));
    I.say(`Course Detail Page\nURL: ${await I.grabCurrentUrl()}`);
    return courseName;
  },

  /**
   * クラス詳細画面でのタブ操作とコース選択を行います。
   * @param {string} courseName - 選択したコース名
   */
  async openStudentTabAndSelectCourse(courseName) {
    const l = this.locators.classDetailTabs;
    I.waitForElement(l.studentTabLink, 10);
    I.click(l.studentTabLink);
    I.say(`Student Tab Page\nURL: ${await I.grabCurrentUrl()}`);
    I.seeElement(l.studentTabActive);
    I.selectOption(l.coursePulldown, courseName);
    I.click(l.selectButton);
    I.say(`Presentation Selection Page\nURL: ${await I.grabCurrentUrl()}`);
  },

  /**
   * 経理メニューから返金一覧画面へ遷移します。
   */
  async openRefundListFromKeiriMenu() {
    const l = this.locators.keiriRefundList;
    I.say('【画面遷移】経理メニュー → 返金一覧');
    await toggleGroupmenu(I, {
      icon_id: l.submenuIconId,
      menuname: l.submenuMenuName,
    });
    I.see(l.linkName);
    this.clickSubMenuLink(l.linkName, l.linkName);
    await logScreenUrl(I, l.linkName);
  },
};
