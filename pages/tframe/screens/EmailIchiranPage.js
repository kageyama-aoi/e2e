/**
 * @fileoverview tframe Eメールアイコン配下の一覧検索 Page Object
 *
 * 対象:
 * - Eメール一覧                   `email/sw/_default`
 * - Eメールテンプレート一覧       `emailTemplate/sw/_default`
 * - Eメールテンプレートカテゴリ一覧 `emailTemplateCategory/sw/_default`
 * - 名簿リスト一覧               `prospectList/sw/_default`
 * - お知らせ一覧                 `announcement/sw/_default`
 * - アンケート一覧               `poll/sw/_default`
 * - 連絡一覧                     `contact/sw/_default`（juku のみ。#214）
 *
 * 既存の `EmailPage.js` はメニューナビ検証専用のため、一覧検索は本 PO に分ける
 * （`KeiryoMasterPage`（menu-nav）と `KeiriIchiranPage`（一覧検索）の関係と同じ）。
 *
 * Eメール一覧 / お知らせ一覧 / アンケート一覧 は日付レンジ既定が「当月」＋
 * 対象区分・ステイタス・エリア等がサーバー側にセッション記憶されるため、
 * 各 `fill*SearchConditions` で日付レンジ拡大＋主要セレクトのリセットを行う。
 * テストは juku_beta を主対象とする（Issue #199）。
 */

const { I } = inject();
const { fillTextFields } = require('../../../support/utils');
const createIchiranMixin = require('../_common/IchiranMixin');
const { setDateField, resetSelects, verifyResultRowsExist } = require('../_common/IchiranSearchMixin');

/**
 * Eメール系一覧でセッション記憶される主要な絞り込みセレクトを「すべて」へ戻す。
 * エリアを変えると校舎ドロップダウンが AJAX で再構築されるため、
 * エリア → 待機 → 校舎 の順にリセットする。
 */
function resetStickyFilters() {
  resetSelects([
    'school_area_id', 'branchId_area_id',
    'smsgroup', 'grade', 'type', 'status', 'answerReceived', 'template_category_status',
  ]);
  I.wait(1);
  resetSelects(['school_branch_id', 'branchId_branch_id']);
}

