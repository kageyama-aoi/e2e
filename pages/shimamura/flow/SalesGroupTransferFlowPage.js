'use strict';

/**
 * 料金明細の入金不具合（#279）を再現するテストデータを作る FlowPage（#280）
 *
 * 作るもの: 同じ明細番号（salesno）に入出金が2行以上あり、**1行目だけ入金済み**の明細。
 * 1行目の支払方法は、入出金の編集画面（裏技）で現金以外（カード等）に変えられる。
 *
 * 流れ:
 * 1. 問合せ登録のフォーム送信で受講生を作る（請求方法=現金。候補生は消費しない）
 * 2. 経理ビューでクラス（分類「スクール」）を適用して確定 → 月謝と運営管理費が同じ明細番号でできる
 * 3. 経理ビューA の入出金一覧から、2行以上ある明細番号を選ぶ
 * 4. 料金明細 編集画面で1行目だけ入金して保存（この画面の支払方法は現金だけ）
 * 5. 入出金の詳細 → 編集（`Transaction/EW_AN`）で1行目の支払方法を変える（任意）
 *
 * 入出金の編集画面は経理ビューA の契約日リンクの先（`Transaction/DW_AN`）から開く。
 * 支払方法はカードを含む全種類が選べる（2026-10-01 確認）。
 */

const { I } = inject();
const { TIMEOUTS, BASE_URL, SELECTORS } = require('../../../support/shimamura/constants');
const { assertNoShimamuraError, buildTestName } = require('../../../support/shimamura/utils');
const { editOpenRecordBySubmit } = require('../../../support/shimamura/editViewSubmit');
const {
  navigateToKeirisyoriView,
  openKeirisyoriScreenA,
  fillKeirisyoriScreenB,
  confirmKeirisyoriScreenE,
} = require('./SyokaiFlowPage');

/** テスト受講生の姓（掃除のときに検索する頭の部分） */
const TEST_LAST_NAME = '明細入金';

/**
 * 問合せ登録のフォーム送信で受講生を1人作る（請求方法=現金）。
 * 同姓同名は二重登録の確認画面で保存されないため、名に実行時刻を入れる。
 * @param {object} contactRegisterPageShimamura
 * @returns {Promise<{contactId: string, lastName: string}>} contactId は受講生番号（経理ビューの record にそのまま使える）
 */
async function createStudent(contactRegisterPageShimamura) {
  const hhmmss = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
  const name = buildTestName(TEST_LAST_NAME, { testNo: hhmmss, scenario: '' });
  const result = await contactRegisterPageShimamura.createContactBySubmit({
    last_name:           name.lastName,
    first_name:          name.firstName,
    last_name_furigana:  'めいさいにゅうきん',
    first_name_furigana: 'てすと',
    bank_payment_type:   '3',
    description:         name.description,
  });
  return { contactId: result.recordId, lastName: name.lastName };
}

/**
 * 経理ビューでクラスを適用して確定する（画面A → B → E）。
 * @param {object} classMemberPageShimamura
 * @param {string} contactId 受講生番号
 * @param {{className: string, courseCategory: string, keiyakuDate: string, kaishiDate: string}} cls
 */
async function enrollClass(classMemberPageShimamura, contactId, { className, courseCategory, keiyakuDate, kaishiDate }) {
  I.say(`【明細データ】クラス適用 ${className}（${courseCategory}）契約日=${keiyakuDate}`);
  // フォーム送信で作った直後は受講生詳細を開いていないので、経理ビューを URL で開いてから A → B に進む
  await navigateToKeirisyoriView(I, classMemberPageShimamura, { recordId: contactId });
  await openKeirisyoriScreenA(I, classMemberPageShimamura, { skipNav: true });
  await fillKeirisyoriScreenB(I, {
    class_name01: className, course_category: courseCategory, keiyaku_date: keiyakuDate, kaishi_date: kaishiDate,
  });
  await confirmKeirisyoriScreenE(I);
  await assertNoShimamuraError(I, '経理ビュー確定後');
}

/**
 * 経理ビューA の入出金一覧を読む（契約日リンク＝入出金の詳細、明細番号リンクを持つ行）。
 * @param {string} contactId 受講生番号
 * @returns {Promise<Array<{transactionId: string, feeName: string, salesno: string, dueDate: string, inAmount: string, tDate: string, actualInAmount: string, paymentLabel: string}>>}
 */
