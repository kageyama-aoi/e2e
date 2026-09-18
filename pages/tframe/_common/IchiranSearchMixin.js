/**
 * @fileoverview tframe 一覧検索（SearchView）の補助ヘルパー
 *
 * 一部の一覧画面（経理系・Eメール系など）は
 * - 日付レンジの既定値が「当月」で、広げないと結果が0件になる
 * - エリア / 対象区分 / ステイタス等の絞り込みがサーバー側にセッション記憶される
 * という共通のクセを持つ。これらを吸収するための小さな関数群。
 *
 * 検索ボタン押下・結果確認の3メソッドは `IchiranMixin.js`（`createIchiranMixin`）にある。
 * 本モジュールはそれと併用する（役割が別）。
 */

const { I } = inject();
const assert = require('assert');
const { TIMEOUTS } = require('../../../support/tframe/constants');

/**
 * 日付入力欄に値を直接セットして change を発火する（datepicker / readonly を回避）。
 * @param {string} id - input の id（`#` なし）。画面に無ければ何もしない
 * @param {string} value - `YYYY-MM-DD`。空ならスキップ
 */
function setDateField(id, value) {
  if (!value) return;
  I.executeScript(({ fieldId, v }) => {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.value = v;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, { fieldId: id, v: value });
}

/**
 * 指定 id のセレクトを空値（「すべて」）へ戻して change を発火する。
 * サーバー側にセッション記憶された絞り込みをリセットし、検索結果を決定的にする用途。
 * 画面に存在しない id は無視される。
 * @param {string[]} ids - リセット対象セレクトの id 一覧（`#` なし）
 */
function resetSelects(ids) {
  I.executeScript((list) => {
    list.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = '';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }, ids);
}

/**
 * 検索結果テーブルに実データ行（tbody の空展開行を除く）が1件以上あることを確認する。
 * `IchiranMixin` の `verifyResultsExist` は thead の行にもマッチして空振り判定できないため、
 * 「実際に結果が返ったこと」を担保したい場合はこちらを使う。
 *
 * `clickSearchAndWait` は `.tf-group-body-search-result tr`（thead 行にマッチ）で待つため
 * AJAX の結果描画完了前に返ることがある。ここで最大 timeoutSec 秒ポーリングして取りこぼしを防ぐ。
 *
 * @param {string} screenLabel - I.say() に出す画面名
 * @param {number} [timeoutSec=15] - 実データ行が現れるまでの最大待機秒数
 */
async function verifyResultRowsExist(screenLabel, timeoutSec = 15) {
  I.say(`【${screenLabel}】検索結果に実データ行があることを確認`);
  const countRows = () => I.executeScript(() => {
    const table = document.querySelector('.tf-group-body-search-result table.tf-data-table-table');
    if (!table) return 0;
    return Array.from(table.querySelectorAll('tbody tr')).filter((tr) => tr.innerText.trim()).length;
  });
  let count = await countRows();
  for (let i = 0; i < timeoutSec && count === 0; i += 1) {
    I.wait(1);
    count = await countRows();
  }
  assert(count > 0, `検索結果に実データ行がありません（count=${count}）`);
}

/**
 * 検索フォームの条件をすべてクリアして検索範囲を最大にする（#225）。
 * - テキスト入力（readonly 以外）を空にする
 * - 「すべて」（空値）の選択肢を持つセレクトを空値にする
 * - エリア（`*_area_id`）→ 校舎（`*_branch_id`）の AJAX 連動は、エリアを先に空にして
 *   校舎リストの再描画を待ってから校舎を空にする
 * 同一ログインで複数ケースを回すとき、前ケースやセッション記憶の条件を持ち越さない用途。
 * 空値の選択肢が無いセレクト（必須の年月など）はそのまま残す。
 *
 * 注意: 日付入力欄も空になる。日付が入っている前提の画面（経理系の当月既定・連絡一覧の
 * 「どちらか一方は7日以内」制約など）では、呼んだ後に `setDateField` で日付を入れ直すこと。
 */
function resetSearchForm() {
  I.say('検索条件をクリア（プルダウンは「すべて」）');
  I.executeScript(() => {
    const form = document.querySelector('#swSearchButton').closest('form') || document;
    form.querySelectorAll('input[type="text"], input:not([type])').forEach((el) => {
      if (!el.readOnly) el.value = '';
    });
    form.querySelectorAll('select').forEach((sel) => {
      if (/_branch_id$/.test(sel.id)) return;
      if (!Array.from(sel.options).some((o) => o.value === '')) return;
      sel.value = '';
      if (/_area_id$/.test(sel.id)) sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
  I.wait(TIMEOUTS.AJAX_SELECT); // AJAX: エリア変更で校舎ドロップダウンを更新
  I.executeScript(() => {
    const form = document.querySelector('#swSearchButton').closest('form') || document;
    form.querySelectorAll('select[id$="_branch_id"]').forEach((sel) => {
      if (Array.from(sel.options).some((o) => o.value === '')) sel.value = '';
    });
  });
}

module.exports = { setDateField, resetSelects, verifyResultRowsExist, resetSearchForm };
