/**
 * @fileoverview tframe 講師登録テストデータ
 */

/**
 * 重複しないテスト用講師データを生成する
 * @returns {object} 講師登録フォームの全セクション分の入力値
 */
function generateTestTeacher() {
  const ts = Date.now();
  return {
    // 個人情報1
    lastName: 'テスト',
    firstName: `講師${ts}`,
    lastNameFurigana: 'てすと',
    firstNameFurigana: 'こうし',
    phone1Number: '09012345678',
    phone2Number: '',
    gender: 'male',
    birthdateYear: '1990',
    birthdateMonth: '01',
    birthdateDay: '15',
    email1: `test.teacher.${ts}@example.com`,
    email2: '',

    // 個人情報2
    idnumber: `T${ts}`,
    personStatus: '11',          // フルタイム講師
    schoolAreaId: 'a1',          // 関東
    schoolBranchId: '',          // エリア依存のためブランクで省略
    enrollDate: '2024/04/01',
    leaveDate: '',

    // 支払規定等
    zeiKubun: '2',               // 個人
    bankPaymentType: '2',        // 振込
    bankAccountType: '1',        // 普通
    bankCode: '',                // AJAX補完が不安定なため省略
    bankBranchCode: '',
    bankAccountNo: '1234567',
    bankName: 'テスト銀行',
    bankBranchName: 'テスト支店',
    bankAccountName: 'テストコウシ',

    // 住所情報
    primaryAddressPostalcode: '1000001',
    primaryAddressState: '東京都',
    primaryAddressCity: '千代田区',
    primaryAddressStreet: '千代田1-1',
    primaryAddressKana: 'トウキョウトチヨダクチヨダ',

    // メモ情報
    description: 'テスト登録データ（自動テスト）',
  };
}

module.exports = { generateTestTeacher };
