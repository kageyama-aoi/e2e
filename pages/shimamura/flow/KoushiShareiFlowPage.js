'use strict';

const { logScreenUrl } = require('../../../support/utils');
const { verifyValidationErrors } = require('../../../support/shimamura/utils');
const { TIMEOUTS } = require('../../../support/shimamura/constants');

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
    result: 'a.listViewTdLinkS1'
  },
  message: {
    error: '#top_err_info_msg_div'
  }
};

async function ShouldBeOnTsuikaScreen(I) {
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

async function ShouldSelectTeacher(I) {
  I.say('【講師選択】ポップアップを開く');
  I.click(S.buttons.teacher_popup);
  I.switchToNextTab();
  I.waitForElement(S.teacher_popup.result, TIMEOUTS.RESULT);
  I.say('【講師選択】最初の結果を選択');
  I.click(locate(S.teacher_popup.result).first());
  // ポップアップタブが閉じた後、元のタブへ戻る
  I.switchToNextTab();
}

async function ShouldFillMainForm(I, input) {
  I.say('【フォーム入力】計上日・対象月・謝礼項目・金額');
  // グループ1: 計上日・対象月（常に入力）
  I.executeScript(([keijoubi, from_datetime]) => {
    document.querySelector('#keijoubi').value = keijoubi;
    document.querySelector('#from_datetime').value = from_datetime;
  }, [input.keijoubi, input.from_datetime]);
  if (input.area_id) {
    I.selectOption(S.selects.area_id, input.area_id);
    I.waitForEnabled(S.selects.school_id, TIMEOUTS.ENABLED);
  }
  if (input.school_id) {
    I.selectOption(S.selects.school_id, input.school_id);
  }
  I.selectOption(S.selects.sharei_komoku, input.sharei_komoku);
  // グループ2: 謝礼金額・人数・備考
  const mainFields = [
    [S.fields.houshugaku,    input.houshugaku],
    [S.fields.student_count, input.student_count],
    [S.fields.bikou,         input.bikou],
  ].filter(([, v]) => v);
  if (mainFields.length > 0) {
    I.executeScript((fields) => {
      fields.forEach(([sel, value]) => {
        const el = document.querySelector(sel);
        if (el) el.value = value;
      });
    }, mainFields);
  }
}

async function ShouldSaveAndVerify(I, expectedErrors) {
  I.say('【保存】保存ボタンをクリック');
  I.click(S.buttons.save);
  // エラーが出るか保存ボタンが消える（ページ遷移）まで動的に待機
  await I.waitForFunction(
    () => document.querySelector('#top_err_info_msg_div')?.textContent.trim() ||
          !document.querySelector('input[name="save_button"]'),
    TIMEOUTS.RESULT
  );
  if (expectedErrors.length > 0) {
    await verifyValidationErrors(I, expectedErrors, S.message.error);
    return;
  }
  const errorText = await I.executeScript(() => {
    const el = document.querySelector('#top_err_info_msg_div');
    return el ? el.textContent.trim() : '';
  });
  if (errorText) {
    throw new Error(`登録エラー: ${errorText}`);
  }
  I.say('【確認】登録成功');
}

async function runKoushiShareiManualFlow(I, input) {
  await ShouldBeOnTsuikaScreen(I);
  await ShouldSelectTeacher(I);
  await ShouldFillMainForm(I, input);
  await ShouldSaveAndVerify(I, input.expectedErrors || []);
}

async function runKoushiShareiValidationFlow(I, input) {
  await ShouldBeOnTsuikaScreen(I);
  // 講師選択なしでバリデーションを確認するフロー（日付・金額のみ入力）
  const textFields = [
    [S.fields.keijoubi,      input.keijoubi],
    [S.fields.from_datetime, input.from_datetime],
    [S.fields.houshugaku,    input.houshugaku],
  ].filter(([, v]) => v);
  if (textFields.length > 0) {
    I.executeScript((fields) => {
      fields.forEach(([sel, value]) => {
        const el = document.querySelector(sel);
        if (el) el.value = value;
      });
    }, textFields);
  }
  if (input.sharei_komoku) I.selectOption(S.selects.sharei_komoku, input.sharei_komoku);
  await ShouldSaveAndVerify(I, input.expectedErrors || []);
}

module.exports = {
  runKoushiShareiManualFlow,
  runKoushiShareiValidationFlow
};
