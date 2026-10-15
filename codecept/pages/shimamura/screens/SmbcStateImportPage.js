'use strict';

/**
 * 債権買取状態読込（買取保留/解除ファイル読込）画面の操作（#302 でテストから移動）。
 * 取込ファイルの日付書き換えはテストデータの準備なので、テスト側（smbc_state_import_test.js）に置く。
 */

const { I } = inject();
const { logScreenUrl } = require('../../../support/utils');
const { verifyValidationErrors, clickAndWaitForReload, acceptConfirmDialogs } = require('../../../support/shimamura/utils');
const { TIMEOUTS, SELECTORS, pageUrl } = require('../../../support/shimamura/constants');
const { formatDate } = require('../../../support/dateFormat');

// 取込成功時もエラーと同じ表示欄（#top_err_info_msg_div）に出る完了メッセージ（#265 で確認）
const IMPORT_DONE_MESSAGE = '買取保留・保留解除ファイルの取り込みが完了しました。';

module.exports = {

  locators: {
    fileInput:     'input[name="import_file1"]', // ファイル選択 (type="file")
    importBtn:     'input[name="save_button"]',  // 買取保留/解除ファイル読込ボタン（#import_btn）
    error:         SELECTORS.ERROR_CONTAINER,
    historyTopRow: '.listView tr:nth-child(2)', // 取込履歴の先頭行（1行目は見出し。取込日時の降順）
  },

  /**
   * 債権買取状態読込画面を URL で開きます。
   */
  async open() {
    I.say('【画面遷移】債権買取状態読込画面へ');
    I.amOnPage(pageUrl({ module: 'SmbcStateSummary', action: 'EWSMBCPurchaseStatusImport_AN' }));
    I.waitForElement(this.locators.fileInput, TIMEOUTS.SCREEN);
    await logScreenUrl(I, '債権買取状態読込');
  },

  /**
   * 取込履歴の先頭行のテキスト（行が無ければ空文字）
   * @returns {Promise<string>}
   */
  async grabHistoryTopRow() {
    return I.executeScript((sel) => {
      const row = document.querySelector(sel);
      return row ? row.innerText.replace(/\s+/g, ' ').trim() : '';
    }, this.locators.historyTopRow);
  },

  /**
   * ファイルを選んで「買取保留/解除ファイル読込」を押し、結果を確かめます。
   * - expectedErrors があれば、そのエラー文言が出ることを確かめる
   * - なければ完了メッセージだけが出て、取込履歴の先頭に今日の行が増えたことを確かめる
   * @param {string} filePath - 取り込むファイル（空ならファイルを選ばずに押す）
   * @param {string[]} [expectedErrors] - 期待するエラー文言
   * @throws {Error} 本日すでに取込済み（正常系は1日1回 #265）・完了メッセージが無い・取込履歴が増えない場合
   */
  async importFile(filePath, expectedErrors) {
    const L = this.locators;
    if (filePath) {
      I.say(`【ファイル選択】${filePath}`);
      I.attachFile(L.fileInput, filePath);
    } else {
      I.say('【ファイル選択】ファイルなし（スキップ）');
    }
    const topRowBefore = await this.grabHistoryTopRow();
    const today = formatDate(new Date(), 'YYYY-MM-DD');

    // データ作成年月日が取込済み「以前」だと弾かれ、時刻も見ないため、正常な取込は1日1回しかできない（#265）
    if (!expectedErrors?.length && topRowBefore.startsWith(today)) {
      throw new Error('【ファイル読込】本日はすでに取込済みのため、正常系は明日以降に再実行してください（1日1回しか取り込めない #265）'
        + `\n  取込履歴の先頭: ${topRowBefore}`);
    }

    I.say('【ファイル読込】ボタンをクリック');
    // 前日データ欠損時に確認ダイアログが出る場合があるため、押す前に OK で返すようにしておく
    await acceptConfirmDialogs(I);
    // ファイル選択欄は押す前から画面にあるため、それを待つと再描画前の画面で判定しうる（#243）。
    // 画面が読み込み直されるまで待つ
    await clickAndWaitForReload(I, L.importBtn);
    I.waitForElement(L.fileInput, TIMEOUTS.SCREEN);

    if (expectedErrors?.length > 0) {
      await verifyValidationErrors(I, expectedErrors, L.error);
      return;
    }
    // 成功時も表示欄に完了メッセージが出るため、「空であること」ではなく「完了メッセージだけであること」を確かめる
    const message = (await I.grabTextFromAll(L.error)).join(' ').trim();
    if (message !== IMPORT_DONE_MESSAGE) {
      throw new Error(`【ファイル読込】完了メッセージが出ていません: ${message || '（表示なし）'}`);
    }

    // エラーが無いだけでは取り込まれた証拠にならない。取込履歴の先頭に今日の行が増えたことを確かめる
    const topRowAfter = await this.grabHistoryTopRow();
    if (topRowAfter === topRowBefore || !topRowAfter.startsWith(today)) {
      throw new Error(`【ファイル読込】取込履歴に今回の行がありません（取込されていない）\n  前: ${topRowBefore}\n  後: ${topRowAfter}`);
    }
    I.say(`【ファイル読込】取込完了（取込履歴: ${topRowAfter}）`);
    await logScreenUrl(I, '債権買取状態読込_取込後');
  },
};
