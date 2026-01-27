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

module.exports = {
  toggleGroupmenu,
};
