'use strict';

/**
 * shimamura コースのフォーム送信登録（createShimaCourseBySubmit）動作確認ランナー #234
 *
 * このファイルは通常のテストスイートには含まれない（`_test.js` 非末尾）。
 * 同じ内容のコースを UI 版（createShimaCourse）とフォーム送信版（createShimaCourseBySubmit）で
 * 1件ずつ作り、所要時間と保存内容を比べる。実行すると testgcp にコースが2件増える。
 *
 * 実行例:
 *   npx codeceptjs run ./tests/shimamura/util/create_course_by_submit_check.js --profile shimamura.testgcp
 *
 * 確認すること:
 * - フォーム送信版で record UUID が返ること（＝サーバーが保存したこと）
 * - 詳細画面に、送ったコース名・カテゴリ・運営管理費が表示されていること（UI 版と同じ見え方か）
 * - UI 版との所要時間の差（ログの ms を控える）
 */

const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { BASE_URL } = require('../../../support/shimamura/constants');
const {
  createShimaCourse,
  createShimaCourseBySubmit,
} = require('../../../pages/shimamura/flow/CourseClassSetupFlowPage');

Feature('shimamura コースのフォーム送信登録（動作確認）');

Before(beforeShimamura);

Scenario('コースを UI 版とフォーム送信版で1件ずつ作り、所要時間と保存内容を比べる', async ({ I }) => {
  // コースコードは maxlength=10。月日時分秒で一意にし、UI 版とフォーム送信版は末尾で見分ける。
  const now = new Date();
  const stamp = [now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((n) => String(n).padStart(2, '0')).join('').slice(2); // DDHHMMSS（8桁）
  const common = { courseCategory: 'スクール', kanrihi: 1200 };

  const uiStartedAt = Date.now();
  const uiRecordId = await createShimaCourse(I, {
    ...common, courseCd: `U${stamp}`, courseName: `E2E_UI版_${stamp}`,
  });
  const uiMs = Date.now() - uiStartedAt;

  const submitStartedAt = Date.now();
  const submitRecordId = await createShimaCourseBySubmit(I, {
    ...common, courseCd: `A${stamp}`, courseName: `E2E_送信版_${stamp}`,
  });
  const submitMs = Date.now() - submitStartedAt;

  I.say(`所要時間: UI 版 ${uiMs} ms / フォーム送信版 ${submitMs} ms`);
  I.say(`record: UI 版 ${uiRecordId} / フォーム送信版 ${submitRecordId}`);

  // 両方の詳細画面を開き、同じ項目が同じように保存されているかを見る
  for (const [label, recordId, name] of [
    ['UI版', uiRecordId, `E2E_UI版_${stamp}`],
    ['フォーム送信版', submitRecordId, `E2E_送信版_${stamp}`],
  ]) {
    I.amOnPage(`${BASE_URL}index.php?module=ShimaCourse&action=DetailView&record=${recordId}`);
    I.see(name);
    // 「1200」や「スクール」を画面のどこかで探すと、コース名の日時（例: 12時00分台）などに
    // 当たって素通りしうるので、見出しの直後の値を読んで比べる。
    const text = (await I.grabTextFrom('body')).replace(/\s+/g, ' ');
    const category = (text.match(/コースカテゴリー\s*:\s*(.*?)\s*回数\s*:/) || [])[1];
    const kanrihi = (text.match(/運営管理費（税抜き）\s*:\s*(.*?)\s*料金区分\s*:/) || [])[1];
    I.say(`  ${label}: コースカテゴリー「${category}」 / 運営管理費（税抜き）「${kanrihi}」`);
    if (category !== 'スクール') throw new Error(`${label} のコースカテゴリーが違う: ${category}`);
    if (kanrihi !== '1200') throw new Error(`${label} の運営管理費が違う: ${kanrihi}`);
    I.saveScreenshotWithTimestamp(`COURSE_CREATE_${label}`, true);
  }
});
