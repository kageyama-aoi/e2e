'use strict';

/**
 * 口座振替スケジュール（module=ShimaSchedule&action=LWAccountTransferScheduleRegistration_AN）の確保。
 *
 * 月謝一括作成バッチは、収納業者のうち1つでも「対象月の口座振替スケジュール」が
 * 未登録だと、その収納業者だけでなく処理対象全体が作成されない（shimamura #169で判明）。
 * バッチを伴うテストの前提条件として、既知の収納業者について対象月のスケジュールを
 * 事前に確保する。登録済みでも重複登録エラーにならない（既存レコードが上書きされる
 * だけ）ため、毎回無条件に登録して問題ない。
 */

const { TIMEOUTS } = require('./constants');

const BASE_URL = (process.env.BASE_URL || '').replace(/\/?$/, '/');

// testgcp環境に実在する収納業者のうち判明しているもの。
// 001はテストデータの収納業者、143はtestgcp環境に実在する他収納業者（未登録だとバッチ全体が止まる）。
const KNOWN_STORAGE_VENDORS = [
  { shimaStorageId: '00120211112', label: '001:イオン収納' },
  { shimaStorageId: '1434050501',  label: '143:T_JF収納業者143' },
];

async function ensureAccountTransferSchedules(I, { claimMonth, debitDate, depositDate }) {
  for (const vendor of KNOWN_STORAGE_VENDORS) {
    I.say(`【口座振替スケジュール確保】${vendor.label} / ${claimMonth}`);
    I.amOnPage(`${BASE_URL}index.php?module=ShimaSchedule&action=LWAccountTransferScheduleRegistration_AN`);
    I.waitForElement('#shima_storage_id', TIMEOUTS.SCREEN);
    I.selectOption('#shima_storage_id', vendor.shimaStorageId);
    I.fillField('#claim_month', claimMonth);
    I.fillField('#data_date', debitDate);
    I.fillField('#t_date', depositDate);
    I.click('input[name="register_button"]');
    I.wait(TIMEOUTS.TAB_SWITCH);
  }
}

module.exports = { ensureAccountTransferSchedules, KNOWN_STORAGE_VENDORS };
