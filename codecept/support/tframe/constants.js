'use strict';

// tframe 画面の待機時間（秒）。マジックナンバーの直書き禁止（AGENTS.md）
const TIMEOUTS = {
  ELEMENT:     10,  // 通常の要素出現待ち（waitForElement の第2引数）
  AJAX_SELECT:  1,  // エリア→校舎などドロップダウン連動の AJAX 待ち
  AJAX_CODE:    2,  // 銀行コード→銀行名などコード入力の AJAX 補完待ち
  SAVE:         2,  // 保存レスポンス待ち（サーバーサイドバリデーション）
};

module.exports = { TIMEOUTS };
