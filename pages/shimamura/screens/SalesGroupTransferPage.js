'use strict';

const { I } = inject();
const { TIMEOUTS, BASE_URL } = require('../../../support/shimamura/constants');

/**
 * 料金明細 編集画面（入金入力モード）
 * `index.php?module=SalesGroup&action=EditView&transfer=1`
 *
 * 経理ビュー個人の明細番号リンクから遷移する画面。同じ明細番号（salesno）を持つ入出金
 * （sms_transaction）が1行ずつ並び、上段の入金日・入金額・手数料・支払方法を
 * 「入金分配」（DivideTransfer）で各行に配って保存する。
 *
 * **行の作り**
 * 行はページ読み込み後に JS（addSale）が `transaction_array` から作る。入力欄の id は
 * `t_date_0`, `actual_in_amount_1` のような「項目名_連番」。`sales_arr[i].t_date` には
 * 値ではなく入力欄（DOM 要素）が入っていて、保存時の送信 JSON（hidden `sales_details`）は
 * 保存の瞬間に各欄の `.value` を読み直して作る（GetAllSalesDetails）。
 * 例外として締日（`transaction_array.shimebi`）より前に入金された行は文字表示だけになり、
 * `sales_arr` には DB の値（文字列）がそのまま入る。
 *
 * **保存について**
 * 観察用のメソッド（`grabSaveRequestPreview` 等）は保存しない。送信 JSON は `prepareForm()` を呼んで
 * hidden に入る値を読むだけで、フォームは送らない（#279）。
 * 保存するのは `clickSaveAndGrabResult()` だけで、テストデータを作るとき（未入金の行を入金する #280）
 * と、保存した結果のエラーを確かめるときに使う。
 */
