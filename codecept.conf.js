// ------------------------------------------------------
//  環境変数の読み込み (.env, .env.<profile>)
//  ロジックは support/envLoader.js に分離
// ------------------------------------------------------
require('./support/envLoader.js');

const { setCommonPlugins } = require('@codeceptjs/configure');

// ------------------------------------------------------
//  共通プラグインのON/OFFを環境変数で切り替え
//  例）USE_COMMON_PLUGINS=true npx codeceptjs run
// ------------------------------------------------------
if (process.env.USE_COMMON_PLUGINS === 'true') {
  setCommonPlugins();
}

/** @type {CodeceptJS.MainConfig} */
exports.config = {
  output: './output',
  name: 'e2e',

  // ----------------------------------------------------
  //  Bootstrap: テスト実行前の初期化処理
  // ----------------------------------------------------
  bootstrap: function() {
    const fs = require('fs');
    const path = require('path');
    const allureResultsDir = path.join(__dirname, 'allure-results');
    
    // allure-results フォルダがない場合は作成
    if (!fs.existsSync(allureResultsDir)) {
      fs.mkdirSync(allureResultsDir, { recursive: true });
    }
  
    // Allure レポートに表示したい環境情報を定義
    // ここで .env から読み込んだ値やプロファイル名を出力します
    const envData = `Profile=${process.env.profile || 'default'}
BaseURL=${process.env.BASE_URL || 'unknown'}
Browser=${process.env.BROWSER || 'chromium'}
EnvironmentFile=.env.${process.env.profile || ''}
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
      files: './tests/Taskreport/*_test.js'
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
      windowSize: '1280x800',

      // パフォーマンスチューニング設定
      pressDelay: 0,
      waitForTimeout: 5000,
      waitForAction: 50,

      chromium: {
        viewport: {
          width: 1280,
          height: 800
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
    
    taskReportLoginPage: './pages/Taskreport/TaskReportLoginPage.js'
  },
  // ----------------------------------------------------
  //  プラグイン設定
  // ----------------------------------------------------
  plugins: {
    allure: {
      enabled: true,
      require: "allure-codeceptjs",
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