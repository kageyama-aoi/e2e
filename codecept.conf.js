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
setCommonPlugins();

/** @type {CodeceptJS.MainConfig} */
exports.config = {
  // 'tests' プロパティは suites と併用できないため、コメントアウトまたは削除します。
  // tests: './tests/*_test.js',
  suites: {
    shimamura: {
      files: './tests/shimamura/*_test.js'
    },
    tframe: {
      files: './tests/tframe/*_test.js'
    }
  },
  output: './output',
  helpers: {
    Playwright: {
      url: process.env.BASE_URL || 'http://localhost',
      show: process.env.HEADLESS !== 'true',
      browser: 'chromium'
    }
  },
  include: {
    I: './steps_file.js',
    loginPage: './pages/LoginPage_Tframe.js',
    apiTestPage: './pages/ApiTestPage.js',
    personalInfoPage: './pages/PersonalInfoPage.js',
    loginMyPage: './pages/LoginMyPage.js',
    loginPageShimamura: './pages/LoginPage_Shimamura.js',
    classMemberPageShimamura: './pages/ClassMemberPage_Shimamura.js'
  },
  name: 'e2e'
}