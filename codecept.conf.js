// 1. ベースとなる .env を読み込みます
require('dotenv').config();
// 2. --profile オプションが指定されていれば、対応する .env.xxx ファイルを読み込んで設定を上書きします
const profile = process.argv.includes('--profile') ? process.argv[process.argv.indexOf('--profile') + 1] : null;
if (profile) {
  // `override: true` で .env の値を上書きできます
  require('dotenv').config({ path: `.env.${profile}`, override: true });
}

const { setCommonPlugins } = require('@codeceptjs/configure');

// enable all common plugins https://github.com/codeceptjs/configure#setcommonplugins
// setCommonPlugins(); // この行をコメントアウトすると、テスト後にブラウザが閉じるのを防げます

/** @type {CodeceptJS.MainConfig} */
exports.config = {
  // 'tests' プロパティは suites と併用できないため、コメントアウトまたは削除します。
  // tests: './tests/**/*_test.js', // Enabled
  
  suites: {
    smoke: {
      files: './tests/smoke/*_test.js'
    },
    shimamura: {
      files: './tests/shimamura/*_test.js'
    },
    tframe: {
      files: './tests/tframe/*_test.js' // Use the correct glob pattern
    }
  },
  
  output: './output',
  helpers: {
    Playwright: {
      url: process.env.BASE_URL || 'http://localhost',
      show: process.env.HEADLESS !== 'true',
      browser: 'chromium',
      // trueに設定すると、テスト実行後もブラウザを開いたままにします。
      // デバッグ時に最終画面を確認するのに便利です。
      // 通常のCI/CD実行時には false またはこの行を削除することを推奨します。
      keepBrowserState: false,
      // keepBrowserStateを有効にするには、restart: 'session' が必要です
    }
  },
  include: {
    I: './support/steps_file.js',
    loginKannrisyaPage: './pages/tframe/LoginKannrisyaPage.js',
    apiCommonLoginPage: './pages/tframe/ApiCommonLoginPage.js',
    apiTeacherInfoGetPage: './pages/tframe/ApiTeacherInfoGetPage.js',
    jsonInputPage: './pages/tframe/JsonInputPage.js',
    loginMyPage: './pages/tframe/LoginMyPage.js',
    loginPageShimamura: './pages/shimamura/LoginPage.js',
    classMemberPageShimamura: './pages/shimamura/ClassMemberPage.js'
  },
  name: 'e2e'
}