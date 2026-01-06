// ------------------------------------------------------
//  環境変数の読み込み (.env ベース + プロファイル .env.xxx)
// ------------------------------------------------------
require('dotenv').config();

/**
 * コマンドライン引数から --profile の値を取得します。
 * 例）npx codeceptjs run --profile shimamura
 */
function getProfileFromArgs() {
  const args = process.argv;
  // 1. 環境変数を最優先
  if (process.env.PROFILE) {
    console.log('--- DEBUG: Detected Profile from ENV:', process.env.PROFILE);
    return process.env.PROFILE;
  }

  // 2. 引数 --profile を検索
  let profile = null;
  for (let i = args.length - 1; i >= 0; i--) {
    if (args[i] === '--profile' && args[i + 1]) {
      profile = args[i + 1];
      break;
    }
  }

  // 3. 特殊ケース: npm経由でフラグが消えて値だけが最後に残っている場合
  // (npx codeceptjs run test.js shimamura.testgcp2 のようなケース)
  if (!profile && args.length > 0) {
    const lastArg = args[args.length - 1];
    if (lastArg.startsWith('shimamura.')) {
      profile = lastArg;
    }
  }
  
  // 4. 指定がない場合のデフォルト
  if (!profile) profile = 'shimamura';

  console.log('--- DEBUG: Detected Profile:', profile);
  return profile;
}

const profile = getProfileFromArgs();

// `override: true` で .env の値を上書き
if (profile) {
  const envPath = require('path').resolve(process.cwd(), `.env.${profile}`);
  if (require('fs').existsSync(envPath)) {
    console.log('--- DEBUG: Loading Env From:', envPath);
    require('dotenv').config({
      path: envPath,
      override: true
    });
  } else {
    console.log('--- DEBUG: Env file not found, skipping override:', envPath);
  }
}

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