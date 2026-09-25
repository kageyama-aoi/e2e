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
 * 削除は詳細画面の「削除」ボタンと同じ仕組み（`delete_button_form` を
 * `submittype=delete_focus` で送信）。ボタンの onclick にある確認ダイアログは
 * フォームを直接送るため出ない（ダイアログはブラウザ操作を止めてしまうため避ける）。
 */

const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { BASE_URL, TIMEOUTS } = require('../../../support/shimamura/constants');

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
    I.say(`【削除】${target.label} (record=${target.recordId})`);
    I.amOnPage(`${BASE_URL}index.php?module=Student&action=DetailView&record=${target.recordId}`);
    I.waitForElement('form[name="delete_button_form"]', TIMEOUTS.SCREEN);

    // 削除ボタンと同じ値を立てて GET フォームを送る
    const result = await I.executeScript(async (recordId) => {
      const form = document.forms.delete_button_form;
      if (!form) return { error: 'delete_button_form が見つかりません' };
      if (form.record.value !== recordId) {
        return { error: `画面のレコードが一致しません（画面=${form.record.value} / 指定=${recordId}）` };
      }
      form.submittype.value = 'delete_focus';
      const params = new URLSearchParams(new FormData(form));
      const res = await fetch(`${form.getAttribute('action')}?${params.toString()}`, {
        credentials: 'same-origin',
        redirect: 'follow',
      });
      return { status: res.status, url: res.url };
    }, target.recordId);

    if (result.error) throw new Error(`【削除】失敗 record=${target.recordId}: ${result.error}`);
    I.say(`【削除】完了 (status=${result.status})`);
  }

  I.say('【削除】すべて完了。list_submit_test_records.js で残件を確認すること');
});
