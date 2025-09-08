require('dotenv').config();

const { setHeadlessWhen, setCommonPlugins } = require('@codeceptjs/configure');
// turn on headless mode when running with HEADLESS=true environment variable
// export HEADLESS=true && npx codeceptjs run
setHeadlessWhen(process.env.HEADLESS);

// enable all common plugins https://github.com/codeceptjs/configure#setcommonplugins
setCommonPlugins();

/** @type {CodeceptJS.MainConfig} */
exports.config = {
  tests: './tests/token_usage_test.js',
  exclude: [
    'tests/login_test.js',
    'tests/navigation_after_login_test.js'
  ],
  output: './output',
  helpers: {
    Playwright: {
      url: process.env.BASE_URL || 'http://localhost',
      show: true,
      browser: 'chromium'
    }
  },
  include: {
    I: './steps_file.js',
    loginPage: './pages/LoginPage_Tframe.js',
    apiTestPage: './pages/ApiTestPage.js' // 新しく追加
  },
  name: 'e2e'
}