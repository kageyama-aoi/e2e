'use strict';

/**
 * shimamura テストデータ削除ランナー（削除対象を UUID で明示指定する）
 *
 * このファイルは通常のテストスイートには含まれない（`_test.js` 非末尾）。
 * 検索結果をまとめて消すようなことはせず、**下の TARGETS に書いた UUID だけ**を削除する。
 * 対象は事前に `list_submit_test_records.js`（読み取りのみ）で確認すること。
 * 消せるのは受講生（module=Student）だけ。コース・クラスの詳細画面には削除ボタンが無い（#238 で確認）。
 *
 * 実行例:
 *   npx codeceptjs run ./tests/shimamura/util/delete_listed_test_records.js --profile shimamura.testgcp
 *
 * 削除は詳細画面の「削除」ボタンと同じ送信（共通部品 `submitDeleteForm()`、support/shimamura/editViewSubmit.js）。
 */

const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { submitDeleteForm } = require('../../../support/shimamura/editViewSubmit');

/**
 * 削除対象。list_submit_test_records.js（読み取りのみ）が出した行のうち、module が Student の
 * ものをここに書き写す（module は Student 以外を受け付けない）。
 * 例: { module: 'Student', recordId: 'ccac9d9f-015e-789b-39cb-6ab4dc9d5f17', label: 'API調査0924 一郎' },
 * 掃除が済んだらこの配列は空に戻す（2026-09-24 分は削除済み）。
 */
const TARGETS = [];

Feature('shimamura テストデータの削除（UUID指定）');

Before(beforeShimamura);

Scenario('指定した record UUID のレコードを削除する', async ({ I }) => {
  I.say(`【削除】対象 ${TARGETS.length} 件`);
  if (TARGETS.length === 0) {
    I.say('【削除】TARGETS が空のため何もしない');
    return;
  }

  const unsupported = TARGETS.filter((t) => t.module && t.module !== 'Student');
  if (unsupported.length) {
    throw new Error(`Student 以外は削除できません（詳細画面に削除ボタンが無い）: ${unsupported.map((t) => `${t.module} ${t.recordId}`).join(', ')}`);
  }

  for (const target of TARGETS) {
    await submitDeleteForm(I, { module: 'Student', recordId: target.recordId, label: target.label });
  }

  I.say('【削除】すべて完了。list_submit_test_records.js で残件を確認すること');
});
