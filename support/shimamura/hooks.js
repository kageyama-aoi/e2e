const { validateShimamuraEnv } = require('./utils');

async function beforeShimamura({ login, loginPageShimamura }) {
  const tantousyaNumber = validateShimamuraEnv();
  await login('shimamuraUser');
  await loginPageShimamura.enterTantousyaNumberAndProceed(tantousyaNumber);
}

module.exports = { beforeShimamura };
