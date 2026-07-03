/**
 * しまむらテスト専用ユーティリティ
 */
const { parseEnvBoolean } = require('../utils');
const { TIMEOUTS } = require('./constants');

/**
 * サイドメニューのトグルグループを開閉する
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} options - オプション
 * @param {string} options.icon_id - トグルアイコンのID
 * @param {string} options.menuname - メニュー名
 */
async function toggleGroupmenu(I, { icon_id, menuname }) {
  const display = await I.grabCssPropertyFrom(`#${icon_id}`, 'display');

  if (display === 'none') {
    I.click(locate('span').withText(menuname));
    I.say(`-サブメニューグループ：${menuname}「＋」ボタンが表示中⇒link click`);
  } else {
    I.say(`-サブメニューグループ：${menuname}「-」ボタン⇒skip`);
  }
}

/**
 * URLの変化を監視し、ターゲットが含まれるようになったら指定要素をクリックする
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {number} maxTries - 最大待機秒数（旧: 試行回数）
 * @param {string} targetValue - URLに含まれるべき文字列
 * @param {string|Object} clickElement - クリックする要素
 */
async function verifyNavigationByUrlChange(I, maxTries, targetValue, clickElement) {
  await I.waitForFunction(
    `() => window.location.href.includes('${targetValue}')`,
    maxTries
  );
  I.say(`✅ URLに '${targetValue}' を検出`);
  I.click(clickElement);
}

/**
 * SHIMAMURA_TANTOUSYA 環境変数を検証し、正規化した値を返す
 * @returns {string} 担当者番号
 * @throws {Error} 未設定の場合
 */
