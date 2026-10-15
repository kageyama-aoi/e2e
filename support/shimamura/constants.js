/**
 * しまむらテスト共通定数
 */

/**
 * 待機時間（秒）の定数
 * - SCREEN: 画面タイトルの出現待ち
 * - ELEMENT: 通常の要素出現待ち
 * - RESULT: 検索結果の表示待ち
 * - ENABLED: 入力可能になるまでの待ち
 * - TAB_SWITCH: タブ切り替え後の安定待ち
 * - AJAX_DEBOUNCE: 郵便番号/銀行コード等のAJAX自動補完・選択後の反映待ち（標準）
 * - AJAX_DEBOUNCE_SHORT: 軽量なAJAX補完待ち
 */
const TIMEOUTS = {
  SCREEN: 5,
  ELEMENT: 10,
  RESULT: 10,
  ENABLED: 15,
  TAB_SWITCH: 2,
  AJAX_DEBOUNCE: 1,
  AJAX_DEBOUNCE_SHORT: 0.5
};

/**
 * テスト対象のベース URL（末尾スラッシュ付きに正規化）
 * env の BASE_URL は「https://example.com/testgcp」のように末尾スラッシュなしで書かれるため、
 * 各 FlowPage で `BASE_URL + 'index.php?...'` と連結できるようここで1回だけ整える。
 * `process.env.BASE_URL + '/index.php?...'` のような別流儀を各ファイルに書かない。
 */
const BASE_URL = (process.env.BASE_URL || '').replace(/\/?$/, '/');

/**
 * 画面の URL（`<BASE_URL>index.php?module=…&action=…&…`）を組み立てる。
 * 各ファイルで `${BASE_URL}index.php?module=X&action=Y&record=${id}` と手書きしない（#300）。
 * sideMenus.js のメニュー定義や画面から読んだ href のように、すでに相対パスとして持っている値は
 * これまで通り `BASE_URL + path` でつなぐ。
 * 値は URLSearchParams で符号化し、引数に書いた順に並ぶ。
 * @param {{module: string, action: string} & Object<string, (string|number)>} params
 * @returns {string}
 * @example pageUrl({ module: 'Student', action: 'DetailView', record: id })
 */
function pageUrl({ module, action, ...params }) {
  return `${BASE_URL}index.php?${new URLSearchParams({ module, action, ...params })}`;
}

const URLS = {
  CONTACT_REGISTER: 'index.php?module=Student&action=EditView'
    + '&contact_status=5&return_module=Student&return_action=DetailView&from_mainmenu=true',
};

/**
 * 全画面共通で使われるセレクタ（画面固有ではないもののみ）
 * - ERROR_CONTAINER: バリデーションエラー等を表示するコンテナ（ほぼ全画面共通）
 * - RESULT_LINK: 検索結果一覧のリンク（一覧画面共通）
 *
 * 画面固有のセレクタ（フォームフィールド等）は各 Flow Page のローカル定義のままでよい。
 * ここに追加するのは「複数ファイルで同じ値が重複している」ことを確認できたものに限る。
 */
const SELECTORS = {
  ERROR_CONTAINER: '#top_err_info_msg_div',
  RESULT_LINK: '.listViewTdLinkS1',
};

module.exports = { TIMEOUTS, BASE_URL, URLS, SELECTORS, pageUrl };
