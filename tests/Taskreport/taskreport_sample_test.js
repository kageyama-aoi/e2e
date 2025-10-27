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
  I.say(`抽出された行数: ${table2D.length}`);
  console.log(JSON.stringify(table2D, null, 2));

  // 例: ヘッダーに School と Title が含まれるかチェック
  I.assert(table2D[0].includes('School'));
  I.assert(table2D[0].includes('Title'));

  pause();
  // I.see('ログイン'); // 仮のアサーション
  async function TestWait(){
    selector = 'tbody';
    const rows_b = await I.grabNumberOfVisibleElements(`${selector} tr`);
    I.wait(5);
    await console.log('前提行数:' + rows_b);
    I.fillField('bugsearch','shima28s');
    await I.click('>');
    I.wait(5);

    await I.waitForElement('shima28s',5);

    pause();

    const rows = await I.grabNumberOfVisibleElements(`${selector} tr`);
    console.log('判定行数:' + rows);
    // const data = [];
    // const allRows = await getTableRowsData('table');
    const allRows = await getTableRowsData(I, 'table tr.clickable');
    console.log('検索結果:' + allRows);
   
    pause();
    await I.saveScreenshotWithTimestamp('TASKREPORT_Login_Page.png');

    await I.say('--- サンプルテスト正常終了 ---');

  }



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
