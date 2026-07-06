/**
 * @fileoverview しまむら：クラス受講生登録のE2Eテスト
 *
 * **処理フロー**
 * - 1. 担当者アカウントでログイン（autoLogin）
 * - 2. 管理 > コース > コース一覧 へ遷移
 * - 3. クラス一覧へ移動し検索条件を入力
 * - 4. クラス詳細の受講生タブで受講生登録操作へ進む
 *
 * **前提条件**
 * - 環境変数 `SHIMAMURA_USER`, `SHIMAMURA_PASSWORD`, `SHIMAMURA_TANTOUSYA` が設定されていること
 * - 実行時に `--profile` を指定する場合は `env/.env.<profile>` が存在すること
 *
 * **最終更新日**
 * - 2026-01-27
 */
const { beforeShimamura } = require('../../../support/shimamura/hooks');

Feature('クラス受講生登録');

/**
 * テスト実行前のセットアップ
 * 各シナリオの前にログイン処理と担当者番号入力を共通で行う
 * @param {object} args - CodeceptJSのDI引数
 * @param {CodeceptJS.I} args.I - Iオブジェクト
 * @param {object} args.loginPageShimamura - ログインページオブジェクト
 */
Before(beforeShimamura);

/**
 * クラス受講生登録のテストシナリオ
 */
Scenario('クラス受講生の新規登録ができる @dev', async ({ I, classMemberPageShimamura }) => {
  I.say('--- テスト開始: クラス受講生登録 ---');

  // メインメニューからコース管理ページへ遷移。
  await classMemberPageShimamura.navigateToAdminTab(I, 'コース', 'コース一覧');
  I.say(`Course List Page\nURL: ${await I.grabCurrentUrl()}`);

  // コースTabの中のクラス一覧画面に遷移
  classMemberPageShimamura.clickSubMenuLink('クラス一覧', 'クラス一覧');
  I.say(`Class List Page\nURL: ${await I.grabCurrentUrl()}`);

  const courseName = await classMemberPageShimamura.selectClassFromList();
  await classMemberPageShimamura.openStudentTabAndSelectCourse(courseName);

  // クラス受講生登録画面　操作
  // pause(); // ←ここでインタラクティブシェルへ

  // 最終確認のスクリーンショット
  I.saveScreenshotWithTimestamp('CLASS_MEMBER_REGISTRATION_Success.png');

  I.say('--- テスト正常終了: クラス受講生登録 ---');
});
