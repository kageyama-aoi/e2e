Feature('Bing検索');

Scenario('CodeceptJSを検索して公式サイトが表示される', ({ I }) => {
  I.amOnPage('https://www.bing.com');
  I.waitForElement('input[type="search"]', 5); // 検索ボックスを待機
  I.fillField('input[type="search"]', 'CodeceptJS');
  I.pressKey('Enter');
  I.waitForElement('a[href*="codecept.io"]', 5);
  I.seeElement('a[href*="codecept.io"]');
});