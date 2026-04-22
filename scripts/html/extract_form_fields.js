#!/usr/bin/env node
/**
 * @fileoverview tframe 登録画面フォームフィールド抽出ツール
 *
 * ブラウザの DevTools でコピーした登録画面 HTML から
 * テストデータテンプレートと Page Object fillメソッドを自動生成する。
 *
 * 使い方:
 *   node scripts/html/extract_form_fields.js            # input/input.html を読み込む（デフォルト）
 *   node scripts/html/extract_form_fields.js [file.html] # 任意のHTMLファイルを指定
 *
 * 手順:
 *   1. ブラウザ DevTools で登録画面の #rootWidget を右クリック → 「outerHTMLをコピー」
 *   2. scripts/html/input/input.html に貼り付けて保存
 *   3. node scripts/html/extract_form_fields.js を実行
 *   4. output/extract_result.js を参照（実行のたびに上書き）
 *
 * サンプル:
 *   input/sample_teacher_registration.html（講師登録画面の代表的なフィールド構成）
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── 入力 ─────────────────────────────────────────────────────

const DEFAULT_INPUT  = path.join(__dirname, 'input', 'input.html');
const OUTPUT_FILE    = path.join(__dirname, 'output', 'extract_result.js');

function readInput() {
  const file = process.argv[2] || DEFAULT_INPUT;
  return fs.readFileSync(file, 'utf8');
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
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
  return OUTPUT_FILE;
}

// ── メイン ────────────────────────────────────────────────────

(function main() {
  let html;
  try {
    html = readInput();
  } catch (e) {
    console.error(`エラー: HTMLの読み込みに失敗しました。`);
    console.error(`  デフォルト入力: ${DEFAULT_INPUT}`);
    console.error(`  ブラウザ DevTools で登録画面の #rootWidget をコピーして input/input.html に貼り付けてください。`);
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
