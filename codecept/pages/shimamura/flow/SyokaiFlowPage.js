'use strict';

/**
 * 初回登録（候補生 → 受講生へ昇格 → 経理ビュー A/B でクラス選択〜売上計上）の流れ。
 * 部品は `_common/` の共通ステップにあり、ここでは順番だけを決める（#300）。
 * - 候補生の昇格: `_common/KouhoseiSteps.js`
 * - 経理ビュー A/B/E: `_common/KeiriViewSteps.js`
 * - 退会: `_common/TaikaiSteps.js`
 */

const { navigateToKouhosei } = require('../_common/KouhoseiSteps');
const { openKeirisyoriScreenA, fillKeirisyoriScreenB } = require('../_common/KeiriViewSteps');

async function runRegistrationFlow(I, classMemberPageShimamura, input) {
  I.say('=== 候補生検索 開始 ===');
  await navigateToKouhosei(I, classMemberPageShimamura, input.lastName);
  I.say('=== 候補生検索 終了 ===');
  I.say('=== 経理ビューA/B 処理 開始 ===');
  await openKeirisyoriScreenA(I, classMemberPageShimamura);
  await fillKeirisyoriScreenB(I, input);
  I.say('=== 経理ビューA/B 処理 終了 ===');
}

module.exports = {
  runRegistrationFlow,
};
