/**
 * しまむらテスト専用ユーティリティ
 */

/**
 * サイドメニューのトグルグループを開閉する
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} options - オプション
 * @param {string} options.icon_id - トグルアイコンのID
 * @param {string} options.menuname - メニュー名
 */
async function toggleGroupmenu(I, { icon_id, menuname }) {
  const display = await I.grabCssPropertyFrom(`#${icon_id}`, 'display');

  if (display === 'none') {
    I.click(locate('span').withText(menuname));
    I.say(`✅ サブメニューグループ：${menuname}「＋」ボタンが表示中なのでリンクを押下`);
  } else {
    I.say(`⚠️ サブメニューグループ：${menuname}「-」ボタンなのでスキップ`);
  }
}

/**
 * URLの変化を監視し、ターゲットが含まれるようになったら指定要素をクリックする
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {number} maxTries - 最大試行回数
 * @param {string} targetValue - URLに含まれるべき文字列
 * @param {string|Object} clickElement - クリックする要素
 */
async function verifyNavigationByUrlChange(I, maxTries, targetValue, clickElement) {
  for (let i = 0; i < maxTries; i++) {
    const currentUrl = await I.grabCurrentUrl();

    if (currentUrl.includes(targetValue)) {
      I.say(`✅ URLに '${targetValue}' を検出（${i + 1}回目）`);
      I.click(clickElement);
      break;
    } else {
      I.say(`⏳ 該当なし（${i + 1}回目）... 1秒待機`);
      I.wait(1);
    }

    if (i === maxTries - 1) {
      throw new Error(`❌ URLに '${targetValue}' が含まれませんでした（${maxTries}回試行）`);
    }
  }
}

module.exports = {
  toggleGroupmenu,
  verifyNavigationByUrlChange,
};
