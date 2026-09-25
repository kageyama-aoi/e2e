'use strict';

/**
 * shimamura 受講生編集（請求方法設定）のフォーム送信版 editStudentPaymentBySubmit 動作確認ランナー #236
 *
 * このファイルは通常のテストスイートには含まれない（`_test.js` 非末尾）。
 * 月謝一括作成準備（gessya_ikkatu_setup_test.js）の受講生編集を、**候補生を消費せずに**確かめる。
 * 候補生は年1回補充の限られた在庫なので、昇格の代わりに問合せ登録で使い捨ての受講生を作り、
 * その受講生を編集する。実行すると testgcp に受講生が1件増える。
 * 後始末は list_api_test_contacts.js で UUID を確認し、delete_listed_test_records.js で行う。
 *
 * 実行例:
 *   npx codeceptjs run ./tests/shimamura/util/edit_student_payment_by_submit_check.js --profile shimamura.testgcp
 *
 * 確認すること:
 * - 編集画面を開き直したとき、請求方法・収納業者・社割・メモが送った値になっていること
 * - 編集〜保存〜受講生詳細の表示までの所要時間（ログの ms を控える）
 */

const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { buildTestName } = require('../../../support/shimamura/utils');
const { TIMEOUTS } = require('../../../support/shimamura/constants');
const { editStudentPaymentBySubmit } = require('../../../pages/shimamura/flow/GessyaIkkatuFlowPage');

Feature('shimamura 受講生編集（請求方法設定）のフォーム送信（動作確認）');

Before(beforeShimamura);

Scenario('使い捨ての受講生の請求方法をフォーム送信で書き換え、保存内容を確かめる', async ({ I, contactRegisterPageShimamura }) => {
  // 姓「API登録MMDD」は list_api_test_contacts.js の検索対象（後始末用）。名は実行時刻で一意にする。
  const hhmmss = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
  const name = buildTestName('API登録', { testNo: hhmmss, scenario: '' });

  // 1. 使い捨ての受講生を作る（請求方法 3=現金）。
  //    銀行情報も持たせているが、問合せ登録で直接作った受講生は、これがあっても 1=銀行引落 に
  //    変えると「銀行情報を入力してください」で保存できない（UI 操作でも同じ。2026-09-25 確認）。
  //    【銀行情報】は9項目（口座種別・引落開始充当年月・収納業者・金融機関コード/名・支店コード/名・
  //    口座番号・口座名義人）で、ここでは引落開始充当年月（hikiotoshi_startdate）が空のため、と見ている（未検証）。
  //    本番の候補生（DB 投入→昇格）はこれらを持っている。そこでこのランナーは請求方法を
  //    現金のまま据え置き、収納業者・社割・姓名・メモの書き換えで編集の仕組みを確かめる。
  //    銀行名・支店名は、画面ではコードを「入力したとき」の AJAX で埋まる読み取り専用項目なので、
  //    フォーム送信では名称も直接渡す必要がある（キー入力が起きないため）。
  const created = await contactRegisterPageShimamura.createContactBySubmit({
    last_name:           name.lastName,
    first_name:          name.firstName,
    last_name_furigana:  'えーぴーあい',
    first_name_furigana: 'へんしゅう',
    bank_payment_type:   '3',
    bank_code:           '0001',
    bank_name:           'みずほ銀行',
    bank_branch_code:    '001',
    bank_branch_name:    '東京営業部',
    bank_account_no:     '1234567',
    bank_account_name:   'ﾃｽﾄ ﾊﾅｺ',
    description:         name.description,
  });
  I.amOnPage(created.url);
  I.waitForElement(locate('body').withText('受講生詳細'), TIMEOUTS.SCREEN);

  // 2. 収納業者は月謝一括作成準備の CSV と同じ値にし、社割 ON・メモを足して書き換える
  const expected = {
    bankPaymentType: '3',           // 現金のまま（上のコメント参照）
    shimaStorageId:  '00120211112', // 001:イオン収納
    discount:        '1',
    description:     `${name.description} / 請求方法をフォーム送信で編集`,
  };
  const startedAt = Date.now();
  const recordId = await editStudentPaymentBySubmit(I, {
    testName: { lastName: name.lastName, firstName: name.firstName, description: expected.description },
    bankPaymentType: expected.bankPaymentType,
    shimaStorageId:  expected.shimaStorageId,
    discount:        expected.discount,
  });
  const elapsedMs = Date.now() - startedAt;
  I.say(`編集〜保存〜受講生詳細の表示: ${elapsedMs} ms / record=${recordId}`);
  if (recordId !== created.recordId) {
    throw new Error(`編集後の record が作成時と違う（作成=${created.recordId} / 編集後=${recordId}）`);
  }

  // 3. 編集画面を開き直し、保存された値を読み返す
  I.click('input[name="edit_button"]');
  I.waitForElement('#bank_payment_type', TIMEOUTS.SCREEN);
  const actual = {
    bankPaymentType: await I.grabValueFrom('#bank_payment_type'),
    shimaStorageId:  await I.grabValueFrom('#shima_storage_id'),
    discount:        (await I.executeScript(() => document.querySelector('#discount').checked)) ? '1' : '',
    description:     (await I.grabValueFrom('textarea[name="description"]')).trim(),
  };
  I.saveScreenshotWithTimestamp('STUDENT_EDIT_BY_SUBMIT', true);

  const diffs = Object.keys(expected).filter((k) => String(actual[k]) !== String(expected[k]));
  Object.keys(expected).forEach((k) => I.say(`  ${k}: 期待「${expected[k]}」 / 保存後「${actual[k]}」`));
  if (diffs.length) throw new Error(`保存内容が期待と違う項目: ${diffs.join(', ')}`);

  I.say(`後始末: record=${recordId} を delete_listed_test_records.js の TARGETS に書いて削除する`);
});
