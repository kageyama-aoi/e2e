'use strict';

/**
 * 料金明細の入金不具合（#279）を再現するテストデータを作る FlowPage（#280）
 *
 * 作るもの: 同じ明細番号（salesno）に入出金が2行以上あり、**1行目だけ入金済み**の明細。
 * `createStatement` で、1行だけの明細・入金していない明細も作れる（#296）。
 * 1行目の支払方法は、入出金の編集画面（裏技）で現金以外（カード等）に変えられる。
 *
 * 流れ:
 * 1. 問合せ登録のフォーム送信で受講生を作る（請求方法=現金。候補生は消費しない）
 * 2. 経理ビューでクラス（分類「スクール」）を適用して確定 → 月謝と運営管理費が同じ明細番号でできる
 *    （既定はフォーム送信版 `enrollClassBySubmit`。UI 版も選べる）
 * 3. 経理ビューA の入出金一覧から、2行以上ある明細番号を選ぶ
 *    （1行の明細にするときは、料金タブの「削除」で余分な料金を消す。入出金の行も一緒に消える）
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
  enrollClassBySubmit,
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
 * 既定はフォーム送信版（`enrollClassBySubmit`。画面操作なしで同じ通信を出す）。
 * `bySubmit: false` なら従来の UI 操作（クラス選択ポップアップ → クラス適用 → コース料金設定 → 売上計上 → 確認完了）。
 * @param {object} classMemberPageShimamura
 * @param {string} contactId 受講生の record
 * @param {{className: string, courseCategory: string, keiyakuDate: string, kaishiDate: string, bySubmit: (boolean|undefined)}} cls
 */
