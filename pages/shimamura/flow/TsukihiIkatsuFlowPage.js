'use strict';

const { logScreenUrl } = require('../../../support/utils');
const { assertNoShimamuraError } = require('../../../support/shimamura/utils');
const { TIMEOUTS } = require('../../../support/shimamura/constants');

const BASE_URL = (process.env.BASE_URL || '').replace(/\/?$/, '/');

const S = {
  kouhoseiSearch: {
    lastName:     'last_name',            // name属性（SyokaiFlowPage と同じ）
    searchButton: '検索',
    resultLink:   'a.listViewTdLinkS1',
  },
  kouhoseiDetail: {
    editButton: 'input[name="edit_button"]',
  },
  kouhoseiEdit: {
    bankPaymentType: '#bank_payment_type',
    shimaStorageId:  '#shima_storage_id',
    saveButton:      'input[name="save_button"]',
  },
};

async function runStudentPaymentSetup(I, row) {
  I.say(`【請求方法設定】候補生一覧へ遷移: ${row.lastName}`);
  // contact_status=5 が候補生（問合せ）一覧
  I.amOnPage(BASE_URL + 'index.php?module=Student&action=index&contact_status=5&top_menu=1');
  I.waitForElement(locate('body').withText('候補生一覧'), TIMEOUTS.SCREEN);
  I.fillField(S.kouhoseiSearch.lastName, row.lastName);
  I.click(S.kouhoseiSearch.searchButton);
  I.waitForElement(S.kouhoseiSearch.resultLink, TIMEOUTS.RESULT);
  await logScreenUrl(I, '候補生一覧');

  I.click(locate(S.kouhoseiSearch.resultLink).first());
  I.waitForElement(S.kouhoseiDetail.editButton, TIMEOUTS.SCREEN);
  await logScreenUrl(I, '候補生詳細');

  I.click(S.kouhoseiDetail.editButton);
  I.waitForElement(S.kouhoseiEdit.bankPaymentType, TIMEOUTS.SCREEN);
  await logScreenUrl(I, '候補生編集');

  I.selectOption(S.kouhoseiEdit.bankPaymentType, row.bank_payment_type);
  I.selectOption(S.kouhoseiEdit.shimaStorageId,  row.shima_storage_id);

  I.say('【請求方法設定】保存');
  I.click(S.kouhoseiEdit.saveButton);
  I.waitForElement(S.kouhoseiDetail.editButton, TIMEOUTS.SCREEN);
  await assertNoShimamuraError(I, '【請求方法設定】保存');
  await logScreenUrl(I, '候補生詳細（保存後）');
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
