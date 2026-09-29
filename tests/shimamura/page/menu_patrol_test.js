/**
 * @fileoverview shimamura メニュー巡回テスト（#251 Phase 1）
 *
 * **テスト内容**
 * - `pages/shimamura/_common/menuSnapshot/testgcp.json` の全メニュー項目を、アイコンごとに
 *   「アイコン画面 → （折りたたみ展開）→ サイドバーのリンク押下」で開き、
 *   画面エラー・PHP エラーが出ないことを確認してスクリーンショットを残す
 * - 1画面の失敗で止めず、アイコン内の全項目を回ってから失敗をまとめて報告する
 * - 各画面が「標準一覧」形式（input[name="search"] あり）かを `output/shimamura_menu_patrol/<icon>.json` に記録する
 *
 * **実行例**（日本語 --grep は化けるため英字タグで絞る）
 * - 全アイコン: `npx codeceptjs run tests/shimamura/page/menu_patrol_test.js --profile shimamura.testgcp`
 * - 1アイコン: `... --grep @patrol_Student`
 *
 * **注意**
 * - 画面を開くだけで、登録・実行ボタンは押さない（データ変更なし）
 */
const fs = require('fs');
const path = require('path');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const menuPatrolPage = require('../../../pages/shimamura/_common/MenuPatrolPage');

const OUT_DIR = path.resolve(__dirname, '../../../output/shimamura_menu_patrol');

Feature('メニュー巡回');

Before(beforeShimamura);

for (const icon of menuPatrolPage.listPatrolIcons()) {
  const tagE = menuPatrolPage.BUCKET_E_ICONS.includes(icon.iconKey) ? ' @bucketE' : '';
  Scenario(`${icon.iconLabel} の全メニューを開ける @patrol @patrol_${icon.iconKey}${tagE}`, async ({ I, menuPatrolPageShimamura }) => {
    const results = [];
    const failures = [];

    for (const item of icon.items) {
      try {
        menuPatrolPageShimamura.openIcon(icon.iconRoute);
        await menuPatrolPageShimamura.clickSidebarItem(item);
        const { url, standardList } = await menuPatrolPageShimamura.verifyOpened(item);
        await I.saveScreenshotWithTimestamp(`patrol_${icon.iconKey}_${item.label}.png`.replace(/[\\/:*?"<>|\s]/g, '_'));
        results.push({ group: item.group, label: item.label, route: item.route, ok: true, standardList, url });
      } catch (err) {
        const message = String(err.message || err).split('\n')[0];
        I.say(`  ✗ ${item.label}: ${message}`);
        failures.push(`${item.group} > ${item.label}: ${message}`);
        results.push({ group: item.group, label: item.label, route: item.route, ok: false, error: message });
      }
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, `${icon.iconKey}.json`), `${JSON.stringify(results, null, 2)}\n`, 'utf8');
    I.say(`【巡回結果】${icon.iconLabel}: ${results.length - failures.length}/${results.length} 件 OK`);

    if (failures.length) {
      throw new Error(`${icon.iconLabel}: ${failures.length} 件開けませんでした\n${failures.join('\n')}`);
    }
  });
}
