const fs = require('fs');
const path = require('path');
const { container } = require('codeceptjs');
const { config: codeceptConfig } = require('../codecept.conf.js');

/**
 * CSVファイルを読み込み、オブジェクトの配列として返す
 * @param {string} filePath - CSVファイルのパス
 * @returns {Array<Object>} パースされたデータの配列
 */
function readCsv(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '' && !line.trim().startsWith('#'));
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

function withAllure(callback) {
  const allure = container.plugins('allure');
  if (allure) callback(allure);
}

function setBusinessLabels({ epic, feature, story }) {
  withAllure((allure) => {
    if (epic) allure.epic(epic);
    if (feature) allure.feature(feature);
    if (story) allure.story(story);
  });
}

function attachBusinessContext({ label, input, breakTarget, breakValue, expectedErrors }) {
  withAllure((allure) => {
    if (label) allure.addAttachment('業務ラベル', label, 'text/plain');
    if (breakTarget) allure.addAttachment('breakTarget', String(breakTarget), 'text/plain');
    if (breakValue != null && String(breakValue).trim() !== '') {
      allure.addAttachment('breakValue', String(breakValue), 'text/plain');
    }
    if (input) {
      allure.addAttachment('入力値', JSON.stringify(input, null, 2), 'application/json');
    }
    if (expectedErrors && expectedErrors.length) {
      allure.addAttachment('期待エラー', expectedErrors.join('\n'), 'text/plain');
    }
  });
}

async function attachErrorScreenshot(I, baseName) {
  const fileName = `${baseName}.png`;
  const savedFileName = await I.saveScreenshotWithTimestamp(fileName);

  const outputDir = codeceptConfig && codeceptConfig.output
    ? path.resolve(__dirname, '..', codeceptConfig.output)
    : path.resolve(__dirname, '../output');
  const filePath = path.join(outputDir, savedFileName);

  if (fs.existsSync(filePath)) {
    const buffer = fs.readFileSync(filePath);
    withAllure((allure) => allure.addAttachment('画面キャプチャ', buffer, 'image/png'));
  } else {
    withAllure((allure) => allure.addAttachment('画面キャプチャ', `スクリーンショットが見つかりません: ${filePath}`, 'text/plain'));
  }
}

function attachScreenshotFromOutput(fileName, attachmentName = '画面キャプチャ') {
  const outputDir = codeceptConfig && codeceptConfig.output
    ? path.resolve(__dirname, '..', codeceptConfig.output)
    : path.resolve(__dirname, '../output');
  const filePath = path.join(outputDir, fileName);

  if (fs.existsSync(filePath)) {
    const buffer = fs.readFileSync(filePath);
    withAllure((allure) => allure.addAttachment(attachmentName, buffer, 'image/png'));
  } else {
    withAllure((allure) => allure.addAttachment(attachmentName, `スクリーンショットが見つかりません: ${filePath}`, 'text/plain'));
  }
}

/**
 * 環境変数をbooleanとして取得する
 * @param {string} envKey - 環境変数名
 * @returns {boolean}
 */
function parseEnvBoolean(envKey) {
  const value = String(process.env[envKey] || '').trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes' || value === 'on';
}

/**
 * プロファイルに応じたCSVを読み込む
 * プロファイル用ファイルが存在すればそちらを優先する
 * @param {string} baseName - CSVファイルのベース名（拡張子なし）
 * @param {string} dataDir - data/ 以下のサブディレクトリ名（例: 'shimamura', 'tframe'）
 * @returns {Array<Object>}
 */
function loadCsvWithProfile(baseName, dataDir) {
  const profile = getProfileFromArgs();
  const defaultPath = path.join(__dirname, `../data/${dataDir}/${baseName}.csv`);
  const profilePath = profile
    ? path.join(__dirname, `../data/${dataDir}/${baseName}_${profile}.csv`)
    : null;
  return (profilePath && fs.existsSync(profilePath))
    ? readCsv(profilePath)
    : readCsv(defaultPath);
}

