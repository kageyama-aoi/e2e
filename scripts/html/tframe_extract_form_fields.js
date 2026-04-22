#!/usr/bin/env node
/**
 * @fileoverview tframe 専用 登録画面フォームフィールド抽出ツール
 *
 * ブラウザの DevTools でコピーした登録画面 HTML から
 * テストデータテンプレートと Page Object fillメソッドを自動生成する。
 *
 * 【使い方】
 *   node scripts/html/tframe_extract_form_fields.js            # input/input.html を読み込む（デフォルト）
 *   node scripts/html/tframe_extract_form_fields.js [file.html] # 任意のHTMLファイルを指定
 *
 * 【手順】
 *   1. ブラウザ DevTools で登録画面の #rootWidget を右クリック → 「outerHTMLをコピー」
 *   2. scripts/html/input/input.html に貼り付けて保存
 *   3. node scripts/html/tframe_extract_form_fields.js を実行
 *   4. output/extract_result.js を開いてコピペ（実行のたびに上書き）
 *
 * 【サンプル】
 *   input/sample_teacher_registration.html（講師登録画面の代表的なフィールド構成）
 *
 * 【出力の構成】
 *   ① テストデータテンプレート → data/tframe/xxxRegisterData.js に貼り付け
 *   ② Page Object fillメソッド → pages/tframe/XxxPage.js に貼り付け
 *      fillSectionN は適切な名前（fillPersonalInfo1 など）に変更すること
 *
 * 【対応フィールド種別】
 *   tf-text / tf-number / tf-email → I.fillField
 *   tf-date                        → I.fillField（日付文字列を直接入力）
 *   tf-select                      → I.selectOption
 *   tf-checkbox                    → I.checkOption
 *   tf-textarea                    → I.fillField
 *
 * 【自動除外されるもの】
 *   - type="hidden" / type="button"
 *   - 保存・キャンセルボタン（ewSaveButton, ewCancelButton）
 *   - ポップアップピッカー表示欄（popup-picker-display）
 *   - 内部サフィックス付き要素（_display, _start, _clear, _tooltip, _date）
 *   - 郵便番号検索ボタン（zipCodeBtn）
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── パス定義 ──────────────────────────────────────────────────
//
// 引数なしで実行した場合に読み込む HTML ファイル。
// 毎回このファイルを上書きして使い回す運用を想定。
const DEFAULT_INPUT = path.join(__dirname, 'input', 'input.html');

// 出力先ディレクトリ。実行のたびにタイムスタンプ付きファイルを生成する。
const OUTPUT_DIR = path.join(__dirname, 'output');

// ── 入力読み込み ──────────────────────────────────────────────

function readInput() {
  // コマンドライン引数があればそちら、なければデフォルトパスを使用
  const file = process.argv[2] || DEFAULT_INPUT;
  return fs.readFileSync(file, 'utf8');
}

// ── セクション分割 ────────────────────────────────────────────

/**
 * tframe 登録画面の HTML を「個人情報1」「支払規定等」などのセクション単位に分割する。
 *
 * tframe の登録画面は以下の構造を持つ:
 *   <div class="tf-group-title ..."><span ...></span>セクション名</div>
 *   <div class="tf-group-body ...">（フィールド群）</div>
 *
 * tf-group-title の出現位置を境界として、次の tf-group-title までの HTML を
 * そのセクションのコンテンツとして切り出す。
 *
 * @param {string} html 登録画面全体の HTML
 * @returns {{ title: string, content: string }[]} セクション配列
 */
function splitSections(html) {
  // tf-group-title の中身は <span アイコン></span>セクション名</div> という構造。
  // </span> 以降の改行なしテキストをセクション名として取得する。
  const titleRe = /<div[^>]*class="[^"]*tf-group-title[^"]*"[^>]*>[\s\S]*?<\/span>\s*([^<\n]+?)\s*<\/div>/g;

  const boundaries = [];
  let m;
  while ((m = titleRe.exec(html)) !== null) {
    boundaries.push({
      title: m[1].trim(),
      contentStart: titleRe.lastIndex, // タイトル直後からコンテンツ開始
    });
  }

  // 各セクションのコンテンツは「次のタイトル開始位置」または「HTML末尾」まで
  return boundaries.map((b, i) => ({
    title: b.title,
    content: html.slice(
      b.contentStart,
      i + 1 < boundaries.length ? boundaries[i + 1].contentStart : html.length
    ),
  }));
}

// ── フィールド抽出 ─────────────────────────────────────────────

/**
 * テスト対象外として除外する要素の ID パターン。
 *
 * - ewSave / ewCancel / zipCodeBtn : 保存・キャンセル・郵便番号検索ボタン
 * - _display  : ポップアップピッカーの表示専用テキスト欄（readonly）
 * - _start    : ポップアップを開くボタン
 * - _clear    : ポップアップ選択をクリアするボタン
 * - _tooltip  : ツールチップ用スパン（フォーム要素ではない）
 * - _date     : datepicker のラッパー div に付く ID（input 自体ではない）
 */
