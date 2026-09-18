/**
 * @fileoverview tframe のソート可能データテーブル操作（一覧画面・画面内の付随一覧 共通）
 *
 * tframe のデータテーブルは画面・パネルが違っても内部構造が共通（#225 で実機確認）:
 * - 見出し `<th id="swDataList[列キー]">` 内の `<a data-sort>` をクリックでソート。
 *   クラスは 未ソート=`sorting_a` / 昇順=`sorting_asc_a` / 降順=`sorting_desc_a`
 * - 行 `<tr id="swDataList_S_rowsOrder_<レコードID>">`、セル `<td id="swDataList[列キー_td][<レコードID>]">`
 * - 違うのは表を囲む枠だけ。一覧画面は `.tf-group-body-search-result`、
 *   詳細画面のタブ内一覧は `div[id="studentSubpanel[swDataList]"]` のようにパネル名が付く。
 *   1画面に同じ id の表が複数あり得るので、操作は必ず枠（container）で絞り込む。
 *
 * Page Object で `createSortableTable({...})` を定義し、テストは
 * `support/tframe/sortTestRunner.js` の `runSortCases` に渡して使う。
 */

const { I } = inject();

/** 一覧画面（SW）の検索結果テーブルを囲む枠 */
const LIST_CONTAINER = '.tf-group-body-search-result';
const ROW_PREFIX = 'swDataList_S_rowsOrder_';

/**
 * 詳細画面などのタブ内一覧（サブパネル）の枠セレクタを返す
 * @param {string} panelName - パネル名（例: 'studentSubpanel'）
 * @returns {string}
 */
function subpanelContainer(panelName) {
  return `div[id="${panelName}[swDataList]"]`;
}

/**
 * ソート可能テーブルの操作オブジェクトを作る
 *
 * @param {object} def
 * @param {string} def.label     - ログ表示名（例: 'コース一覧'）
 * @param {string} def.container - 表を囲む枠のセレクタ（LIST_CONTAINER / subpanelContainer(...)）
 * @param {Object<string, string>} def.columns - ソート可能列キー → 型（sortVerify.js 参照）
 * @param {({key: string, type: string, dir: string}|null)} def.secondary - 第2キー（第2キーの無い画面は null）
 * @returns {object} label / container / sortSpec と sortBy / grabRows / grabSortableKeys / waitForRows
 */
function createSortableTable({ label, container, columns, secondary }) {
  const headerLink = (key) => `${container} thead th[id="swDataList[${key}]"] a`;
  const dataRow = `${container} tbody tr[id^="${ROW_PREFIX}"]`;

  return {
    label,
    container,
    sortSpec: { columns, secondary },

    /**
     * 列キーでソート状態を指定方向にする（見出し文言に依存しないため日英どちらでも動く）。
     * クリックごとに 未ソート→昇順、昇順→降順、降順→昇順 と切り替わる。
     * @param {string} key - 列キー
     * @param {'asc'|'desc'} [direction='asc']
     */
    async sortBy(key, direction = 'asc') {
      const dir = String(direction).toLowerCase() === 'desc' ? 'desc' : 'asc';
      I.say(`【${label}】列 "${key}" を ${dir} ソート`);

      // 最大2クリック（未ソート→昇順→降順）。クリック後の状態も判定するため3回ループする
      for (let i = 0; i < 3; i++) {
        const klass = String(await I.grabAttributeFrom(headerLink(key), 'class'));
        if (klass === `sorting_${dir}_a`) return;
        if (i === 2) break;
        const next = klass === 'sorting_asc_a' ? 'desc' : 'asc';
        I.click(headerLink(key));
        // 表は AJAX で丸ごと再描画される。見出しクラスの切替を描画完了の合図にする
        I.waitForElement(`${headerLink(key)}.sorting_${next}_a`, 15);
      }
      throw new Error(`【${label}】列 "${key}" を ${dir} ソート状態にできませんでした`);
    },

    /**
     * 表示中の行（1ページ目のみ）を `{列キー: 値, _recordId: レコードID}` の配列で取得する
     * @returns {Promise<Array<Object>>}
     */
    async grabRows() {
      return I.executeScript(({ sel, prefix }) =>
        Array.from(document.querySelectorAll(sel)).map((tr) => {
          const row = { _recordId: tr.id.slice(prefix.length) };
          Array.from(tr.cells).forEach((td) => {
            const m = /^swDataList\[(.+)_td\]\[/.exec(td.id);
            if (m) row[m[1]] = td.innerText.trim().replace(/\s+/g, ' ');
          });
          return row;
        }), { sel: dataRow, prefix: ROW_PREFIX });
    },

    /**
     * 見出しにソートリンクがある列のキー一覧を取得する
     * @returns {Promise<Array<string>>}
     */
    async grabSortableKeys() {
      return I.executeScript((sel) =>
        Array.from(document.querySelectorAll(`${sel} thead th`))
          .filter((th) => th.querySelector('a[data-sort]'))
          .map((th) => th.id.replace(/^swDataList\[(.*)\]$/, '$1')), container);
    },

    /**
     * データ行が描画されるまで最大 timeoutSec 秒待ち、行数を返す（0件でも例外にしない）
     * @param {number} [timeoutSec=15]
     * @returns {Promise<number>}
     */
    async waitForRows(timeoutSec = 15) {
      I.waitForElement(`${container} thead`, timeoutSec);
      const count = () => I.executeScript((sel) => document.querySelectorAll(sel).length, dataRow);
      let n = await count();
      for (let i = 0; i < timeoutSec && n === 0; i++) {
        I.wait(1);
        n = await count();
      }
      return n;
    },
  };
}

module.exports = { createSortableTable, subpanelContainer, LIST_CONTAINER };