/**
 * CSV の idnumber 列を検索して値を書き換える（ID番号重複 retry 後のメンテ用）
 * @param {string} baseName - CSVファイルのベース名
 * @param {string} dataDir  - data/ 以下のサブディレクトリ名
 * @param {string} originalId - 元の idnumber
 * @param {string} newId      - 更新後の idnumber
 */
function updateCsvIdnumber(baseName, dataDir, originalId, newId) {
  if (originalId === newId) return;
  const profile = getProfileFromArgs();
  const defaultPath = path.join(__dirname, `../data/${dataDir}/${baseName}.csv`);
  const profilePath = profile
    ? path.join(__dirname, `../data/${dataDir}/${baseName}_${profile}.csv`)
    : null;
  const filePath = (profilePath && fs.existsSync(profilePath)) ? profilePath : defaultPath;

  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim());
  const idCol = headers.indexOf('idnumber');
  if (idCol === -1) return;

  let updated = false;
  const newLines = lines.map(line => {
    if (!line.trim() || line.trim().startsWith('#')) return line;
    const values = line.split(',');
    if (values[idCol] && values[idCol].trim() === originalId) {
      values[idCol] = newId;
      updated = true;
    }
    return values.join(',');
  });

  if (updated) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    console.log(`[CSV更新] idnumber: ${originalId} → ${newId} (${path.basename(filePath)})`);
  }
}

/**
 * データ駆動テスト用にシナリオ名を付与する
 * @param {Array<Object>} data - CSVから読み込んだデータ配列
 * @param {function(Object): string} labelResolver - 各行からラベルを生成する関数
 * @returns {Array<Object>}
 */
function withScenarioLabel(data, labelResolver) {
  return data.map((row) => {
    const label = labelResolver(row);
    return {
      ...row,
      toString() {
        return label;
      }
    };
  });
}

/**
 * CSV の expectedErrors 列を配列に変換する（「|」区切り）
 * @param {string} value
 * @returns {string[]}
 */
function parseExpectedErrors(value) {
  if (!value) return [];
  return value.split('|').map(err => err.trim()).filter(Boolean);
}

/**
 * 現在の画面名と URL をログ出力する
 * @param {CodeceptJS.I} I
 * @param {string} screenName
 */
async function logScreenUrl(I, screenName) {
  I.say(`${screenName}\nURL: ${await I.grabCurrentUrl()}`);
}



/**
 * テキスト系フォームフィールドをまとめて入力する
 *
 * FORM_FILL_FAST=true  → I.executeScript で一括セット（速い・inputイベント未発火）
 * FORM_FILL_FAST=false → I.fillField で1フィールドずつ（安全・デフォルト）
 *
 * ドロップダウン・チェックボックスなど、イベントが必要なフィールドは
 * このユーティリティを使わず I.selectOption / I.checkOption を個別に呼ぶこと。
 *
 * @param {CodeceptJS.I} I
 * @param {Object.<string, string|undefined>} fieldMap - { fieldId: value } の形式
 */
function fillTextFields(I, fieldMap) {
  const entries = Object.entries(fieldMap).filter(([, v]) => v);
  if (entries.length === 0) return;

  if (process.env.FORM_FILL_FAST === 'true') {
    I.executeScript((fields) => {
      fields.forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
      });
    }, entries);
  } else {
    entries.forEach(([id, value]) => I.fillField(`#${id}`, value));
  }
}

module.exports = {
  readCsv,
  getProfileFromArgs,
  parseEnvBoolean,
  loadCsvWithProfile,
  updateCsvIdnumber,
  withScenarioLabel,
  parseExpectedErrors,
  logScreenUrl,
  fillTextFields,
  withAllure,
  setBusinessLabels,
  attachBusinessContext,
  attachErrorScreenshot,
  attachScreenshotFromOutput,
};

