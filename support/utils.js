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
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${baseName}_${timestamp}.png`;
  await I.saveScreenshot(fileName);

  const outputDir = codeceptConfig && codeceptConfig.output
    ? path.resolve(__dirname, '..', codeceptConfig.output)
    : path.resolve(__dirname, '../output');
  const filePath = path.join(outputDir, fileName);

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

module.exports = {
  readCsv,
  getProfileFromArgs,
  withAllure,
  setBusinessLabels,
  attachBusinessContext,
  attachErrorScreenshot,
  attachScreenshotFromOutput,
};
