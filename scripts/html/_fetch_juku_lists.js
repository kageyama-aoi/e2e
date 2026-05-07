'use strict';
const fs   = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const dotenv = require('dotenv');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
dotenv.config({ path: path.join(REPO_ROOT, '.env') });
dotenv.config({ path: path.join(REPO_ROOT, 'env', '.env.tframe.juku_test'), override: true });

const BASE_URL = process.env.BASE_URL;
const USER     = process.env.ADMIN_USER;
const PASSWORD = process.env.ADMIN_PASSWORD;
const INPUT_DIR = path.join(__dirname, 'input');

const TARGETS = [
  { name: 'ryokin_master_list',   url: BASE_URL + 'index.php?r=smsFeeMaster%2Fsw%2F_default' },
  { name: 'ryokin_package_list',  url: BASE_URL + 'index.php?r=smsFeeMasterPackage%2Fsw%2F_default' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();
  await page.goto(BASE_URL);
  await page.waitForSelector('#loginmodel-username', { timeout: 10000 });
  await page.fill('#loginmodel-username', USER);
  await page.fill('#loginmodel-password', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForSelector('a[href*="logout"]', { timeout: 15000 });
  console.log('logged in:', page.url());

  for (const t of TARGETS) {
    await page.goto(t.url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1000);
    const html = await page.$eval('#rootWidget', el => el.outerHTML)
      .catch(async () => page.$eval('body', el => el.innerHTML));
    const outFile = path.join(INPUT_DIR, t.name + '.html');
    fs.writeFileSync(outFile, html, 'utf8');
    console.log('saved:', outFile, Math.round(html.length / 1024) + 'KB');
  }
  await browser.close();
})();
