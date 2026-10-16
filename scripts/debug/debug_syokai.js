// VS Code のデバッガで syokai_helpers.js を1行ずつ追うための練習用スクリプト（#339 で output/ から移した）。
// syokai_helpers.js の prepareInput / buildExecutionPlan を、ブラウザなしで直接呼び出して確認する。
//
// 使い方（VS Code）:
//   1. codecept/support/shimamura/syokai_helpers.js を開き、prepareInput・buildExecutionPlanの中の
//      好きな行の左端（行番号の左）をクリックしてブレークポイント（赤丸）を置く
//   2. このファイルを開いた状態で、左サイドバーの「実行とデバッグ」を開く
//   3. 上部のドロップダウンで「Debug: syokai_helpers 単体」を選び、F5（または▷ボタン）
//   4. ブレークポイントで処理が止まる。変数はマウスホバー／左の「変数」パネル／
//      下の「デバッグコンソール」（例: breakSpec.value と打つ）で確認できる
//   5. F10=1行ずつ進む、F11=関数の中に入る、F5=次のブレークポイントまで進める

const { prepareInput, buildExecutionPlan } = require('../../codecept/support/shimamura/syokai_helpers');

// data/shimamura/syokai_touroku_validation_errors.csv の2行目相当
// 「値をそのまま壊す」パターン（SKIPではなく、literalな不正値）
const rowStartDate = {
  class_name01: 'ピアノ水曜日_01_01',
  course_category: 'スクール',
  keiyaku_date: '2026-01-04',
  kaishi_date: '2026-01-10',
  mid_month: '',
  remaining_classes: '',
  breakTarget: 'start_date',
  breakValue: '2025-12-31',   // ← ここが「壊す値」
  expectedErrors: ['開始日は当月以降で入力してください。']
};

// 同CSVの3行目相当：「操作そのものをSKIPする」パターン
const rowCourseSetSkip = {
  ...rowStartDate,
  breakTarget: 'course_set',
  breakValue: 'SKIP',
  expectedErrors: ['スクールかサロンのコースカテゴリーのみが、本画面の処理対象です。']
};

console.log('--- prepareInput(rowStartDate) ---');
console.log(prepareInput(rowStartDate));

console.log('--- buildExecutionPlan(rowStartDate) ---');
console.log(buildExecutionPlan(rowStartDate));

console.log('--- buildExecutionPlan(rowCourseSetSkip) ---');
console.log(buildExecutionPlan(rowCourseSetSkip));
