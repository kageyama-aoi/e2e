'use strict';

/**
 * shimamura クラスのフォーム送信登録（createClassBySubmit）動作確認ランナー #234
 *
 * このファイルは通常のテストスイートには含まれない（`_test.js` 非末尾）。
 * 同じ内容のクラスを UI 版（createClass）とフォーム送信版（createClassBySubmit）で
 * 1件ずつ作り、所要時間と保存内容を比べる。実行すると testgcp にクラスが2件増える。
 *
 * 実行例:
 *   npx codeceptjs run ./tests/shimamura/util/create_class_by_submit_check.js --profile shimamura.testgcp
 *
 * 確認すること:
 * - フォーム送信版で record UUID が返ること（＝サーバーが保存したこと）
 * - 詳細画面の「エリア・店舗」「レッスン曜日」「開始時間」が UI 版と同じに見えること
 *   （店舗はエリア変更の AJAX で選択肢が作り直される項目なので、ここが一番の確認点）
 * - UI 版との所要時間の差（ログの ms を控える）
 */

const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { BASE_URL } = require('../../../support/shimamura/constants');
const {
  createClass,
  createClassBySubmit,
} = require('../../../pages/shimamura/flow/CourseClassSetupFlowPage');

Feature('shimamura クラスのフォーム送信登録（動作確認）');

Before(beforeShimamura);

Scenario('クラスを UI 版とフォーム送信版で1件ずつ作り、所要時間と保存内容を比べる', async ({ I }) => {
  const now = new Date();
  const stamp = [now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((n) => String(n).padStart(2, '0')).join('');

  // course_class_setup_test.js と同じ店舗・曜日・時間。エリア 00 は登録画面の既定（60）と違うので、
  // 店舗の選択肢が AJAX で作り直される経路を必ず通る。
  const common = {
    courseCategory:  'スクール',
    areaValue:       '00',
    schoolValue:     '48e65bdd-bce1-f9d9-c851-63e1d38c0ef8', // 706: ウォークテス前橋店
    weekdaySelector: '#youbi_32', // 金曜日
    startH:          '16',
    startM:          '00',
    endH:            '16',
    endM:            '30',
  };

  const uiStartedAt = Date.now();
  const uiRecordId = await createClass(I, { ...common, name: `E2E_UI版クラス_${stamp}` });
  const uiMs = Date.now() - uiStartedAt;

  const submitStartedAt = Date.now();
  const submitRecordId = await createClassBySubmit(I, { ...common, name: `E2E_送信版クラス_${stamp}` });
  const submitMs = Date.now() - submitStartedAt;

  I.say(`所要時間: UI 版 ${uiMs} ms / フォーム送信版 ${submitMs} ms`);
  I.say(`record: UI 版 ${uiRecordId} / フォーム送信版 ${submitRecordId}`);

  // 詳細画面から、比べたい項目の値だけを抜き出す。セルの間に空白が入らない行もある
  // （例: 「金開始時間:16:00」）ので、値の終わりは「次の見出し＋コロン」で見つける。
  const FIELDS = ['エリア・店舗', 'コースカテゴリー', 'レッスン曜日', '開始時間', '終了時間'];
  const LABELS = FIELDS.concat(['略称', '定員', 'スケジュール延長']); // 値の終わりを見つけるための次の見出し
  const readDetail = async (recordId) => {
    I.amOnPage(`${BASE_URL}index.php?module=Course&action=DetailView&record=${recordId}`);
    const text = (await I.grabTextFrom('body')).replace(/\s+/g, ' ');
    return Object.fromEntries(FIELDS.map((f) => {
      const m = text.match(new RegExp(`${f}\\s*:\\s*(.*?)\\s*(?:${LABELS.join('|')})\\s*:`));
      return [f, m ? m[1].trim() : '(読めず)'];
    }));
  };

  const uiDetail = await readDetail(uiRecordId);
  I.saveScreenshotWithTimestamp('CLASS_CREATE_UI版', true);
  const submitDetail = await readDetail(submitRecordId);
  I.saveScreenshotWithTimestamp('CLASS_CREATE_フォーム送信版', true);

  const unreadable = FIELDS.filter((f) => uiDetail[f] === '(読めず)' || submitDetail[f] === '(読めず)');
  if (unreadable.length) {
    // 両方読めないと「(読めず) === (読めず)」で一致扱いになり素通りするので、先に止める
    throw new Error(`詳細画面から値を読めなかった項目: ${unreadable.join(', ')}（画面の文言が変わった可能性）`);
  }

  const diffs = [];
  FIELDS.forEach((f) => {
    I.say(`  ${f}: UI 版「${uiDetail[f]}」 / フォーム送信版「${submitDetail[f]}」`);
    if (uiDetail[f] !== submitDetail[f]) diffs.push(f);
  });
  if (diffs.length) throw new Error(`UI 版とフォーム送信版で保存内容が違う項目: ${diffs.join(', ')}`);
  if (!submitDetail['エリア・店舗'].includes('706:ウォークテス前橋店')) {
    throw new Error(`店舗が指定どおりになっていない: ${submitDetail['エリア・店舗']}`);
  }
});
