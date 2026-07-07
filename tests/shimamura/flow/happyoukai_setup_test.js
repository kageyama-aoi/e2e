/**
 * @fileoverview shimamura 発表会（クラス会員登録）準備セットアップテスト #186
 *
 * **目的**
 * 発表会フロー本体テスト（happyoukai_touroku_test.js）に必要な、
 * 「発表会クラス・コース」と「不参加ステータスの受講生」を testgcp 環境に用意する。
 *
 * **処理フロー**
 * 1. 発表会カテゴリのクラス・コースを新規作成（CourseClassSetupFlowPage流用）
 * 2. 候補生一覧から候補生を検索 → 「受講生へ移動」で昇格 → 共通の姓に書き換え
 * 3. 昇格させた受講生を共通の姓で検索 → 検索結果を名簿リストにする
 * 4. 名簿リスト詳細で対象クラスを選択 → 「クラスに追加」
 *    → 対象受講生全員に event_contacts（21:不参加）が作成される
 *
 * **データソース**
 * - `data/shimamura/happyoukai_setup_data.csv`
 */
'use strict';

const fs = require('fs');
const { setBusinessLabels, withScenarioLabel, loadCsvWithProfile } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const {
  SESSION_FILE,
  resetSession,
  createHappyoukaiClassAndCourse,
  promoteAndRenameStudent,
  createRosterFromStudents,
  addRosterToClass,
} = require('../../../pages/shimamura/flow/HappyoukaiFlowPage');

const csvData = withScenarioLabel(
  loadCsvWithProfile('happyoukai_setup_data', 'shimamura'),
  (row) => row.scenario
);

Feature('発表会準備（クラス・コース作成/受講生登録）');

BeforeSuite(() => {
  // setup再実行時にセッションファイルをリセット（前回のクラス・受講生情報を破棄）
  try { resetSession(); } catch {}
});

Before(beforeShimamura);

Scenario('発表会クラス・コースを新規作成する @setup @dev', async ({ I }) => {
  setBusinessLabels({
    epic:    '発表会',
    feature: '発表会準備',
    story:   'クラス・コース作成',
  });

  const now = new Date();
  const stamp = [
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('');

  // 発表会は「1スケジュール＝1クラス」が基本（スクール/サロンのような週次繰り返しではない）。
  // 参加登録締切（開催月の前月18日）を回避するため開催日を2ヶ月後の単発にし、
  // その日の曜日に対応するチェックボックスを動的に選ぶ（実機確認: youbi_1=日〜youbi_64=土のビット値）
  const YOUBI_BIT_BY_DAY = [1, 2, 4, 8, 16, 32, 64]; // [日,月,火,水,木,金,土]
  const eventDate = new Date();
  eventDate.setMonth(eventDate.getMonth() + 2);
  const weekdaySelector = `#youbi_${YOUBI_BIT_BY_DAY[eventDate.getDay()]}`;

  await createHappyoukaiClassAndCourse(I, {
    courseCd:        `HV${stamp}`,
    courseName:      `E2Eテスト発表会_${stamp}`,
    className:       `E2Eテスト発表会クラス_${stamp}`,
    kingaku:         3300,
    // 706: ウォークテス前橋店（既存の運営管理費検証用クラスと同一店舗）
    areaValue:       '00',
    schoolValue:     '48e65bdd-bce1-f9d9-c851-63e1d38c0ef8',
    weekdaySelector,
    startH:          '16',
    startM:          '00',
    endH:            '17',
    endM:            '00',
    teiin:           '20',
    // 開始日=2ヶ月後、終了日=開始日+6日（既定）とし、選択曜日の1回だけを発生させる
    monthsUntilStart: 2,
  });
});

Data(csvData).Scenario('候補生を受講生へ昇格させる @setup @dev', async ({ I, classMemberPageShimamura, current }) => {
  setBusinessLabels({
    epic:    '発表会',
    feature: '発表会準備',
    story:   current.scenario,
  });

  await promoteAndRenameStudent(I, classMemberPageShimamura, current);
});

Scenario('名簿リストを作成し発表会クラスへ追加する @setup @dev', async ({ I, classMemberPageShimamura }) => {
  setBusinessLabels({
    epic:    '発表会',
    feature: '発表会準備',
    story:   '名簿リスト作成・クラス追加',
  });

  const session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
  if (!session.classRecordId || !session.className) {
    throw new Error('【名簿→クラス追加】クラス作成シナリオが先に完了している必要があります');
  }
  if (session.students.length === 0) {
    throw new Error('【名簿→クラス追加】受講生登録シナリオが先に完了している必要があります');
  }

  // 昇格させた受講生は全員 buildTestName() により共通の姓（発表会テストMMDD）を持つ
  const sharedLastName = session.students[0].lastName;
  const listName = `E2Eテスト発表会名簿_${sharedLastName}`;

  const listRecordId = await createRosterFromStudents(I, classMemberPageShimamura, {
    lastName: sharedLastName,
    listName,
  });

  await addRosterToClass(I, {
    prospectListRecordId: listRecordId,
    className: session.className,
  });
});
