Feature('Google検索');

Scenario('CodeceptJSを検索して公式サイトが表示される', ({ I }) => {
  I.amOnPage('/');
  I.waitForElement('textarea[name="q"]', 5); // Googleの検索ボックスを待機
  I.fillField('textarea[name="q"]', 'CodeceptJS');
  I.pressKey('Enter');
  I.waitForElement('a[href*="codecept.io"]', 5);
  I.seeElement('a[href*="codecept.io"]');
});