'use strict';

const { logScreenUrl } = require('../../../support/utils');
const { verifyValidationErrors, assertNoShimamuraError, fillTextFieldsBySelector } = require('../../../support/shimamura/utils');
const { TIMEOUTS, SELECTORS } = require('../../../support/shimamura/constants');

const BASE_URL = (process.env.BASE_URL || '').replace(/\/?$/, '/');

const NAV = {
  directUrl: 'index.php?module=ShareiNichibetsu&action=EW_KoushiShareiTsuika_AN',
  sidebar: {
    moduleUrl: 'index.php?module=ShareiNichibetsu&action=LWShareiIchiran_AN&top_menu=1',
    shortcut:  '講師謝礼追加',
  },
};

const S = {
  url: NAV.directUrl,
  import: {
    fileInput: 'input[name="import_file"]',
    button:    'input[name="batch_import"]',
    success:   '#top_message_div_id',
    error:     SELECTORS.ERROR_CONTAINER,
  },
  fields: {
    keijoubi:      '#keijoubi',
    from_datetime: '#from_datetime',
    houshugaku:    '#houshugaku',
    student_count: '#student_count',
    bikou:         'textarea[name="bikou"]'
  },
  selects: {
    area_id:       'select[name="area_id"]',
    school_id:     'select[name="school_id"]',
    sharei_komoku: 'select[name="sharei_komoku"]'
  },
  buttons: {
    teacher_popup: '#teacher_id_popup_button',
    save:          'input[name="save_button"]'
  },
  teacher_popup: {
    result: `a${SELECTORS.RESULT_LINK}`
  },
  message: {
    error: SELECTORS.ERROR_CONTAINER
  }
};

async function navigateToTsuikaScreen(I) {
  I.say('【画面遷移】講師謝礼追加画面へ');
  if (process.env.SHIMAMURA_NAV === 'sidebar') {
    I.amOnPage(BASE_URL + NAV.sidebar.moduleUrl);
    I.waitForElement('a[class*="subMenuLink"]', TIMEOUTS.SCREEN);
    I.say(`【ナビ】サイドバー "${NAV.sidebar.shortcut}" をクリック`);
    I.click(locate('a[class*="subMenuLink"]').withText(NAV.sidebar.shortcut));
  } else {
    I.amOnPage(BASE_URL + NAV.directUrl);
  }
  I.waitForElement(S.buttons.save, TIMEOUTS.SCREEN);
  await logScreenUrl(I, '講師謝礼追加');
}

async function selectTeacher(I) {
  I.say('【講師選択】ポップアップを開く');
  I.click(S.buttons.teacher_popup);
  I.switchToNextTab();
  I.waitForElement(S.teacher_popup.result, TIMEOUTS.RESULT);
  I.say('【講師選択】最初の結果を選択');
  I.click(locate(S.teacher_popup.result).first());
  // ポップアップタブが閉じた後、元のタブへ戻る
  I.switchToNextTab();
}

async function fillMainForm(I, input) {
  I.say('【フォーム入力】計上日・対象月・謝礼項目・金額');
  // グループ1: 計上日・対象月（常に入力）
  fillTextFieldsBySelector(I, [
    [S.fields.keijoubi,      input.keijoubi],
    [S.fields.from_datetime, input.from_datetime],
  ]);
  if (input.area_id) {
    I.selectOption(S.selects.area_id, input.area_id);
    I.waitForEnabled(S.selects.school_id, TIMEOUTS.ENABLED);
  }
  if (input.school_id) {
    I.selectOption(S.selects.school_id, input.school_id);
  }
  I.selectOption(S.selects.sharei_komoku, input.sharei_komoku);
  // グループ2: 謝礼金額・人数・備考
  fillTextFieldsBySelector(I, [
    [S.fields.houshugaku,    input.houshugaku],
    [S.fields.student_count, input.student_count],
    [S.fields.bikou,         input.bikou],
  ]);
}

async function saveAndVerify(I, expectedErrors) {
  I.say('【保存】保存ボタンをクリック');
  I.click(S.buttons.save);
  // エラーが出るか保存ボタンが消える（ページ遷移）まで動的に待機
  // codeceptjs の waitForFunction は第2引数が配列でないと args として渡されないため注意
  await I.waitForFunction(
    ([selector]) => document.querySelector(selector)?.textContent.trim() ||
          !document.querySelector('input[name="save_button"]'),
    [SELECTORS.ERROR_CONTAINER],
    TIMEOUTS.RESULT
  );
  if (expectedErrors.length > 0) {
    await verifyValidationErrors(I, expectedErrors, S.message.error);
    return;
  }
  await assertNoShimamuraError(I, '登録');
  I.say('【確認】登録成功');
}

async function runKoushiShareiManualFlow(I, input) {
  await navigateToTsuikaScreen(I);
  await selectTeacher(I);
  await fillMainForm(I, input);
  await saveAndVerify(I, input.expectedErrors || []);
}

async function runKoushiShareiValidationFlow(I, input) {
  await navigateToTsuikaScreen(I);
  // 講師選択なしでバリデーションを確認するフロー（日付・金額のみ入力）
  fillTextFieldsBySelector(I, [
    [S.fields.keijoubi,      input.keijoubi],
    [S.fields.from_datetime, input.from_datetime],
    [S.fields.houshugaku,    input.houshugaku],
  ]);
  if (input.sharei_komoku) I.selectOption(S.selects.sharei_komoku, input.sharei_komoku);
  await saveAndVerify(I, input.expectedErrors || []);
}

async function navigateToTsuikaImportScreen(I) {
  I.say('【画面遷移】講師謝礼追加画面（取込）へ');
  I.amOnPage(BASE_URL + NAV.directUrl);
  I.waitForElement(S.import.fileInput, TIMEOUTS.SCREEN);
  await logScreenUrl(I, '講師謝礼追加画面');
}

async function executeImport(I, filePath) {
  I.say(`【ファイル選択】${filePath}`);
  I.attachFile(S.import.fileInput, filePath);
  I.say('【一括取込実行】講師謝礼一括取込ボタンをクリック');
  I.click(S.import.button);
  await I.waitForFunction(
    ([errorSelector]) => document.querySelector('#top_message_div_id')?.textContent.trim() ||
          document.querySelector(errorSelector)?.textContent.trim(),
    [SELECTORS.ERROR_CONTAINER],
    TIMEOUTS.RESULT
  );
}

async function verifyImportResult(I) {
  const errorText = await I.grabTextFrom(S.import.error);
  if (errorText.trim()) {
    throw new Error(`一括取込エラー: ${errorText.trim()}`);
  }
  I.say('【結果確認】エラーなし - 取込成功');
}

async function verifyImportError(I, expectedError) {
  I.waitForElement(S.import.error, TIMEOUTS.RESULT);
  I.see(expectedError, S.import.error);
  I.say(`【結果確認】期待エラーを確認: ${expectedError}`);
}

module.exports = {
  runKoushiShareiManualFlow,
  runKoushiShareiValidationFlow,
  navigateToTsuikaImportScreen,
  executeImport,
  verifyImportResult,
  verifyImportError,
};
