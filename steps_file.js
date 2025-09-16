// in this file you can append custom step methods to 'I' object

module.exports = function() {
  return actor({

    // Define custom steps here, use 'this' to access default methods of I.
    // It is recommended to place a general 'login' function here.

    /**
     * ファイル名にタイムスタンプを付与してスクリーンショットを保存します。
     * @param {string} fileName - 保存するスクリーンショットのベースファイル名 (例: 'my_screenshot.png')
     */
    saveScreenshotWithTimestamp(fileName) {
      // ファイル名を拡張子の前で分割します
      const parts = fileName.split('.');
      const ext = parts.pop() || 'png';
      const name = parts.join('.');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.saveScreenshot(`${name}_${timestamp}.${ext}`);
    },

    /**
     * 指定された要素からテキストを取得し、JSONオブジェクトとして解析して返します。
     * @param {string} selector - テキストを取得する要素のCSSセレクターまたはXPath。
     * @returns {Promise<object>} パースされたJSONオブジェクト。
     */
    async grabAndParseJsonFrom(selector) {
      const text = await this.grabTextFrom(selector);
      try {
        return JSON.parse(text);
      } catch (e) {
        this.fail(`要素'${selector}'から取得したテキストのJSONパースに失敗しました。テキスト: "${text}"`);
      }
    },

    /**
     * 指定された要素が表示されている場合のみクリックします。
     * Cookieバナーの同意ボタンなど、表示が不確定な要素の操作に便利です。
     * @param {string} selector - クリック対象の要素のセレクター。
     * @param {number} [timeout=2] - 要素の存在を待つ最大秒数（デフォルトは2秒）。
     */
    async acceptCookiesIfVisible(selector, timeout = 2) {
      // 指定時間内に要素がいくつ表示されるか確認
      const numVisible = await this.grabNumberOfVisibleElements(selector, timeout);
      if (numVisible > 0) {
        this.say(`要素'${selector}'が見つかったため、クリックします。`);
        this.click(selector);
      } else {
        this.say(`要素'${selector}'は見つかりませんでした。処理をスキップします。`);
      }
    },

    /**
     * JavaScriptを使って要素を強制的にクリックします。
     * 通常のclickが機能しない場合に利用します。
     * @param {string} selector - クリック対象の要素のセレクター。
     */
    forceClick(selector) {
      this.executeScript((elSelector) => {
        const el = document.querySelector(elSelector);
        if (el) el.click();
      }, selector);
    },
    

    

  });
}