async function enrollClass(classMemberPageShimamura, contactId, { className, courseCategory, keiyakuDate, kaishiDate, bySubmit = true }) {
  if (bySubmit) {
    await enrollClassBySubmit(I, { recordId: contactId, className, courseCategory, keiyakuDate, kaishiDate });
    return;
  }
  I.say(`【明細データ】クラス適用（UI）${className}（${courseCategory}）契約日=${keiyakuDate}`);
  const startedAt = Date.now();
  // フォーム送信で作った直後は受講生詳細を開いていないので、経理ビューを URL で開いてから A → B に進む
  await navigateToKeirisyoriView(I, classMemberPageShimamura, { recordId: contactId });
  await openKeirisyoriScreenA(I, classMemberPageShimamura, { skipNav: true });
  await fillKeirisyoriScreenB(I, {
    class_name01: className, course_category: courseCategory, keiyaku_date: keiyakuDate, kaishi_date: kaishiDate,
  });
  await confirmKeirisyoriScreenE(I);
  await assertNoShimamuraError(I, '経理ビュー確定後');
  I.say(`【明細データ】クラス適用（UI）完了（${Date.now() - startedAt} ms）`);
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
 * 経理ビューA の料金タブで、指定した明細番号の料金を1件だけ残して削除する（1行だけの明細を作る）。
 * 料金を削除すると、ひもづく入出金の行も一緒に消える（2026-10-14 確認）。未入金のうちに行うこと。
 * 削除リンクは確認ダイアログ（confirm）を出すので、画面の confirm を常に OK にしてから押す。
 * @param {string} contactId 受講生番号
 * @param {string} salesno 明細番号
 * @param {string} keepFeeName 残す料金名（例: 月謝（10月））
 */
async function deleteFeesExcept(contactId, salesno, keepFeeName) {
  const rows = await grabTransactionRows(contactId);
  const targets = rows.filter((r) => r.salesno === salesno && r.feeName !== keepFeeName).map((r) => r.feeName);
  for (const feeName of targets) {
    I.say(`【明細データ】料金を削除 ${feeName}（明細番号=${salesno}）`);
    const clicked = await I.executeScript(({ fee, no }) => {
      const link = [...document.querySelectorAll('a[href*="module=Fee"][href*="submittype=delete"]')]
        .find((a) => {
          const cells = [...a.closest('tr').querySelectorAll('td')].map((td) => td.innerText.trim());
          return cells.includes(fee) && cells.includes(no);
        });
      if (!link) return false;
      window.confirm = () => true;
      link.click();
      return true;
    }, { fee: feeName, no: salesno });
    if (!clicked) throw new Error(`料金タブに削除リンクが見つかりません: ${feeName}（明細番号=${salesno}）`);
    // 料金タブ・入出金タブは ajax で描き直される。入出金の行が消えるまで待つ
    I.waitForFunction((fee) => ![...document.querySelectorAll('a[href*="module=Transaction&action=DW_AN"]')]
      .some((a) => a.closest('tr').innerText.includes(fee)), [feeName], TIMEOUTS.ELEMENT);
  }
  const left = (await grabTransactionRows(contactId)).filter((r) => r.salesno === salesno);
  if (left.length !== 1) throw new Error(`明細 ${salesno} を1行にできませんでした（${left.length}行）`);
}

/**
 * 料金明細 編集画面で1行目だけ入金して保存する（支払方法=現金）。
 * @param {object} salesGroupTransferPageShimamura
 * @param {{salesno: string, contactId: string, tDate: string, minRows: (number|undefined)}} params
 *   minRows: 明細に最低限あるはずの行数（既定 2。1行の明細なら 1）
 * @returns {Promise<{paidTransactionId: string, paidFeeName: string}>}
 */
async function payFirstRow(salesGroupTransferPageShimamura, { salesno, contactId, tDate, minRows = 2 }) {
  const page = salesGroupTransferPageShimamura;
  await page.openTransferEdit({ salesno, contactId });
  const state = await page.grabScreenState();
  if (state.rows.length < minRows) throw new Error(`明細 ${salesno} の行が${minRows}行未満です（${state.rows.length}行）`);
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

/** 分類「スクール」でコースが紐づいたクラス（月謝一括作成準備と同じ。月謝＋運営管理費ができる） */
const DEFAULT_CLASS = { className: 'ピアノ水曜日_02', courseCategory: 'スクール' };

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 1〜5 をまとめて行い、テスト用の明細を1つ作る（受講生を1人使う）。
 * - rowCount: 1 なら、入金する前に料金タブで余分な料金を削除して1行の明細にする（`deleteFeesExcept`）。省略時は4行のまま
 * - firstRowPayment: 1行目を入金済みにするときの支払方法（cash 以外は入出金の編集画面で変える）。null なら入金しない
 * @param {{contactRegisterPageShimamura: Object, classMemberPageShimamura: Object, salesGroupTransferPageShimamura: Object}} pages
 * @param {{rowCount: (number|undefined), firstRowPayment: (string|null|undefined), bySubmit: (boolean|undefined), cls: (Object|undefined)}} [options]
 * @returns {Promise<{contactId: string, lastName: string, salesno: string, paidTransactionId: (string|null), paidFeeName: (string|null), rows: Array<Object>}>}
 */
async function createStatement(pages, { rowCount, firstRowPayment = 'cash', bySubmit = true, cls = DEFAULT_CLASS } = {}) {
  const date = todayYmd();
  const { contactId, lastName } = await createStudent(pages.contactRegisterPageShimamura);
  I.say(`【明細データ】受講生 ${lastName} 受講生番号=${contactId}`);
  await enrollClass(pages.classMemberPageShimamura, contactId, { ...cls, keiyakuDate: date, kaishiDate: date, bySubmit });

  let rows = await grabTransactionRows(contactId);
  rows.forEach((r) => I.say(`  入出金: ${r.salesno} ${r.feeName} 予定=${r.inAmount} 入金日=${r.tDate} 方法=${r.paymentLabel}`));
  const salesno = pickMultiRowSalesno(rows);
  if (!salesno) throw new Error(`同じ明細番号の行が2行以上ありません（クラスにコースが紐づいているか確認）: ${rows.length}行`);
  I.say(`【明細データ】対象の明細番号=${salesno}`);

  if (rowCount === 1) {
    const keep = rows.find((r) => r.salesno === salesno).feeName;
    await deleteFeesExcept(contactId, salesno, keep);
    rows = rows.filter((r) => r.salesno !== salesno || r.feeName === keep);
  }

  if (!firstRowPayment) return { contactId, lastName, salesno, paidTransactionId: null, paidFeeName: null, rows };
  const { paidTransactionId, paidFeeName } = await payFirstRow(pages.salesGroupTransferPageShimamura, {
    salesno, contactId, tDate: date, minRows: rowCount === 1 ? 1 : 2,
  });
  if (firstRowPayment !== 'cash') {
    await changeTransactionPaymentType({ transactionId: paidTransactionId, paymentType: firstRowPayment });
  }
  return { contactId, lastName, salesno, paidTransactionId, paidFeeName, rows };
}

/**
 * 「同じ明細番号に2行以上・1行目だけ入金済み」の明細を1つ作る（`createStatement` の4行・入金済み版）。
 * @param {{contactRegisterPageShimamura: Object, classMemberPageShimamura: Object, salesGroupTransferPageShimamura: Object}} pages
 * @param {{firstRowPayment: (string|undefined), bySubmit: (boolean|undefined), cls: (Object|undefined)}} [options]
 *   firstRowPayment: 1行目の支払方法（既定 cash。cash 以外は入出金の編集画面で変える）
 * @returns {Promise<{contactId: string, lastName: string, salesno: string, paidTransactionId: string, paidFeeName: string, rows: Array<Object>}>}
 */
function createPaidFirstRowStatement(pages, { firstRowPayment = 'cash', bySubmit = true, cls = DEFAULT_CLASS } = {}) {
  return createStatement(pages, { firstRowPayment, bySubmit, cls });
}

module.exports = {
  TEST_LAST_NAME,
  DEFAULT_CLASS,
  createStatement,
  createPaidFirstRowStatement,
  createStudent,
  enrollClass,
  grabTransactionRows,
  pickMultiRowSalesno,
  payFirstRow,
  deleteFeesExcept,
  changeTransactionPaymentType,
};
