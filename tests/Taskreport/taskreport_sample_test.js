const fs = require('fs');
const path = require('path');

Feature('Taskreport 機能');

Scenario('サンプルテスト: ログイン画面を開く', async ({ I, taskReportLoginPage }) => {
  // .env.taskreport ファイルに定義したURLへ遷移します
  I.amOnPage(process.env.BASE_URL);
  
  // ページオブジェクトのメソッドを呼び出します
  taskReportLoginPage.visit();

  // TestWait();

  
  I.fillField('bugsearch','shima28s');
  I.wait(3);
  I.click('>');
  I.wait(3);

  I.say('ページを開いてテーブルを解析します');
  
  const table2D = await taskReportLoginPage.grabBugTable2D();

  // 出力確認
  I.say(`抽出行数: ${table2D.length}`);
  console.log(JSON.stringify(table2D, null, 2));

  const outDir = path.join(__dirname, 'output');
  const outPath = path.join(outDir, 'table2d.json');

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ table2D }, null, 2), 'utf8');

  I.say(`saved: ${outPath}`);

  pause();


    await I.saveScreenshotWithTimestamp('TASKREPORT_Login_Page.png');
    await I.say('--- TR情報抽出_正常終了 ---');

  /**
 * getTableRowsData
 * テーブル内の<tr>をすべて取得し、その配下の<td>テキストを2次元配列で返す
 *
 * @param {CodeceptJS.I} I - CodeceptJS の I オブジェクト
 * @param {string} selector - <tr> の親要素（例: 'table' または 'table tbody'）
 * @returns {Promise<string[][]>} - 例: [['りんご','100'], ['みかん','80']]
 */
async function getTableRowsData(selector) {
  // すべての<tr>を取得
  const rows = await I.grabNumberOfVisibleElements(`${selector} tr`);
  const data = [];

  for (let i = 1; i <= rows; i++) {
    // 各<tr>配下の<td>要素を取得
    const cells = await I.grabTextFromAll(`${selector} tr:nth-child(${i}) td`);
    data.push(cells);
  }

  return data;
}


});
