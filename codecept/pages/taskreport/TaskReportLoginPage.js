/**
 * @fileoverview Taskreport ログインページ Page Object
 */

const { I } = inject();

module.exports = {
  /** ログインページの各入力要素セレクタ */
  locators: {
    usernameField: 'input[name="username"]',
    passwordField: 'input[name="password"]',
    loginButton: 'button[type="submit"]',
  },

  /**
   * Taskreportのログインページにアクセスする
   */
  visit() {
    I.say('Taskreportのログインページにアクセスします...');
    I.amOnPage(process.env.LOGIN_TASKREPORT_URL);
    I.waitForElement('input[name="bugsearch"]', 5);
  },

  /**
   * バグ一覧テーブルを2次元配列として取得する
   * ヘッダー行と全データ行を含む配列を返す。"Until" 以降の列名と "Title" の次の列名を正規化する。
   * @returns {Promise.<Array.<Array.<string>>>} ヘッダー行を先頭とする2次元配列
   */
  async grabBugTable2D() {
    return await I.executeScript(() => {
      const headerTr = document.querySelector('tr.bugTitle');
      if (!headerTr) return [];

      const table = headerTr.closest('table');
      if (!table) return [];

      let header = [...headerTr.querySelectorAll('th, td')]
        .map(c => c.textContent.trim());

      const untilIdx = header.indexOf('Until');
      if (untilIdx !== -1 && header.length >= untilIdx + 3) {
        header.splice(untilIdx + 1, 2, 'School', 'Speed');
      }

      const titleIdx = header.indexOf('Title');
      if (titleIdx !== -1 && titleIdx + 1 < header.length) {
        header[titleIdx + 1] = 'Status';
      }

      const allTrs = [...table.querySelectorAll('tr')];
      const startIdx = allTrs.indexOf(headerTr);
      const dataRows = allTrs
        .slice(startIdx + 1)
        .map(tr => [...tr.cells].map(td => td.textContent.trim()));

      return [header, ...dataRows];
    });
  },
};
