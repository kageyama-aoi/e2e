'use strict';

/**
 * 登録画面のフォームを「そのまま送信する」ことで、UI 操作を経由せずに1件登録する共通処理。
 * 『テスト自動化実践ガイド』10-3-2「APIで事前準備」の shimamura 版（#231 / #234）。
 *
 * **API ではない**
 * shimamura にはデータ作成用の API が無い。ここでやっているのは、保存ボタンが送るのと同じ
 * フォーム送信（`POST index.php` / `action=EW_AN`）をブラウザの中で代わりに出すことで、
 * API の代替品にあたる。サーバー側には何も足していない。そのため名前も「API」ではなく
 * 「フォーム送信（Submit）」で統一している。本物の API と違い、画面の作りが変わると壊れうる、
 * ログイン済みブラウザが要る、応答は HTML なので成否は URL で見る、という制約がある。
 *
 * **どの画面で使えるか**
 * shimamura の登録画面はほぼすべて同じ作りになっている（#231 の調査で確認）。
 * - `form[name="EditView"]`（`multipart/form-data`）に hidden の `module` と `action=EW_AN`
 * - 保存ボタンは `type="button"` で、onclick は `submittype=save` を立てて submit するだけ
 * - 成功すると詳細画面へリダイレクトされ、URL に `record=<UUID>` が付く
 * この3点がそろう画面なら、URL と項目を渡すだけで登録できる。
 *
 * **仕組み**
 * 登録画面を開いてから、画面の実フォームに値を入れて `new FormData(form)` を fetch で POST する。
 * 送信内容を手で組み立てないのは、画面が入れている既定値（環境ごとに違う UUID など）と
 * hidden 項目（`techno_csrf_token` 含む）を取りこぼさないため。
 *
 * **注意**
 * - `Content-Type` ヘッダーは指定しない。`FormData` の boundary はブラウザが毎回作るため、
 *   固定値を付けると本文と食い違って壊れる。
 * - 送信先はフォームの action（相対の `index.php`）のまま。環境ごとのサブパスはブラウザが解決する。
 * - 成功判定は `res.ok` ではなく `record=` の有無。保存に失敗しても 200 で登録画面が返るため。
 *
 * **用途**
 * 他テストの前提データをすばやく用意するためのもの。登録画面そのものの検証には使わない
 * （画面側の入力制御を通らないので、検証は UI 経由の Scenario で行う）。
 */

const { TIMEOUTS, BASE_URL, SELECTORS } = require('./constants');
const { extractRecordId } = require('./utils');

// 別の項目の onchange（AJAX）で作り直される選択肢を待つ上限
const OPTION_WAIT_MS = 10000;

/**
 * 登録画面を開き、フォームを送信して1件登録する。
 *
 * @param {object} I CodeceptJS の actor
 * @param {object} params
 * @param {string} [params.path] 登録画面の URL（BASE_URL からの相対。例: `index.php?module=ShimaCourse&action=EditView`）。
 *   省略すると画面を開き直さず、**今開いている画面**のフォームを送る。編集画面のように
 *   URL だけでは開けない（編集ボタンが CSRF トークン付きの GET で開く）画面は、
 *   ボタンで開いてから path を省略して呼ぶ（#236）。
 * @param {Object<string, (string|boolean)>} params.fields 入力する項目。キーは画面の name 属性。
 *   **書いた順に入力する**ので、画面で上の項目から順に書く（例: `area_id` → `school_id`）。
 *   - select: option の value でも表示テキストでも指定できる（例: `course_category: 'スクール'`）。
 *     入力後に change を発火させるので、画面の onchange もそのまま動く。選択肢が別の項目の
 *     onchange（AJAX）で作られる場合は、現れるまで最大 10 秒待つ。
 *   - checkbox: `true` でチェックする（例: `youbi_8: true`）。
 * @param {string} params.label ログ・エラーメッセージに出す画面名（例: 'コース登録'）
 * @param {string} [params.formName='EditView'] 送信するフォームの name 属性
 * @returns {Promise<{status: number, url: string, recordId: string}>} 応答と作成されたレコードの UUID
 * @throws {Error} フォームが見つからない・未知の項目名や選択肢が渡された・レコードが作成されなかった場合
 */
