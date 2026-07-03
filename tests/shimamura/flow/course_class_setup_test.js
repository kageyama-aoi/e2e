/**
 * @fileoverview shimamura コース・クラス作成 Page Object 動作確認テスト #167
 *
 * **目的**
 * `CourseClassSetupFlowPage.setupLinkedCourseAndClass`（コース作成 → クラス作成 →
 * コース紐づけ → スケジュール作成を一括実行する Page Object）が実機で最後まで
 * エラーなく完走することを確認する。
 *
 * 運営管理費テスト（月謝一括作成 #167）で、既存クラスの内部コース構成に依存せず
 * 単一コースの検証用クラスをオンデマンドに用意できることを検証するためのドライラン。
 */
'use strict';

const { setBusinessLabels } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { setupLinkedCourseAndClass } = require('../../../pages/shimamura/flow/CourseClassSetupFlowPage');

Feature('コース・クラス作成（運営管理費テスト用Page Object）');

Before(beforeShimamura);

Scenario('コース・クラスを新規作成し紐づけ・スケジュール作成まで完了する @dev', async ({ I }) => {
  setBusinessLabels({
    epic:    '月謝一括作成',
    feature: 'コース・クラス作成Page Objectドライラン',
    story:   'setupLinkedCourseAndClassの動作確認',
  });

  const now = new Date();
  const stamp = [
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('');

  const { courseRecordId, classRecordId } = await setupLinkedCourseAndClass(I, {
    courseCd:        `DR${stamp}`,
    courseName:      `E2Eドライラン_${stamp}`,
    courseCategory:  'スクール',
    kanrihi:         1200,
    // 706: ウォークテス前橋店（既存の運営管理費検証用クラスと同一店舗）
    areaValue:       '00',
    schoolValue:     '48e65bdd-bce1-f9d9-c851-63e1d38c0ef8',
    weekdaySelector: '#youbi_32', // 金曜日（既存検証用クラスの水/木と重複回避）
    startH:          '16',
    startM:          '00',
    endH:            '16',
    endM:            '30',
    monthsUntilEnd:  6,
  });

  I.say(`✓ ドライラン完了 コース record=${courseRecordId} / クラス record=${classRecordId}`);
});
