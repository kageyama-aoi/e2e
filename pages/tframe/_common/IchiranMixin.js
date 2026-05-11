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
  };
}

module.exports = createIchiranMixin;
