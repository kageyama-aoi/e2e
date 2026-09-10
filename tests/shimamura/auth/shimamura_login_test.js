/**
 * @fileoverview しまむら：ログイン機能のスモークテスト
 *
 * **テスト内容**
 * - 正しいユーザーID/パスワード/担当者番号でログインできることを確認する
 *
 * **前提条件**
 * - 環境変数 `SHIMAMURA_USER`, `SHIMAMURA_PASSWORD`, `SHIMAMURA_TANTOUSYA` が設定されていること
 * - 実行時に `--profile` を指定する場合は `env/.env.<profile>` が存在すること
 *
 * **最終更新日**
 * - 2026-09-10
 */
Feature('しまむらログイン');

/**
 * しまむらログイン機能のテストシナリオ
 * 正常な認証情報と担当者番号を使用してログインフローを検証する
 * @param {object} args - CodeceptJSのDI引数
 * @param {CodeceptJS.I} args.I - Iオブジェクト
 * @param {object} args.loginPageShimamura - ログインページオブジェクト
 */
Scenario('正しい認証情報でしまむらにログインし、担当者番号を入力してメインメニューへ進める', async ({ I, loginPageShimamura }) => {
  const tantousyaNumber = process.env.SHIMAMURA_TANTOUSYA;

  // 認証情報の環境変数が読み込まれているかチェック（login() は env から直接読む）
  if (!process.env.SHIMAMURA_USER || !process.env.SHIMAMURA_PASSWORD || !tantousyaNumber) {
    throw new Error('❌ ログイン情報（SHIMAMURA_USER, SHIMAMURA_PASSWORD, SHIMAMURA_TANTOUSYA）が環境変数に設定されていません。プロファイルの設定を確認してください。');
  }

  await loginPageShimamura.login();
  await loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);

  I.saveScreenshotWithTimestamp('LOGIN_Shimamura_MainMenu.png');
  I.say('--- テスト正常終了: しまむらログイン ---');
});
