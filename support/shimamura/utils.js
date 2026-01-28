/**
 * しまむらテスト専用ユーティリティ
 */

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
    I.say(`✅ サブメニューグループ：${menuname}「＋」ボタンが表示中なのでリンクを押下`);
  } else {
    I.say(`⚠️ サブメニューグループ：${menuname}「-」ボタンなのでスキップ`);
  }
}

/**
 * URLの変化を監視し、ターゲットが含まれるようになったら指定要素をクリックする
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {number} maxTries - 最大試行回数
 * @param {string} targetValue - URLに含まれるべき文字列
 * @param {string|Object} clickElement - クリックする要素
 */
async function verifyNavigationByUrlChange(I, maxTries, targetValue, clickElement) {
  for (let i = 0; i < maxTries; i++) {
    const currentUrl = await I.grabCurrentUrl();

    if (currentUrl.includes(targetValue)) {
      I.say(`✅ URLに '${targetValue}' を検出（${i + 1}回目）`);
      I.click(clickElement);
      break;
    } else {
      I.say(`⏳ 該当なし（${i + 1}回目）... 1秒待機`);
      I.wait(1);
    }

    if (i === maxTries - 1) {
      throw new Error(`❌ URLに '${targetValue}' が含まれませんでした（${maxTries}回試行）`);
    }
  }
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
  return I.executeScript((args) => {
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
  }, { labelText, inputName, inputId, containerSelector });
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
    await I.executeScript((args) => {
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
      const input = inputInRow || inputInNextCell || inputByName || inputById;
      if (input) {
        input.click();
        return true;
      }
      return false;
    }, { labelText, inputName, inputId, containerSelector });
    return;
  }

  if (containerSelector) {
    const clicked = await I.executeScript((selector) => {
      const container = document.querySelector(selector);
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
 * チェックボックスの状態を取得する（デバッグ用）
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} options - 探索条件
 * @param {string} options.labelText - 画面上のラベル（例: '月途中'）
 * @param {string} [options.inputName] - inputのname属性
 * @param {string} [options.inputId] - inputのid属性
 * @param {string} [options.containerSelector] - ルート要素
 * @returns {Promise<Object>} 状態情報
 */
async function getCheckboxStateByLabelOrName(I, { labelText, inputName, inputId, containerSelector }) {
  return resolveCheckboxState(I, { labelText, inputName, inputId, containerSelector });
}

module.exports = {
  toggleGroupmenu,
  verifyNavigationByUrlChange,
  resolveCheckboxState,
  clickCheckboxByLabelOrName,
  verifyCheckboxCheckedByLabelOrName,
  getCheckboxStateByLabelOrName,
};
