'use strict';

const { logScreenUrl } = require('../../../support/utils');
const {
  verifyValidationErrors, assertNoShimamuraError, fillTextFieldsBySelector, waitForSaveResult, toggleGroupmenu,
  extractRecordId,
} = require('../../../support/shimamura/utils');
const { TIMEOUTS, SELECTORS, BASE_URL } = require('../../../support/shimamura/constants');

const NAV = {
  directUrl: 'index.php?module=ShareiNichibetsu&action=EW_KoushiShareiTsuika_AN',
  detailAction: 'DW_KoushiShareiTsuika_AN', // 保存後に移る講師謝礼詳細
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
    lastName:  'input[name="last_name"]',
    firstName: 'input[name="first_name"]',
    search:    'input[name="search"]',
    result:    `a${SELECTORS.RESULT_LINK}`
  },
  message: {
    error:       SELECTORS.ERROR_CONTAINER,
    detailTitle: '.moduleTitle', // 講師謝礼詳細の見出し「講師謝礼詳細 ：<講師名>」
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

/**
 * 講師選択ポップアップで、指定の講師を氏名で検索して選ぶ。
 * 先頭の結果は休任中の講師のこともあるため、先頭固定では選ばない（#210）。
 * @param {object} I
 * @param {string} teacherName - 「姓 名」（例: 'E2Eテスト 内部課税'）
 */
async function selectTeacher(I, teacherName) {
  I.say(`【講師選択】ポップアップを開いて「${teacherName}」を選ぶ`);
  I.click(S.buttons.teacher_popup);
  // ポップアップのタブは少し遅れて開くため、開くまで切り替えを再試行する（他の FlowPage と同じ #210）
  I.retry({ retries: 5, minTimeout: 200 }).switchToNextTab();
  I.waitForElement(S.teacher_popup.lastName, TIMEOUTS.SCREEN);
  const [lastName, firstName = ''] = teacherName.split(' ');
  fillTextFieldsBySelector(I, [
    [S.teacher_popup.lastName,  lastName],
    [S.teacher_popup.firstName, firstName],
  ]);
  I.click(S.teacher_popup.search);
  const resultLink = locate(S.teacher_popup.result).withText(teacherName);
  I.waitForElement(resultLink, TIMEOUTS.RESULT);
  I.click(resultLink);
  // ポップアップタブが閉じた後、元のタブへ戻る
  I.switchToNextTab();
  I.waitForElement(S.buttons.save, TIMEOUTS.SCREEN);
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

/**
 * 保存して結果を確かめる。
 * 成功時は講師謝礼詳細（action=DW_KoushiShareiTsuika_AN&record=...）へ移り、見出しに講師名が出る（完了メッセージは出ない #210）。
 * 保存ボタンが消えただけでは別画面に移っても合格してしまうため、移り先と講師名まで確かめる（#243 から引き継ぎ）。
 * @param {object} I
 * @param {string[]} expectedErrors - 期待するエラー文言（空なら成功を期待）
 * @param {{teacherName: (string|undefined)}} [options]
 */
async function saveAndVerify(I, expectedErrors, { teacherName } = {}) {
  I.say('【保存】保存ボタンをクリック');
  I.click(S.buttons.save);
  // エラーが出るか保存ボタンが消える（ページ遷移）まで動的に待機
  await waitForSaveResult(I, { successSelector: S.buttons.save, successMode: 'disappears' });
  if (expectedErrors.length > 0) {
    await verifyValidationErrors(I, expectedErrors, S.message.error);
    return;
  }
  await assertNoShimamuraError(I, '登録');

  const url = await I.grabCurrentUrl();
  const recordId = extractRecordId(url);
  if (!url.includes(`action=${NAV.detailAction}`) || !recordId) {
    throw new Error(`【登録】講師謝礼詳細に移っていません（保存されていない可能性）: ${url}`);
  }
  if (teacherName) I.see(teacherName, S.message.detailTitle);
  I.say(`【確認】登録成功（講師謝礼 record=${recordId}）`);
  await logScreenUrl(I, '講師謝礼詳細');
}

async function runKoushiShareiManualFlow(I, input) {
  await navigateToTsuikaScreen(I);
  await selectTeacher(I, input.teacher_name);
  await fillMainForm(I, input);
  await saveAndVerify(I, input.expectedErrors || [], { teacherName: input.teacher_name });
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
