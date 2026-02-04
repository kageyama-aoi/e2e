/**
 * @fileoverview しまむら：経理 返金処理（ひな形）E2Eテスト
 *
 * **処理フロー（ひな形）**
 * - 1. 担当者アカウントでログイン（autoLogin）
 * - 2. 管理 > 経理（機能一覧）へ遷移
 * - 3. 月謝一括作成へ遷移
 * - 4. 返金処理の条件入力（仮）
 * - 5. 作成・確認・確定（仮）
 *
 * **データソース**
 * - `keiri_hennkin_syori_data.csv`（または `--profile` に応じたファイル）
 *
 * **異常系の指定（CSV）**
 * - `expectedErrors`: `|` 区切りの期待エラー文言
 *
 * **前提条件**
 * - 環境変数 `SHIMAMURA_TANTOUSYA` が設定されていること
 * - 実行時に `--profile` を指定する場合は `env/.env.<profile>` が存在すること
 *
 * **最終更新日**
 * - 2026-02-04
 */
const fs = require('fs');
const path = require('path');
const {
  readCsv,
  getProfileFromArgs,
  setBusinessLabels,
  attachBusinessContext,
  attachErrorScreenshot
} = require('../../support/utils');
const { toggleGroupmenu } = require('../../support/shimamura/utils');

Feature('Dev sandbox (@dev)');

/**
 * テスト実行前のセットアップ
 * 各シナリオの前にログイン処理と担当者番号入力を共通で行う
 * @param {object} args - CodeceptJSのDI引数
 * @param {CodeceptJS.I} args.I - Iオブジェクト
 * @param {object} args.loginPageShimamura - ログインページオブジェクト
 */
const profile = getProfileFromArgs();
const defaultCsvPath = path.join(__dirname, '../../data/shimamura', 'keiri_hennkin_syori_data.csv');
const profileCsvPath = profile ? path.join(__dirname, '../../data/shimamura', `keiri_hennkin_syori_data_${profile}.csv`) : null;
const csvDataRaw = (profileCsvPath && fs.existsSync(profileCsvPath))
  ? readCsv(profileCsvPath)
  : readCsv(defaultCsvPath);

const validationErrorsDefaultPath = path.join(__dirname, '../../data/shimamura', 'keiri_hennkin_syori_validation_errors.csv');
const validationErrorsProfilePath = profile ? path.join(__dirname, '../../data/shimamura', `keiri_hennkin_syori_validation_errors_${profile}.csv`) : null;
const validationErrorDataRaw = (validationErrorsProfilePath && fs.existsSync(validationErrorsProfilePath))
  ? readCsv(validationErrorsProfilePath)
  : readCsv(validationErrorsDefaultPath);

function withScenarioLabel(data, labelResolver) {
  return data.map((row) => {
    const label = labelResolver(row);
    return {
      ...row,
      toString() {
        return label;
      }
    };
  });
}

const csvData = withScenarioLabel(csvDataRaw, (row) => {
  return row.label || row.targetMonth || 'データ行';
});

const validationErrorData = withScenarioLabel(validationErrorDataRaw, (row) => {
  return row.label || row.breakTarget || 'バリデーションエラー';
});

function parseExpectedErrors(value) {
  if (!value) return [];
  return value.split('|').map(err => err.trim()).filter(Boolean);
}

async function logScreenUrl(I, screenName) {
  I.say(`${screenName}\nURL: ${await I.grabCurrentUrl()}`);
}

function isPauseEnabled() {
  const value = String(process.env.PAUSE_ON_KEIRI || '').trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes' || value === 'on';
}

/**
 * 経理メニューから返金一覧へ遷移する
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} classMemberPageShimamura - ClassMember ページオブジェクト
 */
async function ShouldBeOnKeiriMenuAndOpenRefundList(I, classMemberPageShimamura) {
  const S = {
    screen: { name: '経理メニュー' },
    submenu: {
      icon_id: 'submenu__transaction_sub',
      menuname: '入出金'
    },
    link: { name: '返金一覧' }
  };
  I.say('【画面遷移】経理メニュー → 返金一覧');
  await toggleGroupmenu(I, {
    icon_id: S.submenu.icon_id,
    menuname: S.submenu.menuname
  });
  I.see(S.link.name);
  classMemberPageShimamura.clickSubMenuLink(S.link.name, S.link.name);
  await logScreenUrl(I, S.link.name);
}

