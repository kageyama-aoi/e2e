'use strict';

const { logScreenUrl } = require('../../../support/utils');
const { assertNoShimamuraError } = require('../../../support/shimamura/utils');
const { TIMEOUTS } = require('../../../support/shimamura/constants');

const BASE_URL = (process.env.BASE_URL || '').replace(/\/?$/, '/');

const S = {
  studentSearch: {
    lastName:     '#last_name',
    searchButton: 'input[name="search"]',
    resultLink:   'a.listViewTdLinkS1',
  },
  studentDetail: {
    editButton: 'input[name="edit_button"]',
  },
  studentEdit: {
    bankPaymentType: '#bank_payment_type',
    shimaStorageId:  '#shima_storage_id',
    saveButton:      'input[name="save_button"]',
  },
};

async function runStudentPaymentSetup(I, row) {
  I.say(`【請求方法設定】受講生検索: ${row.lastName}`);
  I.amOnPage(BASE_URL + 'index.php?module=Student&action=index&top_menu=1');
  I.waitForElement(S.studentSearch.lastName, TIMEOUTS.SCREEN);
  I.fillField(S.studentSearch.lastName, row.lastName);
  I.click(S.studentSearch.searchButton);
  I.waitForElement(S.studentSearch.resultLink, TIMEOUTS.RESULT);
  await logScreenUrl(I, '受講生検索結果');

  I.click(locate(S.studentSearch.resultLink).first());
  I.waitForElement(S.studentDetail.editButton, TIMEOUTS.SCREEN);
  await logScreenUrl(I, '受講生詳細');

  I.click(S.studentDetail.editButton);
  I.waitForElement(S.studentEdit.bankPaymentType, TIMEOUTS.SCREEN);
  await logScreenUrl(I, '受講生編集');

  I.selectOption(S.studentEdit.bankPaymentType, row.bank_payment_type);
  I.selectOption(S.studentEdit.shimaStorageId,  row.shima_storage_id);

  I.say('【請求方法設定】保存');
  I.click(S.studentEdit.saveButton);
  I.waitForElement(S.studentDetail.editButton, TIMEOUTS.SCREEN);
  await assertNoShimamuraError(I, '【請求方法設定】保存');
  await logScreenUrl(I, '受講生詳細（保存後）');
}

async function runMonthlyFeeCreation(I) {
  I.say('【月謝一括作成】画面へ遷移');
  I.amOnPage(BASE_URL + 'index.php?module=Fee&action=LWMonthlyFeeCreation_AN');
  // TODO: 実際のボタンセレクタは画面確認後に確定させること（input[type="button"] か button を想定）
  I.waitForElement('input[type="button"], input[type="submit"], button', TIMEOUTS.SCREEN);
  await logScreenUrl(I, '月謝一括作成');

  I.say('【月謝一括作成】月謝作成ボタンをクリック');
  // TODO: 実際のボタンセレクタに置き換えること
  I.click('input[type="submit"]');
  I.waitForElement('body', TIMEOUTS.RESULT);
  await logScreenUrl(I, '月謝一括作成（実行後）');
}

module.exports = { runStudentPaymentSetup, runMonthlyFeeCreation };
