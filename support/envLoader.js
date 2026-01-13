const path = require('path');
const fs = require('fs');

/**
 * コマンドライン引数や環境変数からプロファイル名を解決します。
 * 優先順位:
 * 1. 環境変数 `PROFILE`
 * 2. コマンドライン引数 `--profile <name>`
 * 3. 最後の引数がプロファイル名と一致する場合 (npm スクリプト経由での実行対策)
 * 4. デフォルト値 'shimamura'
 *
 * @returns {string} 解決されたプロファイル名
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
  if (!profile && args.length > 0) {
    const lastArg = args[args.length - 1];
    if (lastArg.startsWith('shimamura.') || lastArg === 'taskreport' || lastArg === 'shimamura') {
      profile = lastArg;
    }
  }
  
  // 4. 指定がない場合のデフォルト
  if (!profile) {
    profile = 'shimamura';
  }

  console.log('--- DEBUG: Detected Profile from CLI or fallback:', profile);
  return profile;
}

/**
 * プロファイルに基づいて、対応する .env ファイルを読み込みます。
 * 最初にルートの .env を読み込み、その後プロファイル固有の .env で上書きします。
 */
function loadEnv() {
  // 1. 基本の .env を読み込む
  require('dotenv').config();

  // 2. プロファイル固有の .env で上書きする
  const profile = getProfileFromArgs();
  if (profile) {
    const envPath = path.resolve(process.cwd(), 'env', `.env.${profile}`);
    if (fs.existsSync(envPath)) {
      console.log('--- DEBUG: Loading Env From:', envPath);
      require('dotenv').config({
        path: envPath,
        override: true
      });
    } else {
      console.log('--- DEBUG: Env file not found, skipping override:', envPath);
    }
  }
}

// このファイルを require した際に loadEnv を実行する
loadEnv();