function validateShimamuraEnv() {
  const tantousyaNumber = process.env.SHIMAMURA_TANTOUSYA;
  if (!tantousyaNumber) {
    throw new Error('❌ SHIMAMURA_TANTOUSYA が環境変数（.envファイル）に設定されていません。プロファイルが正しく指定されているか確認してください。');
  }
  return String(tantousyaNumber).replace(/['"]/g, '');
}

function isCheckboxDebugEnabled() {
  return parseEnvBoolean('CHECKBOX_DEBUG');
}

function formatCheckboxDebugSummary(state, args) {
  return [
    '[checkbox-debug]',
    `label="${args.labelText || ''}"`,
    `name="${args.inputName || ''}"`,
    `id="${args.inputId || ''}"`,
    `found=${state.inputFound}`,
    `checked=${state.checked}`,
    `aria=${state.ariaChecked ?? 'null'}`,
    `container=${state.containerFound}`
  ].join(' ');
}

/**
 * チェックボックスの探索結果を取得する（島村専用）
 * 探索順: ラベル近傍 → 次セル → name → input#id → container
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} options - 探索条件
 * @param {string} options.labelText - 画面上のラベル（例: '月途中'）
 * @param {string} [options.inputName] - inputのname属性
 * @param {string} [options.inputId] - inputのid属性
 * @param {string} [options.containerSelector] - ルート要素
 * @returns {Promise<Object>} 状態情報
 */
async function resolveCheckboxState(I, { labelText, inputName, inputId, containerSelector }) {
  const args = { labelText, inputName, inputId, containerSelector };
  const state = await I.executeScript((args) => {
    const { labelText, inputName, inputId, containerSelector } = args;
    const labelCandidate = Array.from(document.querySelectorAll('label,td,th,span,div'))
      .find(el => el.textContent && el.textContent.trim().includes(labelText));
    const row = labelCandidate ? (labelCandidate.closest('tr') || labelCandidate.parentElement) : null;
    const inputInRow = row
      ? row.querySelector('input[type="checkbox"], input[type="radio"]')
      : null;
    const inputInNextCell = labelCandidate && labelCandidate.nextElementSibling
      ? labelCandidate.nextElementSibling.querySelector('input[type="checkbox"], input[type="radio"]')
      : null;
    const inputByName = inputName
      ? document.querySelector(`input[name="${inputName}"]`)
      : null;
    const inputById = inputId
      ? document.querySelector(`input#${inputId}`)
      : null;
    const container = containerSelector ? document.querySelector(containerSelector) : null;
    const input = inputInRow || inputInNextCell || inputByName || inputById;
    const target = input || container;
    const ariaChecked = target ? target.getAttribute('aria-checked') : null;
    return {
      inputFound: Boolean(input),
      checked: input ? input.checked : null,
      ariaChecked,
      labelFound: Boolean(labelCandidate),
      rowFound: Boolean(row),
      containerFound: Boolean(container),
      inputId: input ? input.id : null,
      inputName: input ? input.name : null,
      inputType: input ? input.type : null,
      inputHtml: input ? input.outerHTML : null,
      containerHtml: container ? container.outerHTML : null
    };
  }, args);

  if (isCheckboxDebugEnabled()) {
    I.say(formatCheckboxDebugSummary(state, args));
  }

  return state;
}

/**
 * チェックボックスの要素を検出してクリックする（島村専用）
 * - まずラベル文字列から近傍のinputを探す
 * - 次に name / id で直接探索する
 * - どれも見つからない場合は containerSelector をクリックする
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} options - 探索条件
 * @param {string} options.labelText - 画面上のラベル（例: '月途中'）
 * @param {string} [options.inputName] - inputのname属性
 * @param {string} [options.inputId] - inputのid属性
 * @param {string} [options.containerSelector] - 最終フォールバックのクリック対象
 */
async function clickCheckboxByLabelOrName(I, { labelText, inputName, inputId, containerSelector }) {
  const state = await resolveCheckboxState(I, { labelText, inputName, inputId, containerSelector });

  if (state.inputFound) {
    // resolveCheckboxState が返した id / name を使って直接クリック（DOM再検索不要）
    const selector = state.inputId
      ? `#${state.inputId}`
      : state.inputName
        ? `input[name="${state.inputName}"]`
        : null;

    if (selector) {
      await I.executeScript((sel) => {
        const el = document.querySelector(sel);
        if (el) el.click();
      }, selector);
      return;
    }
  }

  if (containerSelector) {
    const clicked = await I.executeScript((sel) => {
      const container = document.querySelector(sel);
      if (container) {
        container.click();
        return true;
      }
      return false;
    }, containerSelector);
    if (clicked) return;
  }

  throw new Error(`Checkbox click failed: label="${labelText}", name="${inputName}", id="${inputId}"`);
}

/**
 * チェックボックスがONになっているかを検証する（島村専用）
 * - ラベル文字列 → 近傍input の順で検索
 * - name / id を優先的に検証
 * - inputがない場合は aria-checked を確認
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} options - 探索条件
 * @param {string} options.labelText - 画面上のラベル（例: '月途中'）
 * @param {string} [options.inputName] - inputのname属性
 * @param {string} [options.inputId] - inputのid属性
 * @param {string} [options.containerSelector] - ルート要素
 */
async function verifyCheckboxCheckedByLabelOrName(
  I,
  {
    labelText,
    inputName,
    inputId,
    containerSelector,
    waitTries = 5,
    waitSec = 0.5
  }
) {
  for (let i = 0; i < waitTries; i++) {
    const state = await resolveCheckboxState(I, { labelText, inputName, inputId, containerSelector });

    if (state.inputFound && state.checked === true) return;
    if (!state.inputFound && state.ariaChecked === 'true') return;

    if (i < waitTries - 1) {
      I.wait(waitSec);
    } else {
      throw new Error(`Checkbox not checked: ${JSON.stringify(state)}`);
    }
  }
}

/**
 * バリデーションエラーメッセージを検証する
 * @param {CodeceptJS.I} I
 * @param {string[]} expectedErrors - 期待するエラー文言の配列
 * @param {string} containerSelector - エラー表示コンテナのセレクタ
 */
async function verifyValidationErrors(I, expectedErrors, containerSelector) {
  I.waitForElement(containerSelector, TIMEOUTS.SCREEN);
  expectedErrors.forEach(err => I.see(err, containerSelector));
}

/**
 * 保存後に shimamura エラーダイアログ（#top_err_info_msg_div）にテキストがないことを確認する
 * エラーテキストがあれば throw する
 * @param {CodeceptJS.I} I
 * @param {string} [context] - エラーメッセージのプレフィックス（例: '【受講生基本情報】保存'）
 */
async function assertNoShimamuraError(I, context = '処理') {
  const errorInfo = await I.executeScript(() => {
    const el = document.querySelector('#top_err_info_msg_div');
    if (!el) return null;
    const text = el.innerText.trim();
    if (!text) return null;
    return { text, html: el.innerHTML.trim() };
  });
  if (errorInfo) {
    throw new Error(`${context}エラー: ${errorInfo.text}\n[HTML] ${errorInfo.html}`);
  }
}

/**
 * CSS selector ベースのテキストフィールドを一括入力する（shimamura用）
 * id セレクタ（#keijoubi 等）や複合セレクタを扱う場合に使用する
 *
 * @param {CodeceptJS.I} I
 * @param {Array<[string, string|undefined]>} selectorValuePairs - [[selector, value], ...] の形式
 */
function fillTextFieldsBySelector(I, selectorValuePairs) {
  const entries = selectorValuePairs.filter(([, v]) => v);
  if (entries.length === 0) return;
  I.executeScript((fields) => {
    fields.forEach(([sel, value]) => {
      const el = document.querySelector(sel);
      if (el) el.value = value;
    });
  }, entries);
}

/**
 * name属性ベースのテキストフィールドを一括入力する（shimamura用）
 *
 * FORM_FILL_FAST=true  → I.executeScript で一括セット（速い）
 * FORM_FILL_FAST=false → I.fillField で1フィールドずつ（安全・デフォルト）
 *
 * @param {CodeceptJS.I} I
 * @param {Object.<string, string|undefined>} fieldMap - { fieldName: value } の形式
 */
function fillTextFieldsByName(I, fieldMap) {
  const entries = Object.entries(fieldMap).filter(([, v]) => v);
  if (entries.length === 0) return;

  if (process.env.FORM_FILL_FAST === 'true') {
    I.executeScript((fields) => {
      fields.forEach(([name, value]) => {
        const el = document.querySelector(`[name="${name}"]`);
        if (el) el.value = value;
      });
    }, entries);
  } else {
    entries.forEach(([name, value]) => I.fillField(`[name="${name}"]`, value));
  }
}

/**
 * CSV由来の日付が過去月の場合、本日日付に自動補正する（動的日付フィールド）。
 * shimamuraの経理ビューBは「開始日は当月以降で入力してください」という当月以降バリデーションを
 * 持つため、CSVに固定日付（例: 2026-06-05）を書いておくと月をまたいだ瞬間にテストが落ちる。
 * 呼び出し側で `resolveDynamicDateIfPast(I, current.keiyakuDate, 'keiyakuDate')` のように
 * 明示的に包むことで、どのCSV列が動的補正の対象かをコード上で分かるようにしている。
 *
 * 画面によって許容される過去月幅が異なる（例: 契約日/開始日は当月以降のみ、退会処理は
 * 先月まで許容・先々月以前はNG）ため、`graceMonths` で許容する遡り月数を指定できる。
 *
 * @param {CodeceptJS.I} I
 * @param {string} dateStr - CSV由来の日付文字列（YYYY-MM-DD）
 * @param {string} fieldLabel - ログ表示用のフィールド名（例: 'keiyakuDate'）
 * @param {{graceMonths?: number}} [options] - graceMonths: 当月から遡って許容する月数（既定0=当月以降のみ有効。退会処理は1=先月まで有効）
 * @returns {string} 許容範囲内ならそのまま、範囲外（過去すぎる）なら本日日付（YYYY-MM-DD）
 */
function resolveDynamicDateIfPast(I, dateStr, fieldLabel, { graceMonths = 0 } = {}) {
  if (!dateStr) return dateStr;
  const original = new Date(dateStr);
  if (isNaN(original.getTime())) return dateStr;

  const now = new Date();
  const originalYm = original.getFullYear() * 12 + original.getMonth();
  const nowYm = now.getFullYear() * 12 + now.getMonth();
  if (originalYm >= nowYm - graceMonths) return dateStr;

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  I.say(`⚠ 【動的日付補正】${fieldLabel}: CSV記載値 "${dateStr}" は過去月のため本日日付に自動補正 → "${todayStr}"`);
  return todayStr;
}

module.exports = {
  validateShimamuraEnv,
  toggleGroupmenu,
  verifyNavigationByUrlChange,
  resolveCheckboxState,
  clickCheckboxByLabelOrName,
  verifyCheckboxCheckedByLabelOrName,
  verifyValidationErrors,
  assertNoShimamuraError,
  fillTextFieldsByName,
  fillTextFieldsBySelector,
  resolveDynamicDateIfPast,
};