Before(async ({ login, loginPageShimamura }) => {
  const tantousyaNumber = process.env.SHIMAMURA_TANTOUSYA;
  if (!tantousyaNumber) {
    throw new Error('❌ SHIMAMURA_TANTOUSYA が環境変数（.envファイル）に設定されていません。プロファイルが正しく指定されているか確認してください。');
  }
  await login('user');
  await loginPageShimamura.enterTantousyaNumberAndProceed(String(tantousyaNumber).replace(/['"]/g, ''));
});

const S = {
  screen: { name: '月謝一括作成' },
  fields: {
    targetMonth: '#billing_month',
    targetSchool: '#school_id'
  },
  buttons: {
    search: '検索',
    create: '作成',
    confirm: '確認',
    finalize: '確定'
  },
  result: {
    table: '.listView'
  },
  error: {
    container: '#top_err_info_msg_div'
  }
};

/**
 * 月謝一括作成画面での入力（仮）
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {Object} input - 入力値（仮）
 */
async function fillBatchCreateForm(I, input) {
  I.say('【月謝一括作成】条件入力（仮）');
  I.fillField(S.fields.targetMonth, input.targetMonth);
  I.selectOption(S.fields.targetSchool, input.targetSchool);
  I.click(S.buttons.search);
}

/**
 * 期待エラーの検証を行う
 * @param {CodeceptJS.I} I - CodeceptJSのIオブジェクト
 * @param {string[]} expectedErrors - 期待エラー
 * @param {string} containerSelector - エラー表示領域
 */
async function verifyValidationErrors(I, expectedErrors, containerSelector) {
  I.waitForElement(containerSelector, 5);
  expectedErrors.forEach(err => I.see(err, containerSelector));
}

/**
 * 月謝一括作成のテストシナリオ（正常系）
 */
Data(csvData).Scenario('経理：返金処理 正常系 @dev @normal', async ({ I, classMemberPageShimamura, current }) => {
  I.say('--- テスト開始: 経理 返金処理（正常系） ---');

  setBusinessLabels({
    epic: '経理',
    feature: '返金処理',
    story: '正常フロー'
  });

  const input = {
    targetMonth: current.targetMonth || '2026-02',
    targetSchool: current.targetSchool || 'すべて',
    expectedErrors: parseExpectedErrors(current.expectedErrors)
  };

  attachBusinessContext({
    label: '正常フロー',
    input,
    expectedErrors: input.expectedErrors
  });

  I.say('【管理メニュー】経理 → 経理メニュー');
  await classMemberPageShimamura.navigateToAdminTab(I, '経理', '月謝一括作成');
  await logScreenUrl(I, '経理メニュー');
  await ShouldBeOnKeiriMenuAndOpenRefundList(I, classMemberPageShimamura);

  // まずは月謝一括作成の画面遷移のみ確認するため、必要に応じて一時停止
  if (isPauseEnabled()) {
    pause();
  }

  await fillBatchCreateForm(I, input);

  I.say('【月謝一括作成】結果確認（仮）');
  I.waitForElement(S.result.table, 10);

  I.say('【月謝一括作成】作成→確認→確定（仮）');
  I.click(S.buttons.create);
  I.click(S.buttons.confirm);
  I.click(S.buttons.finalize);

  // 最終確認のスクリーンショット
  I.saveScreenshotWithTimestamp('KEIRI_BATCH_CREATE_Template.png');

  I.say('--- テスト終了: 経理 返金処理（正常系） ---');
});

/**
 * 月謝一括作成のテストシナリオ（異常系）
 */
Data(validationErrorData).Scenario('経理：返金処理 異常系 @dev @error', async ({ I, classMemberPageShimamura, current }) => {
  I.say('--- テスト開始: 経理 返金処理（異常系） ---');
  I.say(`【異常系】${current.label || 'バリデーションエラー'}`);

  const storyLabel = current.label || 'バリデーションエラー';
  setBusinessLabels({
    epic: '経理',
    feature: '返金処理',
    story: storyLabel
  });

  const input = {
    targetMonth: current.targetMonth || '',
    targetSchool: current.targetSchool || 'すべて',
    expectedErrors: parseExpectedErrors(current.expectedErrors)
  };

  attachBusinessContext({
    label: storyLabel,
    input,
    expectedErrors: input.expectedErrors
  });

  I.say('【管理メニュー】経理 → 経理メニュー');
  await classMemberPageShimamura.navigateToAdminTab(I, '経理', '月謝一括作成');
  await logScreenUrl(I, '経理メニュー');
  await ShouldBeOnKeiriMenuAndOpenRefundList(I, classMemberPageShimamura);

  if (isPauseEnabled()) {
    pause();
  }
  await fillBatchCreateForm(I, input);

  I.say('【月謝一括作成】作成（異常系）');
  I.click(S.buttons.create);
  await verifyValidationErrors(I, input.expectedErrors, S.error.container);
  await attachErrorScreenshot(I, 'KEIRI_HENNIKIN_VALIDATION_ERROR');

  I.say('--- テスト終了: 経理 返金処理（異常系） ---');
});
