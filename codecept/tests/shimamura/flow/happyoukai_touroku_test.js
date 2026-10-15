/**
 * @fileoverview shimamura 発表会（クラス会員登録）E2Eテスト #186
 *
 * **目的**
 * 発表会クラスの参加者一覧画面で、対象受講生のチェックボックスを操作して
 * 「参加者更新」を実行し、参加/不参加が画面表示（コース参加列・開始日・コース料金）に
 * 正しく反映されることを確認する。
 *
 * **前提条件**
 * - happyoukai_setup_test.js による発表会クラス作成・受講生の名簿経由クラス追加が
 *   完了していること（受講生は 21:不参加 の状態で一覧に並んでいる）
 *
 * **処理フロー**
 * 1. 発表会参加者一覧画面へ遷移
 * 2. CSVの各シナリオに従い、対象受講生のチェックボックスをON/OFF
 * 3. 「参加者更新」を一括実行
 * 4. 各シナリオの受講生について、参加/不参加が期待通りか検証
 *
 * **データソース**
 * - `data/shimamura/happyoukai_touroku_data.csv`（scenario列で setup 時のセッション情報と対応付け）
 */
'use strict';

const fs = require('fs');
const { setBusinessLabels, attachBusinessContext, withScenarioLabel, loadCsvWithProfile } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const {
  SESSION_FILE,
  ensureHappyoukaiAccountTransferSchedule,
  navigateToParticipantList,
  setParticipantChecked,
  submitParticipantUpdate,
  verifyParticipation,
} = require('../../../pages/shimamura/flow/HappyoukaiFlowPage');

// happyoukai_setup_test.js の開催月設定（monthsUntilStart: 2）と一致させること
const EVENT_MONTHS_FROM_NOW = 2;

const csvData = withScenarioLabel(
  loadCsvWithProfile('happyoukai_touroku_data', 'shimamura'),
  (row) => row.scenario
);

Feature('発表会参加登録');

Before(beforeShimamura);

Scenario('発表会の参加者を更新すると画面表示に反映される @dev', async ({ I, classMemberPageShimamura }) => {
  setBusinessLabels({
    epic:    '発表会',
    feature: '発表会参加登録',
    story:   '参加者更新の実行と検証',
  });

  const session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
  if (!session.classRecordId || session.students.length === 0) {
    throw new Error('【発表会参加登録】happyoukai_setup_test.js が先に完了している必要があります');
  }

  // CSVのscenario列とセッションのscenarioを突き合わせて対象受講生を特定する
  const targets = csvData.map((row) => {
    const student = session.students.find((s) => s.scenario === row.scenario);
    if (!student) throw new Error(`【発表会参加登録】セッションに対応する受講生が見つかりません: ${row.scenario}`);
    return {
      idnumber: student.idnumber,
      checked: row.checked === '1',
      expectedParticipating: row.expectedParticipating === '1',
      scenario: row.scenario,
    };
  });

  attachBusinessContext({
    label: '参加者更新',
    input: targets.map(({ scenario, idnumber, checked }) => ({ scenario, idnumber, checked })),
  });

  // 参加費(sms_fee)作成には開催月の口座振替スケジュールが必要（未登録だと参加処理が失敗する）
  await ensureHappyoukaiAccountTransferSchedule(I, { monthsFromNow: EVENT_MONTHS_FROM_NOW });

  await navigateToParticipantList(I, classMemberPageShimamura, {
    className:  session.className,
    courseName: session.courseName,
  });

  for (const { idnumber, checked, scenario } of targets) {
    I.say(`【チェック設定】${scenario} 会員番号=${idnumber} checked=${checked}`);
    setParticipantChecked(I, { idnumber, checked });
  }

  submitParticipantUpdate(I);

  for (const { idnumber, expectedParticipating, scenario } of targets) {
    I.say(`【検証】${scenario} 会員番号=${idnumber}`);
    await verifyParticipation(I, { idnumber, expectedParticipating });
  }

  I.saveScreenshotWithTimestamp('HAPPYOUKAI_TOUROKU_success');
});
