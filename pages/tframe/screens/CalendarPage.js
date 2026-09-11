/**
 * @fileoverview tframe カレンダー画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');
const createIchiranMixin = require('../_common/IchiranMixin');
const { fillTextFields } = require('../../../support/utils');
const { isEnglish, selectAreaThenBranch } = require('../../../support/tframe/utils');
const { setDateField, verifyResultRowsExist } = require('../_common/IchiranSearchMixin');

module.exports = {
  /** カレンダーアイコンのセレクタ（日英） */
  locators: {
    calendarIconJa: 'a:has-text("カレンダー")',
    calendarIconEn: 'a:has-text("Calendar")',
  },

  /**
   * メインメニューのカレンダーアイコンをクリックする
   */
  clickCalendarIcon() {
    I.say('【メインメニュー】カレンダーアイコンをクリック');
    I.waitForElement(this.calendarIconLocator(), 10);
    I.click(this.calendarIconLocator());
  },

  /**
   * 現在の言語設定に合わせたカレンダーアイコンのロケーターを返す
   * @returns {string} セレクタ文字列
   */
  calendarIconLocator() {
    return isEnglish() ? this.locators.calendarIconEn : this.locators.calendarIconJa;
  },

  // ----------------------------------------------------------------
  //  入退記録一覧（SW: entranceLog/sw/_default）juku のみ
  // ----------------------------------------------------------------

  /**
   * 入退記録一覧画面へ遷移する
   */
  navigateToEntranceLogListPage() {
    I.say('【入退記録一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=entranceLog%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 入退記録一覧の検索条件を入力する（空フィールドはスキップ）
   * @param {object} data - entrance_log_ichiran_search_data.csv の1行分
   *                        （dateFrom / dateTo / lastName / school_area_id / school_branch_id）
   */
  fillEntranceLogSearchConditions(data) {
    I.say('【入退記録一覧】検索条件を入力');
    setDateField('rangeFrom', data.dateFrom);
    setDateField('rangeTo', data.dateTo);
    fillTextFields(I, { lastName: data.lastName });
    selectAreaThenBranch(I, { area: data.school_area_id, branch: data.school_branch_id });
  },

  /**
   * 検索結果テーブルに実データ行が1件以上あることを確認する（`IchiranSearchMixin` へ委譲）。
   */
  async verifyEntranceLogResultRowsExist() {
    await verifyResultRowsExist('入退記録一覧');
  },

  ...createIchiranMixin('入退記録一覧'),

  // 入退記録編集（EW: entranceLog/ew/_default・juku のみ）は #216 で追跡（未着手）。
  // 受講生ポップアップが新規タブではなくページ内モーダルで開くため、他画面の
  // teacher/course ポップアップ（switchToNextTab で選択）と同じパターンが使えない。
  // モーダル内の結果行クリックが失敗した（`<a>` 無し）ため要実機調査。

  ...createMenuNavigationMixin('tframe_calendar'),
};
