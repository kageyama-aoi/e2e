'use strict';

/**
 * shimamura 問合せ登録のフォーム送信登録（createContactBySubmit）動作確認ランナー
 *
 * このファイルは通常のテストスイートには含まれない（`_test.js` 非末尾）。
 * `createContactBySubmit()` が実環境で通るかを手動で確かめるための実行用で、
 * 実行すると testgcp に受講生が1件増える（問合せ登録で作られるのは候補生ではなく受講生）。
 * 後始末は list_api_test_contacts.js で UUID を確認し、delete_listed_test_records.js で行う。
 *
 * 実行例:
 *   npx codeceptjs run ./tests/shimamura/util/create_contact_by_submit_check.js --profile shimamura.testgcp
 *
 * 確認すること:
 * - record UUID が返ること（＝サーバーが保存したこと）
 * - 遷移先の詳細画面に、送った姓名が表示されていること
 * - UI 経由との所要時間の差（ログの ms を控える）
 */

const { beforeShimamura } = require('../../../support/shimamura/hooks');
const { buildTestName } = require('../../../support/shimamura/utils');

Feature('shimamura 問合せ登録のフォーム送信登録（動作確認）');

Before(beforeShimamura);

Scenario('createContactBySubmit で受講生を1件登録できる', async ({ I, contactRegisterPageShimamura }) => {
  // 同姓同名で送ると「すでに登録されているものと重なる可能性があります」の
  // 重複候補確認画面が返り保存されないため、名は実行時刻で一意にする。
  const hhmmss = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
  // 姓「API登録」は list_api_test_contacts.js の検索対象なので変えない。
  const name = buildTestName('API登録', { testNo: hhmmss, scenario: '' });

  // 値は data/shimamura/contact_register_data.csv の「最小限登録」と揃える。
  // ふりがなは全角ひらがな必須、bank_payment_type は既定の 2（イオンCカード）のままだと
  // カード情報が必須になるため 3 を明示する。
  const startedAt = Date.now();
  const result = await contactRegisterPageShimamura.createContactBySubmit({
    last_name:           name.lastName,
    first_name:          name.firstName,
    last_name_furigana:  'えーぴーあい',
    first_name_furigana: 'とうろく',
    bank_payment_type:   '3',
    description:         name.description,
  });
  const elapsedMs = Date.now() - startedAt;

  I.say(`登録所要時間: ${elapsedMs} ms / record=${result.recordId}`);

  // 作成されたレコードの詳細画面を開き、送った値が保存されているかを目視でも確認できるようにする
  I.amOnPage(result.url);
  I.see(name.lastName);
  I.saveScreenshotWithTimestamp('CONTACT_CREATE_BY_SUBMIT', true);
});
