Feature('Bing検索');

Scenario('CodeceptJSを検索して公式サイトが表示される', ({ I }) => {
  // .envファイルからBingのURLを読み込んでアクセスします
  I.amOnPage(process.env.BING_URL);
  // 検索ボックスが表示されるのを待ちます (セレクタはBing用に変更)
  I.waitForElement('#sb_form_q', 5);
  I.fillField('#sb_form_q', 'CodeceptJS');
  I.pressKey('Enter');
  I.waitForElement('a[href*="codecept.io"]', 5);
  I.seeElement('a[href*="codecept.io"]');
});