async function submitEditViewForm(I, { path, fields, label, formName = 'EditView' }) {
  if (path) I.amOnPage(BASE_URL + path);
  I.waitForElement(`form[name="${formName}"]`, TIMEOUTS.SCREEN);

  I.say(`【${label}】フォーム送信で登録（${Object.keys(fields).join(', ')}）`);
  const result = await I.executeScript(async ([name, values, errorSelector, optionWaitMs]) => {
    const form = document.forms[name];
    if (!form) return { error: `form[name="${name}"] が見つかりません` };

    // 保存ボタンの onclick と同じことをする（submittype=save を立てる）
    form.submittype.value = 'save';

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const findOption = (select, text) => Array.from(select.options).find((o) => o.value === text)
      || Array.from(select.options).find((o) => o.text.trim() === text);

    // 人が上から順に入力するのと同じ順番で1項目ずつ入れる。select は change を発火させるので、
    // 画面の onchange（エリア変更で店舗の選択肢を AJAX で作り直す等）もそのまま動く。
    const problems = [];
    for (const [key, value] of Object.entries(values)) {
      const el = form.elements[key];
      if (!el) {
        problems.push(`画面に存在しない項目名: ${key}`);
        continue;
      }
      if (el instanceof RadioNodeList) {
        // 同じ name の要素が複数ある（ラジオの組・hidden とチェックボックスの組など）。
        // どれに入れるべきか決められないので、黙って入れずに止める。
        problems.push(`${key} は同じ name の要素が複数あり未対応です`);
        continue;
      }
      if (el.tagName === 'SELECT') {
        // CSV やテストでは表示テキストで書くことが多いので、value → 表示テキストの順で探す。
        // 直前の項目の onchange で選択肢が作り直される途中のことがあるので、しばらく待つ。
        const text = String(value);
        let option = findOption(el, text);
        for (let waited = 0; !option && waited < optionWaitMs; waited += 200) {
          await sleep(200);
          option = findOption(form.elements[key], text);
        }
        if (!option) {
          problems.push(`${key} に選択肢「${text}」がありません（${optionWaitMs} ms 待っても現れず）`);
          continue;
        }
        const select = form.elements[key]; // AJAX で要素ごと差し替わっていても最新を使う
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        // onchange が jQuery で AJAX を出していれば返ってくるまで待つ。待たずに次へ進むと、
        // 後から返った応答が次の項目の選択肢を作り直し、入れた値が消えうる。
        // 画面の AJAX（ajax_AN_1）が jQuery 経由かは未確認なので、これは補助にすぎない。
        // 本当の守りは、上の「選択肢が現れるまで待つ」と下の「送信前の再確認」。
        for (let waited = 0; window.jQuery && window.jQuery.active > 0 && waited < optionWaitMs; waited += 100) {
          await sleep(100);
        }
        continue;
      }
      if (el.type === 'checkbox') {
        // チェックボックスは値ではなくチェックの有無を送る（value 属性が無ければ "on" が送られる）
        el.checked = value === true || ['true', '1', 'on'].includes(String(value));
        el.dispatchEvent(new Event('change', { bubbles: true })); // select と同じく onchange も動かす
        continue;
      }
      el.value = value;
    }
    // 送る直前に、入れた値が残っているかを確かめる（AJAX で項目が作り直されて消えていないか）
    if (!problems.length) {
      for (const [key, value] of Object.entries(values)) {
        const el = form.elements[key];
        if (!el || el instanceof RadioNodeList || el.type === 'checkbox') continue;
        const expected = el.tagName === 'SELECT'
          ? (findOption(el, String(value)) || {}).value
          : String(value);
        if (el.value !== expected) problems.push(`${key} の値が送信前に変わっています（入れた値=${value} / 現在=${el.value}）`);
      }
    }
    if (problems.length) return { error: problems.join(' / ') };

    let res;
    try {
      res = await fetch(form.getAttribute('action'), {
        method: 'POST',
        body: new FormData(form),
        credentials: 'same-origin',
        redirect: 'follow',
      });
    } catch (e) {
      // 通信自体が失敗した場合（ネットワーク断など）。ブラウザ内の例外をそのまま
      // 外に投げると "Evaluation failed" になって原因が読めないため、戻り値に寄せる。
      return { error: `送信に失敗しました: ${e && e.message ? e.message : e}` };
    }

    // 成功していれば詳細画面へリダイレクトされている。失敗時だけ別の画面の
    // HTML が返るので、そのときだけ理由を読みに行く。
    let errorText = '';
    if (!/[?&]record=/.test(res.url)) {
      try {
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const errorEl = doc.querySelector(errorSelector);
        errorText = (errorEl ? errorEl.textContent : '').trim().slice(0, 300);
        // バリデーションエラーはエラー枠に出るが、重複候補の確認画面のように
        // 枠を使わず本文だけで知らせてくる画面もあるため、空なら本文から拾う。
        if (!errorText && doc.body) {
          errorText = doc.body.textContent.replace(/\s+/g, ' ').trim().slice(0, 200);
        }
        // 本文も空なら（スクリプトで画面を移す応答など）、応答の HTML をそのまま少し見せる
        if (!errorText) errorText = `（本文なし）応答の先頭: ${html.replace(/\s+/g, ' ').trim().slice(0, 400)}`;
      } catch (e) {
        errorText = '';
      }
    }

    return { status: res.status, url: res.url, errorText };
  }, [formName, fields, SELECTORS.ERROR_CONTAINER, OPTION_WAIT_MS]);

  if (result.error) throw new Error(`【${label}】フォーム送信に失敗: ${result.error}`);

  // 成功すると詳細画面へリダイレクトされ、URL に record=<UUID> が入る。
  // 失敗時は登録画面が返るため recordId が取れない（status は 200 のまま）。
  const recordId = extractRecordId(result.url);
  if (!recordId) {
    throw new Error(
      `【${label}】レコードが作成されませんでした（status=${result.status}, url=${result.url}）`
      + (result.errorText ? `\nエラー表示: ${result.errorText}` : '')
    );
  }

  I.say(`【${label}】登録完了 record=${recordId}`);
  return { status: result.status, url: result.url, recordId };
}

