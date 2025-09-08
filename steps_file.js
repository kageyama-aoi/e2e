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
    }

  });
}