module.exports = {
  // ----------------------------------------------------------------
  //  Eメール一覧（SW: email/sw/_default）
  // ----------------------------------------------------------------

  /**
   * Eメール一覧画面へ遷移する
   */
  navigateToEmailListPage() {
    I.say('【Eメール一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=email%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * Eメール一覧の検索条件を入力する
   * @param {object} data - email_ichiran_search_data.csv の1行分（dateFrom / dateTo / lastName）
   */
  fillEmailSearchConditions(data) {
    I.say('【Eメール一覧】検索条件を入力');
    resetStickyFilters();
    setDateField('rangeFromField', data.dateFrom);
    setDateField('rangeToField', data.dateTo);
    fillTextFields(I, { lastName: data.lastName });
  },

  // ----------------------------------------------------------------
  //  Eメールテンプレート一覧（SW: emailTemplate/sw/_default）
  // ----------------------------------------------------------------

  /**
   * Eメールテンプレート一覧画面へ遷移する
   */
  navigateToTemplateListPage() {
    I.say('【Eメールテンプレート一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=emailTemplate%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * Eメールテンプレート一覧の検索条件を入力する
   * @param {object} data - email_template_ichiran_search_data.csv の1行分（name）
   */
  fillTemplateSearchConditions(data) {
    I.say('【Eメールテンプレート一覧】検索条件を入力');
    fillTextFields(I, { name: data.name });
  },

  // ----------------------------------------------------------------
  //  Eメールテンプレートカテゴリ一覧（SW: emailTemplateCategory/sw/_default）
  // ----------------------------------------------------------------

  /**
   * Eメールテンプレートカテゴリ一覧画面へ遷移する
   */
  navigateToTemplateCategoryListPage() {
    I.say('【Eメールテンプレートカテゴリ一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=emailTemplateCategory%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * Eメールテンプレートカテゴリ一覧の検索条件を入力する
   * @param {object} data - email_template_category_ichiran_search_data.csv の1行分（name）
   */
  fillTemplateCategorySearchConditions(data) {
    I.say('【Eメールテンプレートカテゴリ一覧】検索条件を入力');
    resetStickyFilters();
    fillTextFields(I, { name: data.name });
  },

  // ----------------------------------------------------------------
  //  名簿リスト一覧（SW: prospectList/sw/_default）
  // ----------------------------------------------------------------

  /**
   * 名簿リスト一覧画面へ遷移する
   */
  navigateToProspectListPage() {
    I.say('【名簿リスト一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=prospectList%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 名簿リスト一覧の検索条件を入力する
   * @param {object} data - prospect_list_ichiran_search_data.csv の1行分（name）
   */
  fillProspectListSearchConditions(data) {
    I.say('【名簿リスト一覧】検索条件を入力');
    resetStickyFilters();
    fillTextFields(I, { name: data.name });
  },

  // ----------------------------------------------------------------
  //  お知らせ一覧（SW: announcement/sw/_default）
  // ----------------------------------------------------------------

  /**
   * お知らせ一覧画面へ遷移する
   */
  navigateToAnnouncementListPage() {
    I.say('【お知らせ一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=announcement%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * お知らせ一覧の検索条件を入力する
   * @param {object} data - announcement_ichiran_search_data.csv の1行分（dateFrom / dateTo / title）
   */
  fillAnnouncementSearchConditions(data) {
    I.say('【お知らせ一覧】検索条件を入力');
    resetStickyFilters();
    setDateField('rangeFromDate', data.dateFrom);
    setDateField('rangeToDate', data.dateTo);
    fillTextFields(I, { title: data.title });
  },

  // ----------------------------------------------------------------
  //  アンケート一覧（SW: poll/sw/_default）
  // ----------------------------------------------------------------

  /**
   * アンケート一覧画面へ遷移する
   */
  navigateToPollListPage() {
    I.say('【アンケート一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=poll%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * アンケート一覧の検索条件を入力する
   * @param {object} data - poll_ichiran_search_data.csv の1行分（dateFrom / dateTo / title）
   */
  fillPollSearchConditions(data) {
    I.say('【アンケート一覧】検索条件を入力');
    resetStickyFilters();
    setDateField('rangeFromDate', data.dateFrom);
    setDateField('rangeToDate', data.dateTo);
    fillTextFields(I, { title: data.title });
  },

  // ----------------------------------------------------------------
  //  連絡一覧（SW: contact/sw/_default）juku のみ
  // ----------------------------------------------------------------
  // 検索条件が多い（受講生情報・コース情報・日付レンジ2種・開封状態）。
  // バリデーション制約: 「スケジュール開始日」「作成日」の**どちらか一方**は7日以内の
  // レンジにしないと検索が拒否される（画面上部に赤字警告、結果テーブルが描画されずタイムアウトする）。
  // → 全期間で検索したい場合は片方だけ広げ、もう片方は未指定のまま（既定値=当日、7日以内）にする。
  // 実機確認時点でこの環境には連絡データが1件も無く、上記制約を満たしても実データ行は出せなかった。
  // データ不在のため `verifyResultsExist`（結果テーブルの描画のみ確認・thead行にもマッチする弱い
  // チェック）を使う。データが投入された環境では `IchiranSearchMixin.verifyResultRowsExist` に差し替えること。

  /**
   * 連絡一覧画面へ遷移する
   */
  navigateToContactListPage() {
    I.say('【連絡一覧】一覧画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=contact%2Fsw%2F_default');
    I.waitForElement('#swSearchButton', 10);
  },

  /**
   * 連絡一覧の検索条件を入力する（空フィールドはスキップ）
   * @param {object} data - contact_ichiran_search_data.csv の1行分
   *                        （lastName / courseCategory / status /
   *                        scheduleDateFrom・scheduleDateTo・createdDateFrom・createdDateTo）
   */
  fillContactSearchConditions(data) {
    I.say('【連絡一覧】検索条件を入力');
    setDateField('rangeFromField', data.scheduleDateFrom);
    setDateField('rangeToField', data.scheduleDateTo);
    setDateField('rangeFromField1', data.createdDateFrom);
    setDateField('rangeToField1', data.createdDateTo);
    fillTextFields(I, { lastName: data.lastName });
    if (data.courseCategory) I.selectOption('#courseCategory', data.courseCategory);
    if (data.status) I.selectOption('#status', data.status);
  },

  // ----------------------------------------------------------------
  //  共通の結果確認
  // ----------------------------------------------------------------

  /**
   * 検索結果テーブルに実データ行が1件以上あることを確認する（`IchiranSearchMixin` へ委譲）。
   */
  async verifyResultRowsExist() {
    await verifyResultRowsExist('Eメール系一覧');
  },

  ...createIchiranMixin('Eメール系一覧'),
};
