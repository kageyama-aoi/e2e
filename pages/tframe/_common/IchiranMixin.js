/**
 * @fileoverview tframe 一覧検索共通 Mixin
 *
 * 全 tframe 一覧画面が共有する検索ボタン操作・結果確認の3メソッドを提供する。
 * 各 Page Object で `...createIchiranMixin('画面名')` として展開して使用する。
 *
 * @param {string} screenLabel - I.say() に表示する画面名（例: '講師一覧'）
 * @returns {object} clickSearchAndWait / verifyResultsExist / verifyRecordInResults を持つオブジェクト
 */

const { I } = inject();

function createIchiranMixin(screenLabel) {
  return {
    /**
     * 検索ボタンをクリックし、結果行が表示されるまで待つ
     */
    clickSearchAndWait() {
      I.say(`【${screenLabel}】検索ボタンをクリック`);
      I.click('#swSearchButton');
      I.waitForElement('.tf-group-body-search-result tr', 15);
    },

    /**
     * 検索結果エリアに1件以上の行があることを確認する
     */
    verifyResultsExist() {
      I.say(`【${screenLabel}】検索結果が表示されることを確認`);
      I.seeElement('.tf-group-body-search-result tr');
    },

    /**
     * 検索結果エリアに指定テキストが表示されることを確認する
     * @param {string} expectedName - 結果一覧に表示されるべき文字列
     */
    verifyRecordInResults(expectedName) {
      I.say(`【${screenLabel}】"${expectedName}" が結果に表示されることを確認`);
      I.see(expectedName, '.tf-group-body-search-result');
    },

    /**
     * 列キー（`<th id="swDataList[キー]">` のキー部分）でソート状態を指定方向にする（#223）。
     * 見出し文言に依存しないため日英どちらの表示でも動く。
     * 見出しリンクのクラスは 未ソート=`sorting_a` / 昇順=`sorting_asc_a` / 降順=`sorting_desc_a` で、
     * クリックごとに 未ソート→昇順、昇順→降順、降順→昇順 と切り替わる。
     *
     * @param {string} key - 列キー（例: 'name', 'nendo'）
     * @param {'asc'|'desc'} [direction='asc'] - 並び順
     */
    async sortByColumnKey(key, direction = 'asc') {
      const dir = String(direction).toLowerCase() === 'desc' ? 'desc' : 'asc';
      const link = `.tf-group-body-search-result thead th[id="swDataList[${key}]"] a`;
      I.say(`【${screenLabel}】列 "${key}" を ${dir} ソート`);

      // 最大2クリック（未ソート→昇順→降順）。クリック後の状態も判定するため3回ループする
      for (let i = 0; i < 3; i++) {
        const klass = String(await I.grabAttributeFrom(link, 'class'));
        if (klass === `sorting_${dir}_a`) return;
        if (i === 2) break;
        const next = klass === 'sorting_asc_a' ? 'desc' : 'asc';
        I.click(link);
        // 一覧は AJAX で丸ごと再描画される。見出しクラスの切替を描画完了の合図にする
        I.waitForElement(`.tf-group-body-search-result thead th[id="swDataList[${key}]"] a.sorting_${next}_a`, 15);
        I.waitForElement('.tf-group-body-search-result tbody tr[id^="swDataList_S_rowsOrder_"]', 15);
      }
      throw new Error(`【${screenLabel}】列 "${key}" を ${dir} ソート状態にできませんでした`);
    },

    /**
     * 見出しにソートリンクがある列のキー一覧を画面から取得する（#223）
     * @returns {Promise<Array<string>>} 列キーの配列（表示順）
     */
    async grabSortableColumnKeys() {
      return I.executeScript(() =>
        Array.from(document.querySelectorAll('.tf-group-body-search-result thead th'))
          .filter((th) => th.querySelector('a[data-sort]'))
          .map((th) => th.id.replace(/^swDataList\[(.*)\]$/, '$1'))
      );
    },

    /**
     * 検索結果（1ページ目のみ）を `{列キー: 値, _recordId: レコードID}` の配列で取得する（#223）。
     * セルの id `swDataList[<キー>_td][<レコードID>]` から列キーを取るため表示言語に依存しない。
     *
     * @returns {Promise<Array<Object>>}
     */
    async grabResultRowsByKey() {
      return I.executeScript(() => {
        const prefix = 'swDataList_S_rowsOrder_';
        return Array.from(document.querySelectorAll(`.tf-group-body-search-result tbody tr[id^="${prefix}"]`))
          .map((tr) => {
            const row = { _recordId: tr.id.slice(prefix.length) };
            Array.from(tr.cells).forEach((td) => {
              const m = /^swDataList\[(.+)_td\]\[/.exec(td.id);
              if (m) row[m[1]] = td.innerText.trim().replace(/\s+/g, ' ');
            });
            return row;
          });
      });
    },
  };
}

module.exports = createIchiranMixin;