const EXCLUDE_ID = /^(ewSave|ewCancel|zipCodeBtn)|(_display|_start|_clear|_tooltip|_date)$/;

/**
 * テスト対象外として除外する要素の class パターン。
 *
 * - popup-picker       : ポップアップ系の表示欄・ボタン
 * - tf-ewSaveButton    : 保存ボタン
 * - tf-ewCancelButton  : キャンセルボタン
 * - tf-button          : その他ボタン（郵便番号検索など）
 */
const EXCLUDE_CLASS = /popup-picker|tf-ewSaveButton|tf-ewCancelButton|tf-button/;

/**
 * セクション HTML から、テスト入力対象となるフォームフィールドを抽出する。
 *
 * 判定ロジック:
 *   1. input / select / textarea タグを全件走査
 *   2. tframe のフォーム要素は必ず class に "tf-data" を含む → それ以外は除外
 *   3. EXCLUDE_ID / EXCLUDE_CLASS に該当するものを除外
 *   4. type="hidden" / type="button" を除外
 *   5. 同一 ID の重複を seen セットで除外
 *      （birthdateYear 等が二重にマッチするケースの対策）
 *   6. そのフィールドより前に現れる最後の tf-label をラベルとして採用
 *      （tframe は label → input の順で配置されるため）
 *
 * @param {string} content セクションの HTML
 * @returns {{ id: string, fieldType: string, label: string, required: boolean }[]}
 */
function extractFields(content) {
  const fields = [];
  const seen = new Set(); // 重複 ID を弾くためのセット
  const elemRe = /<(input|select|textarea)([^>]*)>/gi;
  let m;

  while ((m = elemRe.exec(content)) !== null) {
    const tag = m[1].toLowerCase();
    const attrs = m[2];

    // ── class チェック ──
    const clsM = /\bclass="([^"]*)"/.exec(attrs);
    const cls = clsM ? clsM[1] : '';
    if (!cls.includes('tf-data')) continue; // tframe のフォーム要素でなければスキップ
    if (EXCLUDE_CLASS.test(cls)) continue;

    // ── ID チェック ──
    const idM = /\bid="([^"]+)"/.exec(attrs);
    if (!idM) continue;
    const id = idM[1];
    if (EXCLUDE_ID.test(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);

    // ── type チェック（input のみ）──
    const typeM = /\btype="([^"]+)"/.exec(attrs);
    const type = typeM ? typeM[1] : 'text';
    if (type === 'hidden' || type === 'button') continue;

    // ── フィールド種別の決定 ──
    // CodeceptJS の操作メソッド（fillField / selectOption / checkOption）を
    // 出力時に切り替えるために種別を記録しておく
    let fieldType;
    if (tag === 'select')          fieldType = 'select';
    else if (tag === 'textarea')   fieldType = 'textarea';
    else if (type === 'checkbox')  fieldType = 'checkbox';
    else if (cls.includes('tf-date'))   fieldType = 'date';
    else if (cls.includes('tf-number')) fieldType = 'number';
    else if (cls.includes('tf-email'))  fieldType = 'email';
    else                           fieldType = 'text';

    // ── ラベル取得 ──
    // このフィールドより前に出現する tf-label の中で最後のものを使う。
    // tframe は <label>...</label> → <input> の順で配置されており、
    // 直前のラベルが必ずそのフィールドに対応する。
    const before = content.substring(0, m.index);
    const labelRe = /<label[^>]*class="([^"]*tf-label[^"]*)"[^>]*>([^<]+)<\/label>/g;
    let lm;
    let label = id;     // ラベルが見つからない場合は ID をそのまま使う
    let required = false;
    while ((lm = labelRe.exec(before)) !== null) {
      label = lm[2].replace(/:$/, '').trim(); // 末尾の「:」を除去
      required = lm[1].includes('required-mark'); // 必須マークの有無
    }

    fields.push({ id, fieldType, label, required });
  }

  return fields;
}

// ── 出力生成 ──────────────────────────────────────────────────

/**
 * フィールド種別に応じた CodeceptJS 操作コードを返す。
 *
 * tframe の各フィールドタイプと CodeceptJS メソッドの対応:
 *   select   → I.selectOption  （ドロップダウン）
 *   checkbox → I.checkOption   （チェックボックス）
 *   その他   → I.fillField     （テキスト / 数値 / メール / 日付 / テキストエリア）
 *
 * @param {{ id: string, fieldType: string }} field
 * @returns {string} CodeceptJS のメソッド呼び出しコード
 */
function toCallCode(field) {
  switch (field.fieldType) {
    case 'select':   return `I.selectOption('#${field.id}', data.${field.id});`;
    case 'checkbox': return `I.checkOption('#${field.id}');`;
    default:         return `I.fillField('#${field.id}', data.${field.id});`;
  }
}

