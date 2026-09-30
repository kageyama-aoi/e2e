const fs = require('fs');
const path = require('path');

/**
 * 実行ごとの出力フォルダ（output/ と allure-results/）のパスを決める。
 * codecept.conf.js から呼ばれ、フォルダ名は `<プロファイル>/<YYYYMMDD_HHMMSS>_<テストファイル名>` になる。
 * 計算（純粋関数）とフォルダ作成（副作用）を分けてあり、計算側は tests/unit/ で単体テストしている（#230）。
 */

/**
 * パスに使えない文字と空白を `_` に置き換える
 * @param {string} value
 * @returns {string} 空なら 'default'
 */
function sanitizePathSegment(value) {
  return (value || 'default').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
}

// パス文字列から拡張子を除いたファイル名を取り出す（空なら 'all'）
function baseNameWithoutExt(filePath) {
  const normalized = String(filePath).replace(/\\/g, '/');
  const fileName = normalized.split('/').pop() || normalized;
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  return sanitizePathSegment(withoutExt || 'all');
}

/**
 * コマンドライン引数から、実行対象のテストファイル名（拡張子なし）を割り出す。
 * `*_test.js` の引数を優先し、無ければ `run` の直後の引数、どちらも無ければ 'all'。
 * @param {string[]} argv - process.argv
 * @returns {string}
 */
function detectRunTargetFromArgs(argv) {
  const args = Array.isArray(argv) ? argv : [];
  const testArg = args.find((arg) => /_test\.js$/i.test(String(arg)));
  if (testArg) return baseNameWithoutExt(testArg);

  const runIndex = args.lastIndexOf('run');
  if (runIndex >= 0 && args[runIndex + 1] && !String(args[runIndex + 1]).startsWith('-')) {
    return baseNameWithoutExt(args[runIndex + 1]);
  }

  return 'all';
}

/**
 * @param {Date} [now]
 * @returns {string} 'YYYYMMDD_HHMMSS'（ローカル時刻）
 */
function buildRunTimestamp(now = new Date()) {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
}

/**
 * 実行ごとの出力パスを計算する（フォルダは作らない）
 * @param {{env: (object|undefined), argv: (Array<string>|undefined), now: (Date|undefined)}} [options]
 * @returns {{runProfile: string, runDirName: string, runtimeOutputDir: string, runtimeAllureResultsDir: string}}
 *   パスは codecept.conf.js のあるフォルダからの相対パス（'./output/...'）
 */
function resolveRunOutputPaths({ env = process.env, argv = process.argv, now = new Date() } = {}) {
  const runProfile = sanitizePathSegment(env.PROFILE || env.profile || 'default');
  const runDirName = `${buildRunTimestamp(now)}_${detectRunTargetFromArgs(argv)}`;
  return {
    runProfile,
    runDirName,
    runtimeOutputDir: `./output/${runProfile}/${runDirName}`,
    runtimeAllureResultsDir: `./allure-results/${runProfile}/${runDirName}`,
  };
}

/**
 * {@link resolveRunOutputPaths} の結果のフォルダを作る（副作用）
 * @param {{runtimeOutputDir: string, runtimeAllureResultsDir: string}} paths
 * @param {string} rootDir - 相対パスの基準（codecept.conf.js のあるフォルダ）
 */
function ensureRunOutputDirs(paths, rootDir) {
  fs.mkdirSync(path.resolve(rootDir, paths.runtimeOutputDir), { recursive: true });
  fs.mkdirSync(path.resolve(rootDir, paths.runtimeAllureResultsDir), { recursive: true });
}

module.exports = {
  sanitizePathSegment,
  detectRunTargetFromArgs,
  buildRunTimestamp,
  resolveRunOutputPaths,
  ensureRunOutputDirs,
};
