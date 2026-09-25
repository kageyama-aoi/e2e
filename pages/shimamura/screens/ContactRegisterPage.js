'use strict';

const { I } = inject();
const { URLS, TIMEOUTS, BASE_URL, SELECTORS } = require('../../../support/shimamura/constants');
const { extractRecordId } = require('../../../support/shimamura/utils');

module.exports = {

  locators: {
    saveButton: 'input[name="save_button"]',
    editForm: 'EditView',
  },

  /**
   * 問合せ登録画面へ直接遷移します。
   */
  navigateToContactRegister() {
    I.say('【問合せ登録】URL 直遷移');
    I.amOnPage(BASE_URL + URLS.CONTACT_REGISTER);
    I.waitForElement(this.locators.saveButton, TIMEOUTS.SCREEN);
  },

  /**
   * 問合せ登録画面のフォームをそのまま送信して1件登録します（UI 操作を経由しない）。
   *
   * **何が作られるか**
   * **受講生**が1件できる（testgcp で確認）。ただしこれは検証用に開けてある近道の経路で、
   * 運用の正しい流れとは違う。運用では、年1回 DB に直接流し込まれた候補生
   * （受講生番号は別の基幹システムが発番・個人情報は基本空）を**候補生一覧で検索して
   * 受講生へ登録（昇格）する**。昇格のときに個人情報が入る。
   * つまりここで作られるのは「昇格を経ていない受講生」で、候補生は作れない。
   *
   * **用途**
   * 「受講生が1人いればよい」テストの前提データをすばやく用意するためのもの。
   * 昇格の手順や昇格で作られるデータに依存するテスト、候補生が必要なテストには使えない。
   * 登録画面そのものの検証にも使わない（検証は UI 経由の Scenario で行う）。
   *
   * **仕組み**
   * 登録画面を開いたうえで、画面に実在する `form[name="EditView"]` に値を入れ、
   * `new FormData(form)` を fetch で POST する。送信内容を手で組み立てないのは、
   * 画面が既定値を入れている項目（`favorite_school_id` は環境ごとに異なる UUID、
   * `favorite_area_id`・`bank_payment_type` 等）と hidden（`module` / `action=EW_AN` /
   * `techno_csrf_token`）を取りこぼさないため。
   *
   * **注意**
   * - `Content-Type` ヘッダーは指定しない。`FormData` の boundary はブラウザが毎回作るため、
   *   固定値を付けると本文と食い違って壊れる。
   * - URL は相対（フォームの action = `index.php`）のまま送る。環境ごとのサブパスは
   *   ブラウザが解決するので、ホスト名を書かない。
   * - URL の `contact_status=5` は送信内容に含まれない（候補生を作る手段ではない）。
   *   既定値と hidden を画面から拾うため、必ず登録画面を開いた状態から送る。
   *
   * @param {Object<string, string>} fields 入力する項目（キーは画面の name 属性。例: `{last_name: '山田'}`）
   * @returns {Promise<{status: number, url: string, recordId: string}>} 応答と作成されたレコードの UUID
   * @throws {Error} フォームが見つからない・未知の項目名が渡された・レコードが作成されなかった場合
   */
  async createContactViaApi(fields) {
    this.navigateToContactRegister();

    I.say(`【問合せ登録】フォーム送信で登録（${Object.keys(fields).join(', ')}）`);
    const result = await I.executeScript(async ([formName, values, errorSelector]) => {
      const form = document.forms[formName];
      if (!form) return { error: `form[name="${formName}"] が見つかりません` };

      // 保存ボタンの onclick と同じことをする（submittype=save を立てる）
      form.submittype.value = 'save';

      const unknown = [];
      Object.entries(values).forEach(([name, value]) => {
        const el = form.elements[name];
        if (el) el.value = value;
        else unknown.push(name);
      });
      if (unknown.length) return { error: `画面に存在しない項目名: ${unknown.join(', ')}` };

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
          const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
          const errorEl = doc.querySelector(errorSelector);
          errorText = (errorEl ? errorEl.textContent : '').trim().slice(0, 300);
          // バリデーションエラーはエラー枠に出るが、重複候補の確認画面のように
          // 枠を使わず本文だけで知らせてくる画面もあるため、空なら本文から拾う。
          if (!errorText && doc.body) {
            errorText = doc.body.textContent.replace(/\s+/g, ' ').trim().slice(0, 200);
          }
        } catch (e) {
          errorText = '';
        }
      }

      return { status: res.status, url: res.url, errorText };
    }, [this.locators.editForm, fields, SELECTORS.ERROR_CONTAINER]);

    if (result.error) throw new Error(`【問合せ登録】フォーム送信に失敗: ${result.error}`);

    // 成功すると詳細画面へリダイレクトされ、URL に record=<UUID> が入る。
    // 失敗時は登録画面が返るため recordId が取れない（status は 200 のまま）。
    const recordId = extractRecordId(result.url);
    if (!recordId) {
      throw new Error(
        `【問合せ登録】レコードが作成されませんでした（status=${result.status}, url=${result.url}）`
        + (result.errorText ? `\nエラー表示: ${result.errorText}` : '')
      );
    }

    I.say(`【問合せ登録】登録完了 record=${recordId}`);
    return { status: result.status, url: result.url, recordId };
  },

};