async function grabTransactionRows(contactId) {
  I.amOnPage(`${BASE_URL}index.php?module=Student&action=CarteView&return_module=Student&return_action=CarteView`
    + `&layout_def_key=carte&carte_view=2&record=${encodeURIComponent(contactId)}`);
  I.waitForElement(locate('body').withText('クラス追加/更新する'), TIMEOUTS.SCREEN);
  return I.executeScript((linkClass) => {
    const rows = [];
    document.querySelectorAll(`a.${linkClass}[href*="module=Transaction&action=DW_AN&record="]`).forEach((a) => {
      const tr = a.closest('tr');
      const salesLink = tr && tr.querySelector('a[href*="module=SalesGroup&action=DetailView&record="]');
      if (!salesLink) return;
      const cells = [...tr.querySelectorAll('td')].map((td) => td.innerText.trim());
      // 列: 契約日 / 料金名 / 明細番号 / 締切日 / 入金予定額 / 入出金日 / 入金額 / 入金方法 / …
      rows.push({
        transactionId: new URL(a.href).searchParams.get('record'),
        feeName: cells[1],
        salesno: new URL(salesLink.href).searchParams.get('record'),
        dueDate: cells[3],
        inAmount: cells[4],
        tDate: cells[5],
        actualInAmount: cells[6],
        paymentLabel: cells[7],
      });
    });
    return rows;
  }, SELECTORS.RESULT_LINK.replace(/^\./, ''));
}

/**
 * 入出金の行を明細番号でまとめ、行が2行以上ある明細番号を返す（最初に見つかったもの）。
 * @param {Array<{salesno: string}>} rows
 * @returns {(string|null)}
 */
function pickMultiRowSalesno(rows) {
  const counts = new Map();
  rows.forEach((r) => counts.set(r.salesno, (counts.get(r.salesno) || 0) + 1));
  for (const [salesno, n] of counts) if (n >= 2) return salesno;
  return null;
}

/**
 * 料金明細 編集画面で1行目だけ入金して保存する（支払方法=現金）。
 * @param {object} salesGroupTransferPageShimamura
 * @param {{salesno: string, contactId: string, tDate: string}} params
 * @returns {Promise<{paidTransactionId: string, paidFeeName: string}>}
 */
async function payFirstRow(salesGroupTransferPageShimamura, { salesno, contactId, tDate }) {
  const page = salesGroupTransferPageShimamura;
  await page.openTransferEdit({ salesno, contactId });
  const state = await page.grabScreenState();
  if (state.rows.length < 2) throw new Error(`明細 ${salesno} の行が2行未満です（${state.rows.length}行）`);
  const first = state.rows[0];
  const db = state.initial[0];
  if (Number(String(db.actual_in_amount || 0).replace(/,/g, '')) !== 0 || db.t_date) {
    throw new Error(`明細 ${salesno} の1行目がすでに入金済みです（${db.fee_name}）`);
  }
  I.say(`【明細データ】1行目を入金 ${db.fee_name} ${db.in_amount}円 入金日=${tDate}`);
  await page.fillRowPayment(first.index, { tDate, actualInAmount: String(db.in_amount), paymentType: 'cash' });
  const result = await page.clickSaveAndGrabResult();
  if (!result.saved) {
    throw new Error(`1行目の入金を保存できませんでした: ${result.messages.join(' / ') || result.alerts.join(' / ') || result.url}`);
  }
  return { paidTransactionId: db.id, paidFeeName: db.fee_name };
}

/**
 * 入出金の詳細 → 編集（裏技）で支払方法を変える。
 * @param {{transactionId: string, paymentType: string}} params paymentType は option の value（例: `card`）
 */
async function changeTransactionPaymentType({ transactionId, paymentType }) {
  I.say(`【明細データ】入出金 ${transactionId} の支払方法を ${paymentType} に変更（入出金の編集画面）`);
  I.amOnPage(`${BASE_URL}index.php?module=Transaction&action=DW_AN&record=${encodeURIComponent(transactionId)}`);
  I.waitForElement('input[name="edit_button"]', TIMEOUTS.SCREEN);
  await editOpenRecordBySubmit(I, { fields: { payment_type: paymentType }, label: '入出金の編集' });
}

module.exports = {
  TEST_LAST_NAME,
  createStudent,
  enrollClass,
  grabTransactionRows,
  pickMultiRowSalesno,
  payFirstRow,
  changeTransactionPaymentType,
};
