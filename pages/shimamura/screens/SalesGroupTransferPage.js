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
 * **このPOでできないこと**
 * 保存はしない（データを変えない下準備 #279）。送信 JSON は `prepareForm()` を呼んで
 * hidden に入る値を読むだけで、フォームは送らない。
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
    firstRowTDate: '#t_date_0',
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
