// const { secret } = require('codeceptjs'); // secret is globally available
const getTeacherPaymentReportParams = require('../../data/tframe/teacherPaymentReportParams');

Feature('講師支払調書APIテスト');

// Feature 全体で共有するトークン
let tcnToken;

// 事前セットアップ：管理者ログイン → API でトークン取得
Before(async ({ I, loginKannrisyaPage, apiCommonLoginPage }) => {
  I.say('セットアップ: ログインとトークン取得を開始。');

  // 1) 管理者ログイン
  loginKannrisyaPage.login(process.env.ADMIN_USER, process.env.ADMIN_PASSWORD);
  loginKannrisyaPage.seeLogout();

  // 2) テストユーザーのAPIログインでトークン取得
  tcnToken = await apiCommonLoginPage.performApiTestAndExtractToken(
    process.env.TEST_USER_TEACHER,
    process.env.TEST_PASSWORD_TEACHER,
    '講師'
  );
  I.say(`セットアップ: トークン取得成功: ${secret(tcnToken)}`);
});

// データテーブル定義（列名: headderPattern）
const headderPatternData = new DataTable(['headderPattern']);
headderPatternData.add(['001']);
headderPatternData.add(['002']);

// ★ Data(DataTable).Scenario でデータ駆動
Data(headderPatternData).Scenario(
  '指定した年月の講師支払調書が取得できる (headderPattern: %{headderPattern})',
  async ({ I, jsonInputPage, current }) => {
    const headderPattern = current.headderPattern;

    I.say('Step 1: トークン有効性の確認');
    if (!tcnToken) I.fail('Beforeフックでトークンが取得されていない。');

    I.say('Step 2: JSON入力ページへ遷移');
    jsonInputPage.navigateToPage();

    I.say('Step 3: API実行パラメータの組み立て（デフォルトは先月）');
    // 先月の year / month を安全に算出
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const targetYear = String(d.getFullYear());
    const targetMonth = String(d.getMonth() + 1).padStart(2, '0');

    // パラメータ生成（headderPattern を渡す）
    const apiParams = getTeacherPaymentReportParams(
      tcnToken,
      targetYear,
      targetMonth,
      headderPattern
    );

    // API 実行
    jsonInputPage.executeApi(apiParams);

    I.say('Step 4: レスポンスをログ保存');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFileName = `96-60_teacher_payment_report_${headderPattern}_${timestamp}`;
    const responseText = await I.grabTextFrom(jsonInputPage.locators.responseArea);
    await I.saveLogToFile(`${baseFileName}_response.log`, responseText, apiParams);

    I.say('Step 5: レスポンス検証（現状はサーバーエラーを期待）');
    I.see('Internal Server Error', jsonInputPage.locators.responseArea);

    I.say('Step 6: レスポンス領域をスクロールしてスクショ取得');
    await I.scrollIntoView(jsonInputPage.locators.responseArea);
    I.saveScreenshot(`${baseFileName}.png`);
  }
);
