const { I } = inject();

module.exports = {
  // APIテストページへの遷移とパラメータ設定、API実行、トークン抽出を行うメソッド
  /**
   * APIテストページへ遷移し、パラメータを設定してAPIを実行、tcnTokenを抽出します。
   * @param {string} loginId - ログインID (例: 講師ID)
   * @param {string} password - パスワード
   * @param {string} smsGroup - SMSグループ (例: '講師')
   * @returns {Promise<string>} 抽出されたtcnToken
   */
  async performApiTestAndExtractToken(loginId, password, smsGroup) {
    I.say('APIテストページへ遷移します');
    I.click('管理者メニュー');
    I.see('JSON入力');
    I.click('ログイン');
    I.see('パーソンカテゴリ');

    I.say('API実行のパラメータを設定します');
    I.fillField('input[id="loginId"]', loginId);
    I.fillField('input[id="pwd"]', password);
    I.selectOption('select[id="smsgroup"]', smsGroup);

    I.say('APIを実行し、レスポンスからトークンを抽出します');
    I.click('実行');
    I.waitForText('レスポンス', 10);

    // <pre> タグに表示されたレスポンスJSONを取得します
    const responseSelector = 'pre';
    const responseText = await I.grabTextFrom(responseSelector);

    // 正規表現を使って "tcnToken" の値を抽出します
    const tokenMatch = responseText.match(/"tcnToken":\s*"([^"]+)"/);

    if (!tokenMatch || !tokenMatch[1]) {
      // 抽出に失敗した場合、スクリーンショットを保存してテストを失敗させます
      I.saveScreenshot('token_extraction_failed.png');
      // 失敗メッセージにレスポンス全体を含めるとトークンがログに残るため、メッセージを簡潔にします。
      I.fail(`レスポンスからtcnTokenを抽出できませんでした。詳細は'token_extraction_failed.png'を確認してください。`);
    }

    const tcnToken = tokenMatch[1];
    console.log('抽出したtcnToken:', secret(tcnToken)); // secret() でログをマスク

    return tcnToken;
  }
};