/**
 * @fileoverview tframe カレンダー画面 Page Object
 */

const { I } = inject();
const createMenuNavigationMixin = require('../_common/MenuNavigationMixin');
const createIchiranMixin = require('../_common/IchiranMixin');
const { fillTextFields } = require('../../../support/utils');
const { isEnglish, selectAreaThenBranch, selectFirstFromPopupPicker } = require('../../../support/tframe/utils');
const { TIMEOUTS } = require('../../../support/tframe/constants');
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

  // ----------------------------------------------------------------
  //  入退記録編集（EW: entranceLog/ew/_default）juku のみ
  // ----------------------------------------------------------------

  /**
   * 入退記録登録画面へ遷移する
   */
  navigateToEntranceLogRegisterPage() {
    I.say('【入退記録編集】登録画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=entranceLog%2Few%2F_default');
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * 受講生ポップアップを開き、先頭の検索結果を選択する（`selectFirstFromPopupPicker` へ委譲。#216）。
   */
  selectEntranceLogStudent() {
    I.say('【入退記録編集】受講生ポップアップを開き先頭の結果を選択');
    selectFirstFromPopupPicker(I, { startSelector: '#personId_start', displaySelector: '#personId_display' });
  },

  /**
   * 入退記録編集フォームを入力する（受講生ポップアップは別途 `selectEntranceLogStudent` で選択）
   * @param {object} data - entrance_log_touroku_data.csv の1行分
   *                        （cardInputDate必須 / school_area_id / school_branch_id）
   */
  fillEntranceLogForm(data) {
    I.say('【入退記録編集】フォームを入力');
    fillTextFields(I, { cardInputDate: data.cardInputDate });
    selectAreaThenBranch(I, { area: data.school_area_id, branch: data.school_branch_id });
  },

  /**
   * 保存ボタンをクリックし、登録結果を確認する。
   * 他の登録画面と異なり、保存後は入力内容を表示する詳細画面ではなく
   * **入退記録一覧画面へ遷移する**ため、`submitTframeFormAndVerify`（expectedName の文字列一致）は
   * 使えない。バリデーションエラーの有無と、一覧画面（`#swSearchButton`）への遷移で確認する（#216）。
   */
  async submitEntranceLogForm() {
    I.say('【入退記録編集】保存ボタンをクリック');
    I.click('#ewSaveButton');
    I.wait(TIMEOUTS.SAVE);
    const errorText = await I.executeScript(() => {
      const el = document.getElementById('tf-message-summary');
      return el ? el.innerText.trim() : '';
    });
    if (errorText) throw new Error(`登録バリデーションエラー:\n${errorText}`);
    I.waitForElement('#swSearchButton', 10);
  },

  ...createMenuNavigationMixin('tframe_calendar'),
};
