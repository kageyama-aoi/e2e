#!/usr/bin/env node
/**
 * @fileoverview tframe 登録画面フォームフィールド抽出ツール
 *
 * ブラウザの DevTools でコピーした登録画面 HTML から
 * テストデータテンプレートと Page Object fillメソッドを自動生成する。
 *
 * 使い方:
 *   node scripts/html/extract_form_fields.js input.html
 *   node scripts/html/extract_form_fields.js < input.html
 *
 * 手順:
 *   1. ブラウザ DevTools で登録画面の #rootWidget を右クリック → 「outerHTMLをコピー」
 *   2. テキストファイルに貼り付けて保存（例: input.html）
 *   3. 上記コマンドで実行
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── 入力 ─────────────────────────────────────────────────────

function readInput() {
  const file = process.argv[2];
  if (file) return fs.readFileSync(file, 'utf8');
  return fs.readFileSync(0, 'utf8'); // stdin
}

// ── セクション分割 ────────────────────────────────────────────

/**
 * tf-group-title を区切りに HTML をセクション配列に分割する
 * @param {string} html
 * @returns {{ title: string, content: string }[]}
 */
function splitSections(html) {
  // <div class="tf-group-title ..."><span ...></span>セクション名</div>
  const titleRe = /<div[^>]*class="[^"]*tf-group-title[^"]*"[^>]*>[\s\S]*?<\/span>\s*([^<\n]+?)\s*<\/div>/g;
  const boundaries = [];
  let m;

  while ((m = titleRe.exec(html)) !== null) {
    boundaries.push({ title: m[1].trim(), contentStart: titleRe.lastIndex });
  }

  return boundaries.map((b, i) => ({
    title: b.title,
    content: html.slice(
      b.contentStart,
      i + 1 < boundaries.length ? boundaries[i + 1].contentStart : html.length
    ),
  }));
}

// ── フィールド抽出 ─────────────────────────────────────────────

/** 除外するIDパターン */
const EXCLUDE_ID = /^(ewSave|ewCancel|zipCodeBtn)|(_display|_start|_clear|_tooltip|_date)$/;

/** 除外するclassパターン */
const EXCLUDE_CLASS = /popup-picker|tf-ewSaveButton|tf-ewCancelButton|tf-button/;

/**
 * セクション内の全フォームフィールドを抽出する
 * @param {string} content
 * @returns {{ id: string, fieldType: string, label: string, required: boolean }[]}
 */
function extractFields(content) {
  const fields = [];
  const seen = new Set();
  const elemRe = /<(input|select|textarea)([^>]*)>/gi;
  let m;

  while ((m = elemRe.exec(content)) !== null) {
    const tag = m[1].toLowerCase();
    const attrs = m[2];

    // class
    const clsM = /\bclass="([^"]*)"/.exec(attrs);
    const cls = clsM ? clsM[1] : '';
    if (!cls.includes('tf-data')) continue;
    if (EXCLUDE_CLASS.test(cls)) continue;

    // id
    const idM = /\bid="([^"]+)"/.exec(attrs);
    if (!idM) continue;
    const id = idM[1];
    if (EXCLUDE_ID.test(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);

    // type
    const typeM = /\btype="([^"]+)"/.exec(attrs);
    const type = typeM ? typeM[1] : 'text';
    if (type === 'hidden' || type === 'button') continue;

    // フィールド種別
    let fieldType;
    if (tag === 'select')       fieldType = 'select';
    else if (tag === 'textarea') fieldType = 'textarea';
    else if (type === 'checkbox') fieldType = 'checkbox';
    else if (cls.includes('tf-date'))   fieldType = 'date';
    else if (cls.includes('tf-number')) fieldType = 'number';
    else if (cls.includes('tf-email'))  fieldType = 'email';
    else                        fieldType = 'text';

    // このフィールドより前にある最近傍の tf-label を探す
    const before = content.substring(0, m.index);
    const labelRe = /<label[^>]*class="([^"]*tf-label[^"]*)"[^>]*>([^<]+)<\/label>/g;
    let lm;
    let label = id;
    let required = false;
    while ((lm = labelRe.exec(before)) !== null) {
      label = lm[2].replace(/:$/, '').trim();
      required = lm[1].includes('required-mark');
    }

    fields.push({ id, fieldType, label, required });
  }

  return fields;
}

// ── 出力生成 ──────────────────────────────────────────────────

/**
 * フィールド種別に応じた CodeceptJS 操作コードを返す
 * @param {{ id: string, fieldType: string }} field
 * @returns {string}
 */
