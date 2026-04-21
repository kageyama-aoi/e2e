'use strict';

/**
 * break 指定を正規化する（空文字や空白を除去）
 * @param {string} breakTarget
 * @param {string} breakValue
 * @returns {{ target: string, value: string }}
 */
function normalizeBreakSpec(breakTarget, breakValue) {
  const target = typeof breakTarget === 'string' ? breakTarget.trim() : '';
  return { target, value: breakValue };
}

/**
 * SKIP 指定かどうかを判定する
 * @param {string} value
 * @returns {boolean}
 */
function isSkipValue(value) {
  if (value == null) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized === 'skip' || normalized === '__skip__';
}

/**
 * 業務的な breakTarget からスキップ対象の step を解決する
 * @param {string} breakTarget
 * @returns {string[]}
 */
function getSkipStepsForBreakTarget(breakTarget) {
  const mapping = {
    class_select: ['class_select'],
    class_apply: ['class_apply'],
    course_set: ['course_set'],
    transaction: ['transaction'],
    contract_date: ['fill_dates'],
    start_date: ['fill_dates']
  };
  return mapping[breakTarget] || [];
}

/**
 * 入力値を実行用に整形する
 * @param {Object} input
 * @returns {Object}
 */
function prepareInput(input) {
  const breakSpec = normalizeBreakSpec(input.breakTarget, input.breakValue);
  const preparedInput = {
    class_name01: input.class_name01,
    course_category: input.course_category,
    keiyaku_date: input.keiyaku_date,
    kaishi_date: input.kaishi_date,
    mid_month: input.mid_month,
    remaining_classes: input.remaining_classes
  };

  if (breakSpec.target === 'contract_date' && breakSpec.value != null) {
    preparedInput.keiyaku_date = isSkipValue(breakSpec.value) ? '' : breakSpec.value;
  }
  if (breakSpec.target === 'start_date' && breakSpec.value != null) {
    preparedInput.kaishi_date = isSkipValue(breakSpec.value) ? '' : breakSpec.value;
  }

  return preparedInput;
}

/**
 * 実行計画（Execution Plan）を生成する
 * @param {Object} input
 * @returns {{ plan: Array.<{step: string, expect?: string}> }}
 */
function buildExecutionPlan(input) {
  const breakSpec = normalizeBreakSpec(input.breakTarget, input.breakValue);
  const steps = [
    { step: 'class_select' },
    { step: 'switch_to_detail' },
    { step: 'class_apply' },
    { step: 'fill_dates' },
    { step: 'course_set' },
    { step: 'log_after_popup_close' },
    { step: 'transaction', expect: 'success' },
    { step: 'verify_errors', expect: 'validation_error' }
  ];

  const skipSteps = new Set();
  if (breakSpec.target && isSkipValue(breakSpec.value)) {
    getSkipStepsForBreakTarget(breakSpec.target).forEach(step => skipSteps.add(step));
  }

  if (input.expectedErrors.length) {
    skipSteps.add('transaction');
  } else {
    skipSteps.add('verify_errors');
  }

  return { plan: steps.filter(step => !skipSteps.has(step.step)) };
}

module.exports = {
  normalizeBreakSpec,
  isSkipValue,
  getSkipStepsForBreakTarget,
  prepareInput,
  buildExecutionPlan
};