/**
 * 詳細画面を開いている状態から、編集ボタン → フォーム送信で保存 → 保存後の詳細画面を開き直す（#239）。
 *
 * 編集画面は URL だけでは開けない（編集ボタンが CSRF トークン付きの GET で開く）ので、
 * ボタンだけは押す。入力と保存は `submitEditViewForm()` に任せる。フォーム送信はブラウザの
 * 画面を動かさないため、後続の操作のために保存後の詳細画面（応答の URL）を開いて返す。
 * 詳細画面が出そろったかの確認（見出しの待機・エラー表示の確認）は画面ごとに違うので呼び出し側で行う。
 *
 * @param {object} I CodeceptJS の actor
 * @param {object} params
 * @param {Object<string, (string|boolean)>} params.fields 入力する項目（`submitEditViewForm` と同じ）
 * @param {string} params.label ログ・エラーメッセージに出す画面名
 * @param {string} [params.editButton='input[name="edit_button"]'] 詳細画面の編集ボタン
 * @returns {Promise<{status: number, url: string, recordId: string}>} 応答と保存したレコードの UUID
 */
async function editOpenRecordBySubmit(I, { fields, label, editButton = 'input[name="edit_button"]' }) {
  I.say(`【${label}】詳細 → 編集（入力と保存はフォーム送信）`);
  I.click(editButton);
  const result = await submitEditViewForm(I, { fields, label });
  I.amOnPage(result.url);
  return result;
}

/**
 * 詳細画面の「削除」ボタンと同じ送信で、指定した1件を削除する（#232）。
 *
 * 詳細画面を開き、`delete_button_form` を `submittype=delete_focus` で送る。ボタンの onclick に
 * ある確認ダイアログはフォームを直接送るため出ない（ダイアログはブラウザ操作を止めてしまうため避ける）。
 * 画面のフォームが指すレコードが指定と違うときは送らずに止める（別レコードを消さないため）。
 * 消せるのは詳細画面に削除ボタンがある画面だけ（受講生は可。コース・クラスはボタンが無い #238）。
 *
 * @param {object} I CodeceptJS の actor
 * @param {object} params
 * @param {string} params.module 詳細画面の module（例: 'Student'）
 * @param {string} params.recordId 削除するレコードの UUID
 * @param {string} params.label ログ・エラーメッセージに出す名前
 * @returns {Promise<{status: number, url: string}>}
 * @throws {Error} 削除フォームが無い・画面のレコードが指定と違う場合
 */
async function submitDeleteForm(I, { module, recordId, label }) {
  I.say(`【削除】${label} (${module} record=${recordId})`);
  I.amOnPage(`${BASE_URL}index.php?module=${module}&action=DetailView&record=${recordId}`);
  I.waitForElement('form[name="DetailView"]', TIMEOUTS.SCREEN);

  const result = await I.executeScript(async (id) => {
    const form = document.forms.delete_button_form;
    if (!form) return { error: 'delete_button_form が見つかりません（この画面には削除ボタンが無い）' };
    if (form.record.value !== id) {
      return { error: `画面のレコードが一致しません（画面=${form.record.value} / 指定=${id}）` };
    }
    form.submittype.value = 'delete_focus';
    const params = new URLSearchParams(new FormData(form));
    try {
      const res = await fetch(`${form.getAttribute('action')}?${params.toString()}`, {
        credentials: 'same-origin',
        redirect: 'follow',
      });
      return { status: res.status, url: res.url };
    } catch (e) {
      return { error: `送信に失敗しました: ${e && e.message ? e.message : e}` };
    }
  }, recordId);

  if (result.error) throw new Error(`【削除】失敗 ${label} record=${recordId}: ${result.error}`);
  I.say(`【削除】完了 (status=${result.status})`);
  return result;
}

module.exports = {
  submitEditViewForm,
  editOpenRecordBySubmit,
  submitDeleteForm,
};
