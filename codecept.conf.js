// ------------------------------------------------------
//  環境変数の読み込み (.env, .env.<profile>)
//  ロジックは support/envLoader.js に分離
// ------------------------------------------------------
require('./support/envLoader.js');

const fs = require('fs');
const path = require('path');
const { setCommonPlugins } = require('@codeceptjs/configure');
const { resolveRunOutputPaths, ensureRunOutputDirs } = require('./support/runOutputPaths.js');

// ------------------------------------------------------
//  共通プラグインのON/OFFを環境変数で切り替え
//  例）USE_COMMON_PLUGINS=true npx codeceptjs run
// ------------------------------------------------------
if (process.env.USE_COMMON_PLUGINS === 'true') {
  setCommonPlugins();
}

// ------------------------------------------------------
//  実行ごとの出力フォルダ（output/<profile>/<日時>_<テスト名>）
//  計算とフォルダ作成は support/runOutputPaths.js に分離（#230）
// ------------------------------------------------------
const runOutputPaths = resolveRunOutputPaths();
ensureRunOutputDirs(runOutputPaths, __dirname);
const { runtimeOutputDir, runtimeAllureResultsDir } = runOutputPaths;

// 全プロファイル共通のビューポート設定（旧名 TFRAME_VIEWPORT_* もフォールバックとして読む）
const viewportWidth  = Number(process.env.VIEWPORT_WIDTH  || process.env.TFRAME_VIEWPORT_WIDTH  || 1600);
const viewportHeight = Number(process.env.VIEWPORT_HEIGHT || process.env.TFRAME_VIEWPORT_HEIGHT || 1200);
const windowSize = `${viewportWidth}x${viewportHeight}`;
// 実際に起動するブラウザ（Allure の Environment 表示にも同じ値を出す）
const playwrightBrowser = 'chromium';

