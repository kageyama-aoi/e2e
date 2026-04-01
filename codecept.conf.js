// ------------------------------------------------------
//  環境変数の読み込み (.env, .env.<profile>)
//  ロジックは support/envLoader.js に分離
// ------------------------------------------------------
require('./support/envLoader.js');

const fs = require('fs');
const path = require('path');
const { setCommonPlugins } = require('@codeceptjs/configure');

// ------------------------------------------------------
//  共通プラグインのON/OFFを環境変数で切り替え
//  例）USE_COMMON_PLUGINS=true npx codeceptjs run
// ------------------------------------------------------
if (process.env.USE_COMMON_PLUGINS === 'true') {
  setCommonPlugins();
}

function sanitizePathSegment(value) {
  return (value || 'default').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
}

function buildRunTimestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
}

const runProfile = sanitizePathSegment(process.env.PROFILE || process.env.profile || 'default');
const runTimestamp = buildRunTimestamp();
const runtimeOutputDir = `./output/${runProfile}/${runTimestamp}`;
const runtimeAllureResultsDir = `./allure-results/${runProfile}/${runTimestamp}`;
const viewportWidth = Number(process.env.TFRAME_VIEWPORT_WIDTH || 1600);
const viewportHeight = Number(process.env.TFRAME_VIEWPORT_HEIGHT || 1200);
const windowSize = `${viewportWidth}x${viewportHeight}`;

fs.mkdirSync(path.resolve(__dirname, runtimeOutputDir), { recursive: true });
fs.mkdirSync(path.resolve(__dirname, runtimeAllureResultsDir), { recursive: true });

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
    const envData = `Profile=${process.env.PROFILE || process.env.profile || 'default'}
    BaseURL=${process.env.BASE_URL || 'unknown'}
Browser=${process.env.BROWSER || 'chromium'}
Viewport=${windowSize}
EnvironmentFile=.env.${process.env.PROFILE || process.env.profile || ''}
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
  //  テストスイート定義（tests は使わず suites のみに統一）
  // ----------------------------------------------------
  suites: {
    smoke: {
      files: './tests/smoke/*_test.js'
    },
    shimamura: {
      files: './tests/shimamura/*_test.js'
    },
    tframe: {
      files: './tests/tframe/*_test.js' // Use the correct glob pattern
    },
    taskreport: {
      files: './tests/taskreport/*_test.js'
    }
  },

  // ----------------------------------------------------
  //  ヘルパー（Playwright）
  // ----------------------------------------------------
  helpers: {
    Playwright: {
      url: process.env.BASE_URL || 'http://localhost',
      show: process.env.HEADLESS !== 'true',
      browser: 'chromium',
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

    loginKannrisyaPage: './pages/tframe/LoginKannrisyaPage.js',
    apiCommonLoginPage: './pages/tframe/ApiCommonLoginPage.js',
    apiTeacherInfoGetPage: './pages/tframe/ApiTeacherInfoGetPage.js',
    jsonInputPage: './pages/tframe/JsonInputPage.js',
    loginMyPage: './pages/tframe/LoginMyPage.js',
    
    loginPageShimamura: './pages/shimamura/LoginPage.js',
    classMemberPageShimamura: './pages/shimamura/ClassMemberPage.js',
    
    taskReportLoginPage: './pages/taskreport/TaskReportLoginPage.js',

    keiryoMasterPage: './pages/tframe/KeiryoMasterPage.js',

    jukuseiPage:   './pages/tframe/JukuseiPage.js',
    coursePage:    './pages/tframe/CoursePage.js',
    koshiPage:     './pages/tframe/KoshiPage.js',
    masterMenuPage:'./pages/tframe/MasterMenuPage.js',
    calendarPage:  './pages/tframe/CalendarPage.js',
    emailPage:     './pages/tframe/EmailPage.js',
    reportPage:    './pages/tframe/ReportPage.js',
    homePage:      './pages/tframe/HomePage.js',
    helpPage:      './pages/tframe/HelpPage.js'
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
    autoLogin: {
      enabled: true,       // ← 有効化スイッチ
      saveToFile: true,    // ← Cookieをファイルに保存して再利用
      inject: 'login',     // ← テスト内で { login } として使えるようになる
      users: {
        user: {
          // ログイン処理
          login: () => {
            // ページオブジェクト側で inject() を使っている前提なので require の位置は現状維持
            const loginPageShimamura = require('./pages/shimamura/LoginPage.js');
            loginPageShimamura.login();
          },
          // ログイン済みか確認
          check: () => {
            const loginPageShimamura = require('./pages/shimamura/LoginPage.js');
            loginPageShimamura.seeLoggedIn();
          },
        },
      },
    },
  },
}