module.exports = {

  locators: {
    form: 'form[name="EditView"]',
    topTDate: 'input[name="top_t_date"]',
    topInAmount: 'input[name="top_in_amount"]',
    topCommission: 'input[name="top_commission"]',
    topPaymentType: 'select[name="top_payment_type"]',
    copyBalanceButton: 'input[onclick^="CopyBalance"]',
    divideTransferButton: 'input[onclick^="DivideTransfer"]',
    saveButton: 'input[type="submit"][title="保存"]',
    firstRowTDate: '#t_date_0',
    messages: ['#top_err_info_msg_div', '#top_message_dialog_div_id'],
  },

  /**
   * 明細番号を指定して料金明細 編集画面（入金入力モード）を URL 直指定で開きます。
   * 画面の `alert()` は記録用に差し替える（分配・再計算で出る警告文を後から読めるように）。
   *
   * `simulateShimebi`（YYYY-MM-DD）を渡すと、画面の応答 HTML に埋め込まれた締日
   * （`transaction_array.shimebi`）だけをブラウザ側で書き換えてから描画させる。締日の設定が無い
   * 環境（testgcp は 2001-01-01）で「締日より前に入金された行＝文字表示だけの行」を作って観察するための
   * 模擬で、サーバーの設定やデータは変わらない。保存すると本物の締日で判定されるので、模擬中は保存しないこと。
   *
   * @param {{salesno: string, contactId: string, simulateShimebi: (string|undefined)}} target
   *   明細番号（record）・受講生番号（salesno_contactid）・模擬する締日
   */
  async openTransferEdit({ salesno, contactId, simulateShimebi }) {
    if (!salesno || !contactId) throw new Error('openTransferEdit: salesno と contactId は必須です');
    I.say(`【料金明細】編集画面（入金）を開く 明細番号=${salesno}`);
    if (simulateShimebi) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(simulateShimebi)) throw new Error(`simulateShimebi は YYYY-MM-DD: ${simulateShimebi}`);
      I.say(`【料金明細】締日を ${simulateShimebi} に模擬（ブラウザ側の書き換えのみ）`);
      await I.usePlaywrightTo('締日の模擬', async ({ page }) => {
        await page.route(/module=SalesGroup&action=EditView/, async (route) => {
          const response = await route.fetch();
          const body = (await response.text())
            .replace(/"shimebi":"[^"]*"/, `"shimebi":"${simulateShimebi}"`);
          await route.fulfill({ response, body });
        });
      });
    }
    I.amOnPage(BASE_URL + 'index.php?module=SalesGroup&action=EditView'
      + `&record=${encodeURIComponent(salesno)}&return_module=SalesGroup&return_action=DetailView`
      + `&transfer=1&return_id=${encodeURIComponent(salesno)}`
      + `&salesno_contactid=${encodeURIComponent(contactId)}&isDuplicate=0&submittype=`);
    I.waitForElement(this.locators.divideTransferButton, TIMEOUTS.ELEMENT);
    if (simulateShimebi) {
      await I.usePlaywrightTo('締日の模擬を解除', async ({ page }) => { await page.unroute(/module=SalesGroup&action=EditView/); });
    }
    await I.executeScript(() => {
      window.__e2eAlerts = [];
      window.alert = (msg) => { window.__e2eAlerts.push(String(msg)); };
    });
  },

  /**
   * 画面の状態をまとめて読みます（読み取りのみ）。
   * - `initial`: サーバーが渡した DB の値（`transaction_array.transactions`）
   * - `rows`: いま画面にある各行の値。入力欄の行は `.value`、締日前の文字表示行は DB の値
   * - `top`: 上段（合計欄・入力欄）の値
   * - `alerts`: 開いてから出た alert の文言
   *
   * @returns {Promise<{shimebi: string, initial: Array<Object>, rows: Array<Object>, top: Object, alerts: Array<string>}>}
   */
  async grabScreenState() {
    return I.executeScript(() => {
      /* global sales_arr, item_attributes, transaction_array */
      const f = document.EditView;
      const rows = sales_arr.map((sale, index) => {
        const row = { index, editable: typeof sale.t_date === 'object' };
        Object.keys(item_attributes).forEach((key) => {
          const v = sale[key];
          row[key] = (v && typeof v === 'object') ? v.value : (v == null ? '' : String(v));
        });
        return row;
      });
      const top = {};
      ['top_total_in_amount', 'top_total_actual_in_amount', 'top_total_commission', 'top_total_balance',
        'top_t_date', 'top_in_amount', 'top_commission', 'top_payment_type']
        .forEach((name) => { top[name] = f[name] ? f[name].value : null; });
      const initial = (transaction_array.transactions || []).map((t) => ({
        id: t.id, fee_name: t.fee_name, due_date: t.due_date, t_date: t.t_date,
        in_amount: t.in_amount, actual_in_amount: t.actual_in_amount, commission: t.commission,
        payment_type: t.payment_type, pos_status: t.pos_status, access_token_set: !!t.access_token,
      }));
      return {
        shimebi: transaction_array.shimebi,
        initial,
        rows,
        top,
        alerts: (window.__e2eAlerts || []).slice(),
      };
    });
  },

  /**
   * 上段の入力欄を埋めます。渡さなかった項目は触らない。
   * @param {{tDate: (string|undefined), inAmount: (string|undefined), commission: (string|undefined), paymentType: (string|undefined)}} values
   *   paymentType は option の value（例: `cash`）
   */
  fillTopInput({ tDate, inAmount, commission, paymentType }) {
    if (tDate !== undefined) I.fillField(this.locators.topTDate, tDate);
    if (inAmount !== undefined) I.fillField(this.locators.topInAmount, inAmount);
    if (commission !== undefined) I.fillField(this.locators.topCommission, commission);
    if (paymentType !== undefined) I.selectOption(this.locators.topPaymentType, paymentType);
  },

  /**
   * 1行分の入金欄（入金日・入金額・支払方法）を埋めます。渡さなかった項目は触らない。
   * 行の支払方法の select には name/id が無いため、`sales_arr[index].payment_type` から操作する。
   * 入力後に画面の再計算（バランス・合計）を走らせる。
   *
   * @param {number} index 行番号（0 始まり。`grabScreenState().rows[i].index`）
   * @param {{tDate: (string|undefined), actualInAmount: (string|undefined), paymentType: (string|undefined)}} values
   *   paymentType は option の value（この画面の選択肢は `cash` と空だけ）
   */
  async fillRowPayment(index, { tDate, actualInAmount, paymentType }) {
    await I.executeScript(([i, v]) => {
      /* global sales_arr, RecalculateGrandTotal */
      const sale = sales_arr[i];
      if (!sale || typeof sale.t_date !== 'object') throw new Error(`入力欄のある行ではありません: ${i}`);
      if (v.tDate !== null) sale.t_date.value = v.tDate;
      if (v.actualInAmount !== null) sale.actual_in_amount.value = v.actualInAmount;
      if (v.paymentType !== null) {
        if (![...sale.payment_type.options].some((o) => o.value === v.paymentType)) {
          throw new Error(`支払方法の選択肢にありません: ${v.paymentType}`);
        }
        sale.payment_type.value = v.paymentType;
      }
      RecalculateGrandTotal();
    }, [index, {
      tDate: tDate === undefined ? null : tDate,
      actualInAmount: actualInAmount === undefined ? null : actualInAmount,
      paymentType: paymentType === undefined ? null : paymentType,
    }]);
  },

  /**
   * 保存ボタンを押し、保存後の画面と表示されたメッセージを返します（**データが変わる**）。
   * 成功すると料金明細の詳細画面（`action=DetailView`）へ移る。サーバーのチェックに当たると
   * 編集画面に戻り、画面上部にメッセージが出る（#279 の仕様書 ④）。
   * 画面側のチェック（入金日の未入力など）で止まった場合は alert の文言が `alerts` に入り、画面は移らない。
   *
   * @returns {Promise<{saved: boolean, url: string, messages: Array<string>, alerts: Array<string>}>}
   */
  async clickSaveAndGrabResult() {
    const beforeUrl = await I.grabCurrentUrl();
    I.click(this.locators.saveButton);
    I.wait(TIMEOUTS.TAB_SWITCH);
    I.waitForElement('body', TIMEOUTS.SCREEN);
    const url = await I.grabCurrentUrl();
    const { messages, alerts } = await I.executeScript((selectors) => ({
      messages: selectors
        .map((s) => document.querySelector(s))
        .filter(Boolean)
        .map((el) => el.innerText.replace(/\s+/g, ' ').trim())
        .filter(Boolean),
      alerts: (window.__e2eAlerts || []).slice(),
    }), this.locators.messages);
    const saved = /action=DetailView/.test(url) && messages.length === 0;
    I.say(`【料金明細】保存 ${saved ? '成功' : '失敗または未送信'} url変化=${beforeUrl !== url} メッセージ=${messages.join(' / ') || 'なし'}`);
    return { saved, url, messages, alerts };
  },

  /** 「バランスを入力」: 上段の入金額に合計バランスを写す（バランスが 0 以下なら何もしない画面仕様） */
  clickCopyBalance() {
    I.click(this.locators.copyBalanceButton);
  },

  /** 「入金分配」: 上段の入金額・手数料を各行に配る（DivideTransfer） */
  clickDivideTransfer() {
    I.click(this.locators.divideTransferButton);
  },

  /**
   * 保存ボタンを押したときに送られるはずの内容を、送信せずに作って読みます。
   * 保存ボタンの onclick（`OnClickSave()`）と同じ順で
   * 1. `CheckForBlankFields()`（入金日の未入力・形式チェック。flag 1=形式不正 / 2=未入力 / 3=両方）
   * 2. `prepareForm()`（hidden `sales_details` に JSON を入れる）
   * を呼ぶ。1 が例外になった場合、実際の保存では 2 が走らないまま送信されうるので、
   * その場合も `checkError` に記録したうえで 2 を呼んで中身を見せる。
   *
   * 画面側の `JSON` は include/JSON.js で差し替えられているため、ここでは文字列のまま返し、
   * パースは Node 側で行う。
   *
   * @returns {Promise<{checkFlag: (number|null), checkError: (string|null), salesDetailsRaw: string, salesDetails: (Object|null), parseError: (string|null)}>}
   */
  async grabSaveRequestPreview() {
    const result = await I.executeScript(() => {
      /* global CheckForBlankFields, prepareForm */
      let checkFlag = null;
      let checkError = null;
      try {
        checkFlag = CheckForBlankFields();
      } catch (e) {
        checkError = String(e && e.message ? e.message : e);
      }
      prepareForm();
      return { checkFlag, checkError, salesDetailsRaw: document.EditView.sales_details.value };
    });
    let salesDetails = null;
    let parseError = null;
    try {
      salesDetails = JSON.parse(result.salesDetailsRaw);
    } catch (e) {
      parseError = e.message;
    }
    return { ...result, salesDetails, parseError };
  },

};