/** @type {CodeceptJS.MainConfig} */
exports.config = {
  output: runtimeOutputDir,
  name: 'e2e',

  // ----------------------------------------------------
  //  Bootstrap: テスト実行前の初期化処理
  // ----------------------------------------------------
  bootstrap: function() {
    const allureResultsDir = path.resolve(__dirname, runtimeAllureResultsDir);
  
    // Allure レポートに表示したい環境情報を定義
    // ここで .env から読み込んだ値やプロファイル名を出力します
    const profile = process.env.PROFILE || process.env.profile || '';
    const envData = `Profile=${profile || 'default'}
BaseURL=${process.env.BASE_URL || 'unknown'}
Browser=${playwrightBrowser}
Viewport=${windowSize}
EnvironmentFile=${profile ? `env/.env.${profile}` : '.env (profile なし)'}
OutputDir=${runtimeOutputDir}
AllureResultsDir=${runtimeAllureResultsDir}
`;
  
    // environment.properties ファイルとして書き出し
    try {
      fs.writeFileSync(path.join(allureResultsDir, 'environment.properties'), envData);
      console.log('Creates allure-results/environment.properties');
    } catch (err) {
      console.error('Failed to create allure-results/environment.properties', err);
    }
  },

  // ----------------------------------------------------
  //  テスト対象（パス未指定で実行したときの既定）
  //  CodeceptJS 3.3.7 はパス未指定時に `tests` キーだけを読む（`suites` は読まない）。
  //  通常はコマンド側でパスを渡す（npm run test_s / test_t / GUI）ので、ここは `npm test` 用の既定値。
  // ----------------------------------------------------
  tests: './tests/**/*_test.js',

  // ----------------------------------------------------
  //  ヘルパー（Playwright）
  // ----------------------------------------------------
  helpers: {
    Playwright: {
      url: process.env.BASE_URL || 'http://localhost',
      show: process.env.HEADLESS !== 'true',
      browser: playwrightBrowser,
      windowSize,

      // パフォーマンスチューニング設定
      pressDelay: 0,
      waitForTimeout: 5000,
      waitForAction: 50,

      chromium: {
        viewport: {
          width: viewportWidth,
          height: viewportHeight
        },
        args: ['--force-device-scale-factor=1']
      },

      // デフォルトはブラウザを閉じる
      keepBrowserState: false,
      // keepBrowserStateを有効にするには、restart: 'session' が必要です
      // restart: 'session',
    }
  },

  // ----------------------------------------------------
  //  ページオブジェクト / steps の定義
  // ----------------------------------------------------
  include: {
    I: './support/steps_file.js',

    loginKannrisyaPage:   './pages/tframe/auth/LoginKannrisyaPage.js',
    loginMyPageTeacher:   './pages/tframe/auth/LoginMyPageTeacherPage.js',
    loginMyPageStudent:   './pages/tframe/auth/LoginMyPageStudentPage.js',

    apiCommonLoginPage:   './pages/tframe/api/ApiCommonLoginPage.js',
    apiTeacherInfoGetPage:'./pages/tframe/api/ApiTeacherInfoGetPage.js',
    jsonInputPage:        './pages/tframe/api/JsonInputPage.js',

    loginPageShimamura: './pages/shimamura/auth/LoginPage.js',
    classMemberPageShimamura: './pages/shimamura/_common/ClassMemberPage.js',
    ichiranPageShimamura: './pages/shimamura/screens/IchiranPage.js',
    contactRegisterPageShimamura: './pages/shimamura/screens/ContactRegisterPage.js',
    salesGroupTransferPageShimamura: './pages/shimamura/screens/SalesGroupTransferPage.js',
    menuPatrolPageShimamura: './pages/shimamura/_common/MenuPatrolPage.js',

    taskReportLoginPage: './pages/taskreport/TaskReportLoginPage.js',

    keiryoMasterPage:  './pages/tframe/screens/KeiryoMasterPage.js',
    jukuseiPage:       './pages/tframe/screens/JukuseiPage.js',
    coursePage:        './pages/tframe/screens/CoursePage.js',
    koshiPage:         './pages/tframe/screens/KoshiPage.js',
    masterMenuPage:    './pages/tframe/screens/MasterMenuPage.js',
    calendarPage:      './pages/tframe/screens/CalendarPage.js',
    emailPage:         './pages/tframe/screens/EmailPage.js',
    reportPage:        './pages/tframe/screens/ReportPage.js',
    homePage:          './pages/tframe/screens/HomePage.js',
    helpPage:          './pages/tframe/screens/HelpPage.js',
    accountPage:       './pages/tframe/screens/AccountPage.js',
    staffPage:         './pages/tframe/screens/StaffPage.js',
    shohinPage:        './pages/tframe/screens/ShohinPage.js',
    chosekinPage:      './pages/tframe/screens/ChosekinPage.js',
    classroomPage:     './pages/tframe/screens/ClassroomPage.js',
    ryokinMasterPage:  './pages/tframe/screens/RyokinMasterPage.js',
    branchPage:        './pages/tframe/screens/BranchPage.js',
    ryokinPackagePage: './pages/tframe/screens/RyokinPackagePage.js',
    infoHistoryPage:   './pages/tframe/screens/InfoHistoryPage.js',
    keiriIchiranPage:  './pages/tframe/screens/KeiriIchiranPage.js',
    emailIchiranPage:  './pages/tframe/screens/EmailIchiranPage.js',
    emailTourokuPage:  './pages/tframe/screens/EmailTourokuPage.js',
    reportIchiranPage: './pages/tframe/screens/ReportIchiranPage.js'
  },
  // ----------------------------------------------------
  //  プラグイン設定
  // ----------------------------------------------------
  plugins: {
    allure: {
      enabled: true,
      require: "allure-codeceptjs",
      outputDir: runtimeAllureResultsDir,
    },
    stepByStepReport: {
      enabled: true,
      screenshotsForAllSteps: true,
      deleteSuccessful: false,
    },
    // autoLogin は現状 shimamura 専用（tframe 等の他サイトは各テストで手動ログインしている）。
    // 新サイトで autoLogin を使いたい場合は users に別ロールを追加すること（既存の shimamuraUser は変えない）。
    autoLogin: {
      enabled: true,       // ← 有効化スイッチ
      // ← Cookie をファイルに保存。保存先は global.output_dir（実行ごとの日時フォルダ）なので、
      //   再利用されるのは同一実行内の Scenario 間だけ（実行をまたいだ再利用は起きない）
      saveToFile: true,
      inject: 'login',     // ← テスト内で { login } として使えるようになる
      users: {
        shimamuraUser: {
          // ログイン処理
          login: () => {
            // ページオブジェクト側で inject() を使っている前提なので require の位置は現状維持
            const loginPageShimamura = require('./pages/shimamura/auth/LoginPage.js');
            loginPageShimamura.login();
          },
          // ログイン済みか確認
          check: () => {
            const loginPageShimamura = require('./pages/shimamura/auth/LoginPage.js');
            loginPageShimamura.seeLoggedIn();
          },
        },
      },
    },
  },
}