function toCallCode(field) {
  switch (field.fieldType) {
    case 'select':   return `I.selectOption('#${field.id}', data.${field.id});`;
    case 'checkbox': return `I.checkOption('#${field.id}');`;
    default:         return `I.fillField('#${field.id}', data.${field.id});`;
  }
}

/**
 * セクション名から camelCase メソッド名のヒントを生成する（手動修正前提）
 * @param {string} title
 * @param {number} i
 * @returns {string}
 */
function toMethodName(title, i) {
  return `fillSection${i + 1}`;
}

/**
 * 全セクション情報から出力テキストを生成する
 * @param {{ title: string, content: string }[]} sections
 * @returns {string}
 */
function generateOutput(sections) {
  const dataLines = [];
  const methodLines = [];
  const methodNames = [];

  sections.forEach((sec, i) => {
    const fields = extractFields(sec.content);
    if (fields.length === 0) return;

    const methodName = toMethodName(sec.title, i);
    methodNames.push({ name: methodName, title: sec.title });

    // 最長フィールド名の長さ（整形用）
    const maxIdLen = Math.max(...fields.map(f => f.id.length));

    // ─── テストデータテンプレート ───
    dataLines.push(`  // ── ${sec.title} ${'─'.repeat(Math.max(0, 30 - sec.title.length))}`);
    fields.forEach(f => {
      const key = f.id.padEnd(maxIdLen);
      const req = f.required ? ' *必須' : '';
      const defaultVal = f.fieldType === 'checkbox' ? 'false' : "''";
      dataLines.push(`  ${key}: ${defaultVal},  // ${f.label}${req}`);
    });
    dataLines.push('');

    // ─── fillメソッド ───
    methodLines.push(`  /**`);
    methodLines.push(`   * ${sec.title} を入力する`);
    methodLines.push(`   * @param {object} data`);
    methodLines.push(`   */`);
    methodLines.push(`  ${methodName}(data) {  // TODO: 適切なメソッド名に変更（例: fill${sec.title.replace(/\s/g, '')}）`);
    methodLines.push(`    I.say('【登録】${sec.title} を入力');`);
    fields.forEach(f => {
      const cond = `data.${f.id}`.padEnd(maxIdLen + 5);
      const call = toCallCode(f);
      const req = f.required ? '  // *必須' : '';
      if (f.fieldType === 'checkbox') {
        methodLines.push(`    if (${cond}) ${call}${req}`);
      } else {
        methodLines.push(`    if (${cond}) ${call}${req}`);
      }
    });
    methodLines.push(`  },`);
    methodLines.push('');
  });

  // ─── fillRegistrationForm ───
  methodLines.push(`  fillRegistrationForm(data) {`);
  methodNames.forEach(({ name, title }) => {
    methodLines.push(`    this.${name}(data);  // ${title}`);
  });
  methodLines.push(`  },`);

  const SEP = '='.repeat(60);
  const lines = [
    SEP,
    ' tframe フォームフィールド抽出ツール',
    SEP,
    '',
    '【テストデータテンプレート】',
    `// data/tframe/xxxRegisterData.js に貼り付け`,
    'function generateTestXxx() {',
    '  return {',
    ...dataLines.map(l => '  ' + l),
    '  };',
    '}',
    'module.exports = { generateTestXxx };',
    '',
    SEP,
    '',
    '【Page Object fillメソッド】',
    `// pages/tframe/XxxPage.js に貼り付け`,
    ...methodLines,
    '',
    SEP,
  ];

  return lines.join('\n');
}

// ── ファイル保存 ──────────────────────────────────────────────

/**
 * 出力をタイムスタンプ付きファイルに保存する
 * @param {string} content
 * @returns {string} 保存したファイルの絶対パス
 */
function saveToFile(content) {
  const outputDir = path.join(__dirname, 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  const now = new Date();
  const ts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '_',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');

  const filePath = path.join(outputDir, `extract_result_${ts}.js`);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

// ── メイン ────────────────────────────────────────────────────

(function main() {
  let html;
  try {
    html = readInput();
  } catch (e) {
    console.error('エラー: HTMLの読み込みに失敗しました。');
    console.error('使い方: node scripts/html/extract_form_fields.js input.html');
    process.exit(1);
  }

  const sections = splitSections(html);

  if (sections.length === 0) {
    console.error('セクションが見つかりませんでした。tf-group-title を含む tframe 登録画面のHTMLを入力してください。');
    process.exit(1);
  }

  const output = generateOutput(sections);
  console.log(output);

  const savedPath = saveToFile(output);
  console.error(`\n保存しました: ${savedPath}`);
})();
