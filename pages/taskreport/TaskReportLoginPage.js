const { I } = inject();

module.exports = {
  locators: {
    usernameField: 'input[name="username"]',
    passwordField: 'input[name="password"]',
    loginButton: 'button[type="submit"]',
  },

  /**
   * ログインページにアクセスします
   */
  visit() {
    I.say('Taskreportのログインページにアクセスします...');
    I.amOnPage(process.env.LOGIN_TASKREPORT_URL);
    I.waitForElement('input[name="bugsearch"]', 5);
    
  }
  ,
  // ▼ ページ操作関数
  async grabBugTable2D() {
    return await I.executeScript(() => {
      const headerTr = document.querySelector('tr.bugTitle');
      if (!headerTr) return [];

      const table = headerTr.closest('table');
      if (!table) return [];

      // --- ヘッダーを取得
      let header = [...headerTr.querySelectorAll('th, td')]
        .map(c => c.textContent.trim());

      // --- 「Until」以降の2つを差し替え
      const untilIdx = header.indexOf('Until');
      if (untilIdx !== -1 && header.length >= untilIdx + 3) {
        header.splice(untilIdx + 1, 2, 'School', 'Speed');
      }

      // --- 「Title」の次の項目を "Status" に変換
      const titleIdx = header.indexOf('Title');
      if (titleIdx !== -1 && titleIdx + 1 < header.length) {
        header[titleIdx + 1] = 'Status';
      }
      // --- データ行を抽出
      const allTrs = [...table.querySelectorAll('tr')];
      const startIdx = allTrs.indexOf(headerTr);
      const dataRows = allTrs
        .slice(startIdx + 1)
        .map(tr => [...tr.cells].map(td => td.textContent.trim()));

      return [header, ...dataRows];
    });

    
  },


};
