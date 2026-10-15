/**
 * @fileoverview 受講生登録 → コース紐付け 業務フローテスト
 *
 * **テスト内容**
 * - 管理者ログイン後、コースを新規登録
 * - 続けて受講生を新規登録（ID番号重複時は自動リトライ）
 * - 受講生詳細画面の「コース」タブから「コース選択」ポップアップを開き、
 *   直前に作成したコースを検索・選択して紐付ける
 * - 紐付け後、受講生の「コース」タブ一覧に対象コース名が表示されることを確認する
 *
 * **データソース**
 * - `data/tframe/jukusei_course_link_flow_data.csv`
 * - コース名は実行のたびに重複しないよう、CSVの `courseNameBase` にタイムスタンプを付与して使用する
 *
 * **Page Object**
 * - `pages/tframe/flow/JukuseiCourseFlowPage.js`（tframe flow系Page Objectの雛形）
 *
 * **注意（既知の環境差異）**
 * - culture_beta の受講生登録・コース登録フォームは現状 `school_area_id` セレクトが存在せず、
 *   校舎（`school_branch_id` 相当）の単一セレクトのみになっている（`selectAreaThenBranch` を
 *   使う既存の `course_touroku_test.js` / `jukusei_touroku_test.js` も同様の理由で現在失敗する）。
 *   本フローはコース紐付けの確認が主目的のため、校舎は指定せずデフォルト値のまま登録している。
 *
 * **最終更新日**
 * - 2026-07-22
 */

const { loadCsvWithProfile, withScenarioLabel, updateCsvIdnumber } = require('../../../support/utils');
const { runJukuseiCourseLinkFlow } = require('../../../pages/tframe/flow/JukuseiCourseFlowPage');

const csvData = withScenarioLabel(
  loadCsvWithProfile('jukusei_course_link_flow_data', 'tframe'),
  (row) => `${row.lastName} ${row.firstName} / ${row.courseNameBase}`
);

Feature('受講生登録→コース紐付けフロー');

Data(csvData).Scenario('管理者ログイン後に受講生を登録しコースを紐付けられる @admin', async ({
  I, jukuseiPage, coursePage, loginKannrisyaPage, current
}) => {
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  const courseName = `${current.courseNameBase}_${Date.now()}`;

  // 校舎（school_area_id）は環境側のフォーム都合により未指定でデフォルト値のまま登録する（上記コメント参照）
  const courseData = {
    name:      courseName,
    shortname: current.courseShortname,
  };

  const jukuseiData = {
    lastName:        current.lastName,
    firstName:       current.firstName,
    idnumber:        current.idnumber,
    bankPaymentType: current.bankPaymentType,
  };

  const usedId = await runJukuseiCourseLinkFlow(I, jukuseiPage, coursePage, { courseData, jukuseiData });
  updateCsvIdnumber('jukusei_course_link_flow_data', 'tframe', current.idnumber, usedId);

  I.saveScreenshotWithTimestamp('jukusei_course_link_flow_done', true);
});
