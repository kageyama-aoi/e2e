'use strict';

const fs = require('fs');
const { logScreenUrl } = require('../../../support/utils');
const {
  verifyValidationErrors, assertNoShimamuraError, fillTextFieldsBySelector, waitForSaveResult, toggleGroupmenu,
} = require('../../../support/shimamura/utils');
const { TIMEOUTS, SELECTORS, BASE_URL } = require('../../../support/shimamura/constants');

const NAV = {
  directUrl: 'index.php?module=ShareiNichibetsu&action=EW_KoushiShareiTsuika_AN',
  sidebar: {
    moduleUrl:      'index.php?module=ShareiNichibetsu&action=LWShareiIchiran_AN&top_menu=1',
    // 謝礼一覧のサイドバーでは「講師謝礼」グループが折りたたまれており、
    // 展開しないと「講師謝礼追加」リンクがクリックできない（#206）。
    collapseToggle: { icon_id: 'submenu__sharei_koshi_sub', menuname: '講師謝礼' },
    shortcut:       '講師謝礼追加',
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
    await toggleGroupmenu(I, NAV.sidebar.collapseToggle);   // 「講師謝礼」グループを展開（#206）
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
  await waitForSaveResult(I, { successSelector: S.buttons.save, successMode: 'disappears' });
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
  // 成功メッセージ（#top_message_div_id）かエラーのどちらかが出るまで待つ
  await waitForSaveResult(I, { successSelector: S.import.success, successMode: 'hasText' });
}

// 取込CSVの列位置（0始まり）。講師・店舗は UUID で書くため、取込前に実在を確かめられる（#99）
const IMPORT_MASTER_COLUMNS = { teacherId: 0, teacherName: 2, schoolId: 6 };

// 詳細画面の見出し（.moduleTitle）。右端のヘルプリンクの文字「ヘルプ」は取り除く
async function grabModuleTitle(I) {
  const text = await I.executeScript(() => {
    const title = document.querySelector('.moduleTitle');
    return title ? title.innerText : '';
  });
  return text.replace(/\s+/g, ' ').replace(/\s*ヘルプ$/, '').trim();
}

/**
 * 取込CSVの講師・店舗が testgcp に実在するかを、詳細画面を UUID で開いて確かめる（#99）。
 * 存在しないマスタを書くと画面には「エラーが発生しました。」としか出ず原因が分からないため、先に確かめる。
 * @param {object} I
 * @param {string} filePath - 取込CSV（SHIFT-JIS・ヘッダーなし・1行）
 */
async function verifyImportMastersExist(I, filePath) {
  const cols = new TextDecoder('shift_jis').decode(fs.readFileSync(filePath)).trim().split(',');
  const teacherId = cols[IMPORT_MASTER_COLUMNS.teacherId];
  const teacherName = cols[IMPORT_MASTER_COLUMNS.teacherName];
  const schoolId = cols[IMPORT_MASTER_COLUMNS.schoolId];
  I.say(`【前提確認】講師 ${teacherId}（${teacherName}）・店舗 ${schoolId} が実在するか`);

  // 詳細画面の見出しは、実在すれば「講師詳細: <氏名>」、無ければ「講師詳細:」になる
  I.amOnPage(`${BASE_URL}index.php?module=Teacher&action=DetailView&record=${teacherId}`);
  const teacherTitle = await grabModuleTitle(I);
  const actualName = teacherTitle.replace(/^講師詳細:\s*/, '');
  if (!actualName) {
    throw new Error(`【前提確認】取込CSVの講師が testgcp にありません: 講師ID ${teacherId}（${filePath}）`);
  }
  if (actualName !== teacherName) {
    throw new Error(`【前提確認】取込CSVの講師名が実データと違います: CSV「${teacherName}」／実データ「${actualName}」（講師ID ${teacherId}）`);
  }

  // 店舗は、実在すれば「店舗詳細: <エリア>・<店舗名>」、無ければ「店舗詳細: ・」になる
  I.amOnPage(`${BASE_URL}index.php?module=School&action=DetailView&record=${schoolId}`);
  const schoolTitle = await grabModuleTitle(I);
  if (/^店舗詳細:\s*・?$/.test(schoolTitle)) {
    throw new Error(`【前提確認】取込CSVの店舗が testgcp にありません: 店舗ID ${schoolId}（${filePath}）`);
  }
  I.say(`【前提確認】OK（講師: ${actualName}／${schoolTitle}）`);
}

const IMPORT_DONE_MESSAGE = '講師謝礼登録が完了しました。';

async function verifyImportResult(I) {
  const errorText = await I.grabTextFrom(S.import.error);
  if (errorText.trim()) {
    throw new Error(`一括取込エラー: ${errorText.trim()}`);
  }
  // エラーが無いだけでは登録された証拠にならない。完了メッセージまで確かめる（#99）
  const successText = (await I.grabTextFromAll(S.import.success)).join(' ');
  if (!successText.includes(IMPORT_DONE_MESSAGE)) {
    throw new Error(`一括取込: 完了メッセージが出ていません: ${successText.trim() || '（表示なし）'}`);
  }
  I.say(`【結果確認】${IMPORT_DONE_MESSAGE}`);
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
  verifyImportMastersExist,
  verifyImportError,
};
