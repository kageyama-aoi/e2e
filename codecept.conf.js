require('dotenv').config();

const { setCommonPlugins } = require('@codeceptjs/configure');

// enable all common plugins https://github.com/codeceptjs/configure#setcommonplugins
setCommonPlugins();

/** @type {CodeceptJS.MainConfig} */
exports.config = {
  tests: './tests/**/*_test.js',
  exclude: [
    'tests/login_test.js',
    'tests/navigation_after_login_test.js'
  ],
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
    loginMyPage: './pages/LoginMyPage.js'
  },
  name: 'e2e'
}