const fs = require('fs');

/**
 * CSVファイルを読み込み、オブジェクトの配列として返す
 * @param {string} filePath - CSVファイルのパス
 * @returns {Array<Object>} パースされたデータの配列
 */
function readCsv(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return []; // ヘッダーのみまたは空の場合

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length) {
        const row = {};
        for (let j = 0; j < headers.length; j++) {
          row[headers[j]] = values[j];
        }
        data.push(row);
      }
    }
    return data;
  } catch (err) {
    console.error(`Error reading CSV file: ${filePath}`, err);
    return [];
  }
}

/**
 * コマンドライン引数からプロファイル名を取得する
 * @returns {string|null} プロファイル名、指定がない場合はnull
 */
function getProfileFromArgs() {
  const profileIndex = process.argv.indexOf('--profile');
  if (profileIndex === -1) return null;
  return process.argv[profileIndex + 1] ?? null;
}

module.exports = {
  readCsv,
  getProfileFromArgs,
};
