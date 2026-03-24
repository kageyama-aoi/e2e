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
 */
const TIMEOUTS = {
  SCREEN: 5,
  ELEMENT: 10,
  RESULT: 10,
  ENABLED: 15,
  TAB_SWITCH: 2
};

module.exports = { TIMEOUTS };
