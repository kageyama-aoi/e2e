// steps_file.js
// in this file you can append custom step methods to 'I' object

module.exports = function() {
  return actor({

    /**
     * ファイル名にタイムスタンプを付与してスクリーンショットを保存します。
     * @param {string} fileName - 例: 'my_screenshot.png'（拡張子省略時は png）
     */
    saveScreenshotWithTimestamp(fileName = 'screenshot.png') {
      const parts = String(fileName).split('.');
      const ext = (parts.length > 1 ? parts.pop() : 'png') || 'png';
      const name = parts.join('.') || 'screenshot';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.saveScreenshot(`${name}_${timestamp}.${ext}`);
    },

    /**
     * 指定要素のテキストを取得し、JSONとしてパースして返す。
     * コードフェンスや&nbsp;等のノイズをある程度除去してからパースします。
     * @param {string|CodeceptJS.Locator} selector
     * @returns {Promise<object>}
     */
    async grabAndParseJsonFrom(selector) {
      const raw = await this.grabTextFrom(selector);
      // ```json ～ ``` / 余計なノンブレークスペース / 先頭・末尾のノイズを除去
      const text = String(raw)
        .replace(/^\s*```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .replace(/\u00A0/g, ' ')
        .trim();

      try {
        return JSON.parse(text);
      } catch (e) {
        this.saveScreenshotWithTimestamp('json_parse_error.png');
        this.fail(
          `要素 '${selector}' のJSONパースに失敗しました。\n--- 取得テキスト ---\n${text}\n--------------------`
        );
      }
    },

    /**
     * 指定要素が見えていればクリック（見えなければスキップ）。
     * @param {string|CodeceptJS.Locator} selector
     * @param {number} [timeoutSec=2] ポーリング上限（秒）
     */
    async acceptCookiesIfVisible(selector, timeoutSec = 2) {
      const deadline = Date.now() + timeoutSec * 1000;
      let visible = 0;

      while (Date.now() < deadline) {
        visible = await this.grabNumberOfVisibleElements(selector);
        if (visible > 0) break;
        await this.wait(0.2); // 200ms間隔で軽くポーリング
      }

      if (visible > 0) {
        this.say(`要素 '${selector}' が見つかったためクリックします。`);
        // 軽いリトライをかけてクリックの成功率を上げる
        await this.retry({ retries: 2, minTimeout: 200 }).click(selector);
      } else {
        this.say(`要素 '${selector}' は見つからず、クリックをスキップします。`);
      }
    },

    /**
     * JSで強制クリック（通常のclickが効かない時の最終手段）。
     * Shadow DOM / iframe には未対応。必要なら個別対応してください。
     * @param {string} selector
     */
    async forceClick(selector) {
      const ok = await this.executeScript((sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        try {
          el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
        } catch (_) { /* older browsers */ }
        const evt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
        return el.dispatchEvent(evt);
      }, selector);

      if (!ok) this.say(`forceClick: '${selector}' が見つからないか、クリックできませんでした。`);
    },

    /**
     * よく使う「待って→クリア→入力」の合わせ技。
     * @param {string|CodeceptJS.Locator} selector
     * @param {string} value
     * @param {number} [timeoutSec=5]
     */
    async waitAndFill(selector, value, timeoutSec = 5) {
      await this.waitForElement(selector, timeoutSec);
      // clearField は Playwright/Puppeteer/WebDriver で利用可能
      await this.clearField(selector);
      await this.fillField(selector, value);
    },

    /**
     * 指定された要素が画面内に表示されるようにスクロールします。
     * @param {string|CodeceptJS.Locator} selector - スクロール対象の要素のセレクタ
     */
    async scrollIntoView(selector) {
      await this.executeScript((sel) => {
        // PlaywrightではCSSセレクタのみが渡されるため、複雑なロケータは使えない点に注意
        const el = document.querySelector(sel);
        if (el) {
          el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
        }
      }, selector);
      this.say(`Scrolled to element ${selector}`);
    },

    /**
     * outputディレクトリにリクエストとレスポンスを含むログファイルを保存します。
     * @param {string} fileName - 保存するファイル名
     * @param {string} responseContent - 保存するレスポンス内容
     * @param {object|string} [requestContent=null] - 保存するリクエスト内容
     */
    async saveLogToFile(fileName, responseContent, requestContent = null) {
      const fs = require('fs');
      const path = require('path');
      // codecept.conf.js から output ディレクトリのパスを取得
      const outputDir = require('./codecept.conf.js').config.output;
      const filePath = path.join(outputDir, fileName);

      let logContent = `--- Log created at: ${new Date().toISOString()} ---\n\n`;

      if (requestContent) {
        logContent += '--- REQUEST ---\n';
        if (typeof requestContent === 'object') {
          logContent += JSON.stringify(requestContent, null, 2);
        } else {
          logContent += requestContent;
        }
        logContent += '\n\n';
      }

      logContent += '--- RESPONSE ---\n';
      logContent += responseContent;
      logContent += '\n';

      try {
        fs.writeFileSync(filePath, logContent);
        this.say(`${fileName} を ${outputDir} ディレクトリに保存しました。`);
      } catch (e) {
        this.say(`${fileName} の保存中にエラーが発生しました: ${e.message}`);
      }
    },

  });
}
