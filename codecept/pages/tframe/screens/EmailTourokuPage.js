/**
 * @fileoverview tframe Eメールアイコン配下の登録・編集フォーム Page Object
 *
 * 対象:
 * - 名簿リスト編集                 `prospectList/ew/_default`
 * - お知らせ編集                   `announcement/ew/_default`
 * - Eメールテンプレートカテゴリ編集 `emailTemplateCategory/ew/_default`
 * - Eメールテンプレート編集         `emailTemplate/ew/_default`
 *
 * 同じ Eメールアイコン配下でも役割ごとにファイルを分けている:
 * - メニューナビ検証専用 → `EmailPage.js`
 * - 一覧検索 → `EmailIchiranPage.js`
 * - 登録・編集フォーム → 本 PO（#215）
 *
 * テストは culture_beta / juku_beta 両対応（各画面とも両環境に存在）。
 */

const { I } = inject();
const { fillTextFields } = require('../../../support/utils');
const { submitTframeFormAndVerify, selectAreaThenBranch } = require('../../../support/tframe/utils');

module.exports = {
  // ----------------------------------------------------------------
  //  名簿リスト編集（EW: prospectList/ew/_default）
  // ----------------------------------------------------------------

  /**
   * 名簿リスト登録画面へ遷移する
   */
  navigateToProspectListRegisterPage() {
    I.say('【名簿リスト編集】登録画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=prospectList%2Few%2F_default');
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * 名簿リスト編集フォームを入力する
   * @param {object} data - prospect_list_touroku_data.csv の1行分（name必須 / school_area_id / school_branch_id / description）
   */
  fillProspectListForm(data) {
    I.say('【名簿リスト編集】フォームを入力');
    fillTextFields(I, { name: data.name, description: data.description });
    selectAreaThenBranch(I, { area: data.school_area_id, branch: data.school_branch_id });
  },

  /**
   * 保存して登録結果を確認する
   * @param {string} expectedName - 保存後の確認に使用する名称
   */
  async submitProspectListForm(expectedName) {
    I.say('【名簿リスト編集】保存ボタンをクリック');
    await submitTframeFormAndVerify(I, expectedName);
  },

  // ----------------------------------------------------------------
  //  お知らせ編集（EW: announcement/ew/_default）
  // ----------------------------------------------------------------

  /**
   * お知らせ登録画面へ遷移する
   */
  navigateToAnnouncementRegisterPage() {
    I.say('【お知らせ編集】登録画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=announcement%2Few%2F_default');
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * お知らせ編集フォームを入力する
   * @param {object} data - announcement_touroku_data.csv の1行分
   *                        （title必須 / postStart / postEnd / smsgroup / grade /
   *                        branchId_area_id / branchId_branch_id / description）
   */
  fillAnnouncementForm(data) {
    I.say('【お知らせ編集】フォームを入力');
    fillTextFields(I, {
      title: data.title, postStart: data.postStart, postEnd: data.postEnd, description: data.description,
    });
    if (data.smsgroup) I.selectOption('#smsgroup', data.smsgroup);
    if (data.grade) I.selectOption('#grade', data.grade);
    selectAreaThenBranch(I, {
      areaSelector: '#branchId_area_id', branchSelector: '#branchId_branch_id',
      area: data.branchId_area_id, branch: data.branchId_branch_id,
    });
  },

  /**
   * 保存して登録結果を確認する
   * @param {string} expectedName - 保存後の確認に使用するタイトル
   */
  async submitAnnouncementForm(expectedName) {
    I.say('【お知らせ編集】保存ボタンをクリック');
    await submitTframeFormAndVerify(I, expectedName);
  },

  // ----------------------------------------------------------------
  //  Eメールテンプレートカテゴリ編集（EW: emailTemplateCategory/ew/_default）
  // ----------------------------------------------------------------

  /**
   * Eメールテンプレートカテゴリ登録画面へ遷移する
   */
  navigateToEmailTemplateCategoryRegisterPage() {
    I.say('【Eメールテンプレートカテゴリ編集】登録画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=emailTemplateCategory%2Few%2F_default');
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * Eメールテンプレートカテゴリ編集フォームを入力する
   * @param {object} data - email_template_category_touroku_data.csv の1行分
   *                        （name必須 / template_category_status / description）
   */
  fillEmailTemplateCategoryForm(data) {
    I.say('【Eメールテンプレートカテゴリ編集】フォームを入力');
    fillTextFields(I, { name: data.name, description: data.description });
    if (data.template_category_status) I.selectOption('#template_category_status', data.template_category_status);
  },

  /**
   * 保存して登録結果を確認する
   * @param {string} expectedName - 保存後の確認に使用する名称
   */
  async submitEmailTemplateCategoryForm(expectedName) {
    I.say('【Eメールテンプレートカテゴリ編集】保存ボタンをクリック');
    await submitTframeFormAndVerify(I, expectedName);
  },

  // ----------------------------------------------------------------
  //  Eメールテンプレート編集（EW: emailTemplate/ew/_default）
  // ----------------------------------------------------------------

  /**
   * Eメールテンプレート登録画面へ遷移する
   */
  navigateToEmailTemplateRegisterPage() {
    I.say('【Eメールテンプレート編集】登録画面へ遷移');
    I.amOnPage(process.env.BASE_URL + 'index.php?r=emailTemplate%2Few%2F_default');
    I.waitForElement('#ewSaveButton', 10);
  },

  /**
   * Eメールテンプレート編集フォームを入力する
   * `categoryId` は必須項目（未指定=「設定なし」は保存時バリデーションエラーになるため、
   * CSV には既存カテゴリの record ID を指定すること）。
   * @param {object} data - email_template_touroku_data.csv の1行分
   *                        （name必須 / categoryId必須 / subject / body / description）
   */
  fillEmailTemplateForm(data) {
    I.say('【Eメールテンプレート編集】フォームを入力');
    fillTextFields(I, {
      name: data.name, subject: data.subject, body: data.body, description: data.description,
    });
    if (data.categoryId) I.selectOption('#categoryId', data.categoryId);
  },

  /**
   * 保存して登録結果を確認する
   * @param {string} expectedName - 保存後の確認に使用する名称
   */
  async submitEmailTemplateForm(expectedName) {
    I.say('【Eメールテンプレート編集】保存ボタンをクリック');
    await submitTframeFormAndVerify(I, expectedName);
  },
};
