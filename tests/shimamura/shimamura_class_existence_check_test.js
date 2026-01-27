/**
 * @fileoverview しまむら：クラス存在チェックのE2Eテスト
 *
 * `syokai_touroku_data.csv`（または `--profile` に応じたCSV）に含まれる `className` が
 * 事前に「クラス一覧」から検索できることを確認します。
 *
 * 受講生登録フローの途中で「クラスが無い」ことに気付くのを避けるための事前検知用テストです。
 *
 * **処理フロー**
 * - 1. 担当者アカウントでログイン（autoLogin）
 * - 2. 管理 > コース > クラス一覧へ遷移
 * - 3. CSVの `className` を検索して、検索結果に表示されることを確認
 *
 * **前提条件**
 * - 環境変数 `SHIMAMURA_TANTOUSYA` が設定されていること
 * - `data/shimamura/syokai_touroku_data.csv` が存在すること
 * - 実行時に `--profile` を指定する場合は `env/.env.<profile>` が存在すること
 *
 * **最終更新日**
 * - 2026-01-27
 */
const fs = require('fs');
const path = require('path');
const { readCsv, getProfileFromArgs } = require('../../support/utils');

const profile = getProfileFromArgs();
const defaultCsvPath = path.join(__dirname, '../../data/shimamura', 'syokai_touroku_data.csv');
const profileCsvPath = profile ? path.join(__dirname, '../../data/shimamura', `syokai_touroku_data_${profile}.csv`) : null;

const csvData = (profileCsvPath && fs.existsSync(profileCsvPath))
  ? readCsv(profileCsvPath)
  : readCsv(defaultCsvPath);

// className の重複チェックを避ける（同名クラスの繰り返し確認をしない）
const uniqueClassRows = Array.from(
  new Map(
    csvData
      .filter((row) => row && row.className)
      .map((row) => [row.className, row])
  ).values()
);

Feature('Dev sandbox (@dev)');

Before(async ({ login, loginPageShimamura }) => {
  const tantousyaNumber = process.env.SHIMAMURA_TANTOUSYA;
  if (!tantousyaNumber) {
    throw new Error('❌ SHIMAMURA_TANTOUSYA が環境変数（.envファイル）に設定されていません。プロファイルが正しく指定されているか確認してください。');
  }

  await login('user');
  await loginPageShimamura.enterTantousyaNumberAndProceed(String(tantousyaNumber).replace(/['"]/g, ''));
});

const S = {
  classList: {
    screenTitle: 'クラス一覧',
    buttons: {
      search: '検索',
    },
    // しまむら画面の実装差分に備えて「クラス名」の入力候補を複数用意
    fields: {
      classNameCandidates: [
        '#course_name', // クラス選択POP_UPで使われている想定
        'input[name="course_name"]',
        'input[name="name"]', // 既存テストで使用されている想定（実画面により異なる）
        'name',
      ],
    },
    results: {
      link: 'a.listViewTdLinkS1',
    },
  },
};

async function fillFirstVisibleField(I, candidates, value) {
  for (const locator of candidates) {
    try {
      const count = await I.grabNumberOfVisibleElements(locator);
      if (count > 0) {
        I.fillField(locator, value);
        return locator;
      }
    } catch (_) {
      // ignore invalid selector types in some drivers and continue
    }
  }
  throw new Error(`クラス名入力欄が見つかりませんでした（候補: ${candidates.join(', ')}）`);
}

async function assertClassExistsOnClassList(I, className) {
  I.waitForElement(locate('body').withText(S.classList.screenTitle), 10);

  const usedLocator = await fillFirstVisibleField(I, S.classList.fields.classNameCandidates, className);
  I.say(`クラス名入力欄: ${usedLocator}`);

  I.click(S.classList.buttons.search);

  // 何かしら結果が出るまで待つ。見つからなければ明示エラー。
  try {
    I.waitForElement(S.classList.results.link, 10);
  } catch (err) {
    I.saveScreenshotWithTimestamp(`CLASS_EXISTENCE_NOT_FOUND_${className}.png`);
    throw new Error(`❌ クラス一覧で検索結果が見つかりませんでした: ${className}`);
  }

  const texts = await I.grabTextFromAll(S.classList.results.link);
  const found = texts.some((t) => String(t).includes(className));
  if (!found) {
    I.saveScreenshotWithTimestamp(`CLASS_EXISTENCE_MISMATCH_${className}.png`);
    throw new Error(`❌ 検索結果に className が含まれませんでした: ${className}`);
  }
}

Data(uniqueClassRows).Scenario('クラス存在チェック（事前検知） @dev', async ({ I, classMemberPageShimamura, current }) => {
  const className = current.className;
  I.say(`--- クラス存在チェック開始: ${className} ---`);

  await classMemberPageShimamura.navigateToAdminTab(I, 'コース', 'コース一覧');
  classMemberPageShimamura.clickSubMenuLink('クラス一覧', 'クラス一覧');

  await assertClassExistsOnClassList(I, className);

  I.say(`✅ クラス存在OK: ${className}`);
});

