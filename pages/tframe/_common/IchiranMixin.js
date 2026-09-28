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
     * 検索結果テーブルのヘッダーをクリックしてソートする。
     * tframe の一覧はヘッダー内 `<a class="sorting_a">` のクリックで並べ替わり、
     * 現在ソート中の列のリンクは `sorting_asc_a` / `sorting_desc_a` になる。
     * 1回クリックで昇順、目的が降順ならもう1回クリックする。
     *
     * @param {string} columnLabel - ヘッダーに表示されている列名（例: 'Id Number'）。空ならスキップ
     * @param {'asc'|'desc'} [direction='asc'] - 並び順
     */
    async sortByColumn(columnLabel, direction = 'asc') {
      if (!columnLabel) return;
      const dir = String(direction).toLowerCase() === 'desc' ? 'desc' : 'asc';
      I.say(`【${screenLabel}】"${columnLabel}" で ${dir} ソート`);

      const link = locate('.tf-group-body-search-result thead th a').withText(columnLabel);
      I.click(link);
      I.wait(2); // AJAX: ソート結果の再描画
      I.waitForElement('.tf-group-body-search-result tbody tr', 15);

      const klass = await I.grabAttributeFrom(link, 'class');
      const now = String(klass).includes('desc') ? 'desc' : 'asc';
      if (now !== dir) {
        I.click(link);
        I.wait(2);
        I.waitForElement('.tf-group-body-search-result tbody tr', 15);
      }
    },

    /**
     * 検索結果テーブル（1ページ目のみ）を `{列名: 値}` の配列として取得する。
     * ページ送りは対象外。
     *
     * @returns {Promise<Array<Object>>} 各行を列名キーのオブジェクトにしたもの
     */
    async grabResultRows() {
      I.say(`【${screenLabel}】検索結果を抽出`);
      return I.executeScript(() => {
        const table = document.querySelector('.tf-group-body-search-result table.tf-data-table-table');
        if (!table) return [];
        const headers = Array.from(table.querySelectorAll('thead th')).map((th) => th.innerText.trim());
        return Array.from(table.querySelectorAll('tbody tr'))
          .map((tr) => {
            const cells = Array.from(tr.cells).map((td) => td.innerText.trim().replace(/\s+/g, ' '));
            const row = {};
            headers.forEach((h, i) => { row[h || `col${i + 1}`] = cells[i] != null ? cells[i] : ''; });
            return row;
          })
          // tframe のデータテーブルは各レコードの後に空の展開行が入るため除外する
          .filter((row) => Object.values(row).some((v) => v !== ''));
      });
    },

  };
}

module.exports = createIchiranMixin;
