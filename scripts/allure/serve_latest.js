/**
 * 最新の allure-results サブフォルダを自動検出して allure serve する
 * Usage:
 *   node scripts/allure/serve_latest.js                  # 全プロファイル中の最新
 *   node scripts/allure/serve_latest.js tframe.culture_test  # プロファイル指定
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../allure-results');
const profileArg = process.argv[2];

function getLatestDir(baseDir) {
  const entries = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => ({
      name: e.name,
      mtime: fs.statSync(path.join(baseDir, e.name)).mtime,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  return entries.length ? entries[0].name : null;
}

let targetDir;

if (profileArg) {
  const profileDir = path.join(root, profileArg);
  if (!fs.existsSync(profileDir)) {
    console.error(`プロファイルが見つかりません: ${profileArg}`);
    process.exit(1);
  }
  const latest = getLatestDir(profileDir);
  if (!latest) {
    console.error(`結果フォルダが空です: ${profileArg}`);
    process.exit(1);
  }
  targetDir = path.join(profileDir, latest);
} else {
  // 全プロファイルから最新を探す
  const profiles = fs.readdirSync(root, { withFileTypes: true })
    .filter(e => e.isDirectory() && e.name !== 'archive' && e.name !== 'default');

  let latestMtime = 0;
  for (const profile of profiles) {
    const profileDir = path.join(root, profile.name);
    const latest = getLatestDir(profileDir);
    if (!latest) continue;
    const dir = path.join(profileDir, latest);
    const mtime = fs.statSync(dir).mtime.getTime();
    if (mtime > latestMtime) {
      latestMtime = mtime;
      targetDir = dir;
    }
  }
}

if (!targetDir) {
  console.error('allure-results に結果が見つかりません');
  process.exit(1);
}

console.log(`Serving: ${targetDir}`);
spawn('npx', ['allure', 'serve', targetDir], { stdio: 'inherit', shell: true });