/**
 * セクションインデックスからメソッド名を生成する。
 * fillSection1, fillSection2 … という連番で出力し、
 * 後から fillPersonalInfo1 などの適切な名前に変更することを前提としている。
 *
 * @param {string} title セクション名（現在は未使用、将来の自動変換用に残す）
 * @param {number} i     セクションのインデックス（0始まり）
 * @returns {string} メソッド名
 */
function toMethodName(title, i) {
  return `fillSection${i + 1}`;
}

/**
 * 全セクション情報からテストコードのテンプレート文字列を生成する。
 *
 * 出力は 2 ブロック構成:
 *   ① generateTestXxx() 関数 → data/tframe/xxxRegisterData.js に貼り付け
 *   ② fillSectionN() / fillRegistrationForm() → pages/tframe/XxxPage.js に貼り付け
 *
 * フィールド名の長さを揃えてコードを整形するため、
 * セクションごとに最長 ID 長を計算してパディングしている。
 *
 * @param {{ title: string, content: string }[]} sections
 * @returns {string} 出力テキスト全体
 */
function generateOutput(sections) {
  const dataLines = [];   // テストデータテンプレートの行
  const methodLines = []; // Page Object fillメソッドの行
  const methodNames = []; // fillRegistrationForm で呼び出すメソッド名リスト

  sections.forEach((sec, i) => {
    const fields = extractFields(sec.content);
    if (fields.length === 0) return; // フィールドがないセクション（ボタン行など）はスキップ

    const methodName = toMethodName(sec.title, i);
    methodNames.push({ name: methodName, title: sec.title });

    // フィールド名を揃えて整形するための最長 ID 長
    const maxIdLen = Math.max(...fields.map(f => f.id.length));

    // ─── ① テストデータテンプレート ───
    dataLines.push(`  // ── ${sec.title} ${'─'.repeat(Math.max(0, 30 - sec.title.length))}`);
    fields.forEach(f => {
      const key = f.id.padEnd(maxIdLen);
      const req = f.required ? ' *必須' : '';
      // checkbox だけ false、それ以外は空文字列をデフォルト値とする
      const defaultVal = f.fieldType === 'checkbox' ? 'false' : "''";
      dataLines.push(`  ${key}: ${defaultVal},  // ${f.label}${req}`);
    });
    dataLines.push('');

    // ─── ② Page Object fillメソッド ───
    methodLines.push(`  /**`);
    methodLines.push(`   * ${sec.title} を入力する`);
    methodLines.push(`   * @param {object} data`);
    methodLines.push(`   */`);
    // メソッド名の TODO コメントで手動変更を促す
    methodLines.push(`  ${methodName}(data) {  // TODO: 適切なメソッド名に変更（例: fill${sec.title.replace(/\s/g, '')}）`);
    methodLines.push(`    I.say('【登録】${sec.title} を入力');`);
    fields.forEach(f => {
      // if (data.fieldId) の条件を揃えて整形（空値・未設定のフィールドをスキップするため）
      const cond = `data.${f.id}`.padEnd(maxIdLen + 5);
      const call = toCallCode(f);
      const req = f.required ? '  // *必須' : '';
      methodLines.push(`    if (${cond}) ${call}${req}`);
    });
    methodLines.push(`  },`);
    methodLines.push('');
  });

  // ─── fillRegistrationForm（全セクションをまとめて呼び出す）───
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
    '// data/tframe/xxxRegisterData.js に貼り付け',
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
    '// pages/tframe/XxxPage.js に貼り付け',
    ...methodLines,
    '',
    SEP,
  ];

  return lines.join('\n');
}

// ── ファイル保存 ──────────────────────────────────────────────

/**
 * 出力内容をタイムスタンプ付きファイルに保存する。
 * output/ ディレクトリが存在しない場合は自動作成する。
 *
 * @param {string} content 保存するテキスト
 * @returns {string} 保存したファイルの絶対パス
 */
function saveToFile(content) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
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
  const filePath = path.join(OUTPUT_DIR, `extract_result_${ts}.js`);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

// ── メイン ────────────────────────────────────────────────────

(function main() {
  // HTML 読み込み
  let html;
  try {
    html = readInput();
  } catch (e) {
    console.error('エラー: HTMLの読み込みに失敗しました。');
    console.error(`  デフォルト入力: ${DEFAULT_INPUT}`);
    console.error('  ブラウザ DevTools で登録画面の #rootWidget をコピーして input/input.html に貼り付けてください。');
    process.exit(1);
  }

  // セクション分割
  const sections = splitSections(html);
  if (sections.length === 0) {
    console.error('セクションが見つかりませんでした。tf-group-title を含む tframe 登録画面の HTML を入力してください。');
    process.exit(1);
  }

  // 出力生成・表示・保存
  const output = generateOutput(sections);
  console.log(output);

  const savedPath = saveToFile(output);
  console.error(`\n保存しました: ${savedPath}`);
})();
