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
 * - 2026-01-27
 */
// Feature('しまむら １ログイン機能');
Feature('Dev sandbox (@dev)');

/**
 * しまむらログイン機能のテストシナリオ
 * 正常な認証情報と担当者番号を使用してログインフローを検証する
 * @param {object} args - CodeceptJSのDI引数
 * @param {CodeceptJS.I} args.I - Iオブジェクト
 * @param {object} args.loginPageShimamura - ログインページオブジェクト
 */
Scenario('正しい認証情報でしまむらにログインし、担当者番号を入力してメインメニューへ進める', ({ I, loginPageShimamura }) => {
  // 環境変数からログイン情報を取得します（プロファイルによって値が切り替わります）
  const username = process.env.SHIMAMURA_USER;
  const password = process.env.SHIMAMURA_PASSWORD;
  const tantousyaNumber = process.env.SHIMAMURA_TANTOUSYA;

  // 環境変数が正しく読み込まれているかチェック
  if (!username || !password || !tantousyaNumber) {
    throw new Error('❌ ログイン情報（SHIMAMURA_USER, SHIMAMURA_PASSWORD, SHIMAMURA_TANTOUSYA）が環境変数に設定されていません。プロファイルの設定を確認してください。');
  }

  // Page Objectのメソッドを呼び出してログイン処理を実行します
  loginPageShimamura.login(username, password);
  
  // ログイン後、担当者番号を入力してメインメニューへ進みます
  loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);
  
  // タイムスタンプ付きでスクリーンショットを保存するカスタムステップを呼び出します
  I.saveScreenshotWithTimestamp('LOGIN_Shimamura_MainMenu.png');

  I.say('--- テスト正常終了: しまむらログイン ---');
});
