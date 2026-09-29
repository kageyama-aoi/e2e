'use strict';

/**
 * shimamura サイドバーナビゲーション定義
 *
 * パターン:
 *   moduleUrl + shortcut          : モジュール TOP へ遷移→直接表示されているリンクをクリック
 *   moduleUrl + collapseToggle    : モジュール TOP へ遷移→折りたたみを開く→リンクをクリック
 *              + shortcut
 *   directUrl のみ               : セッション状態リセットが必要な特殊ケース（ShimaCourse）
 *
 * SHIMAMURA_NAV=sidebar のとき: moduleUrl + shortcut / collapseToggle でサイドバー経由
 * SHIMAMURA_NAV 未設定（デフォルト）: directUrl で直接遷移
 */
module.exports = {

  // ── 受講生系 ────────────────────────────────────────────────────
  studentSearch: {
    directUrl: '/index.php?module=Student&action=index&top_menu=1',
    moduleUrl: '/index.php?module=Student&action=index&top_menu=1',
    shortcut:  '受講生検索',
  },
  contactList: {
    directUrl:      '/index.php?module=Student&action=index&contact_status=5&top_menu=1',
    moduleUrl:      '/index.php?module=Student&action=index&top_menu=1',
    collapseToggle: { icon_id: 'submenu__application_sub', menuname: '問合せ' },
    shortcut:       '問合せ一覧',
  },
  courseByStudent: {
    directUrl: '/index.php?module=Student&action=index&contact_status=0&course_list=true&initial_state&top_menu=1',
    moduleUrl: '/index.php?module=Student&action=index&top_menu=1',
    shortcut:  'コース別受講生一覧',
  },
  classesByStudent: {
    directUrl: '/index.php?module=Student&action=index&contact_status=0&courses_by_student=true&initial_state&top_menu=1',
    moduleUrl: '/index.php?module=Student&action=index&top_menu=1',
    shortcut:  '受講生別クラス一覧',
  },
  creditPurchaseCustomer: {
    directUrl: '/index.php?module=Student&action=LW_CreditPurchaseCustomerInfo_AN&empty_form=1',
    moduleUrl: '/index.php?module=Student&action=index&top_menu=1',
    shortcut:  '債権買取顧客情報一覧',
  },
  kouhoSearch: {
    directUrl:      '/index.php?module=ContactsKouho&action=LW_AN&top_menu=1',
    moduleUrl:      '/index.php?module=Student&action=index&top_menu=1',
    collapseToggle: { icon_id: 'submenu__candidates_grp_sub', menuname: '候補生' },
    shortcut:       '候補生検索',
  },
  documentRequestList: {
    directUrl:      '/index.php?module=Student&action=index&query=1&contact_status=11',
    moduleUrl:      '/index.php?module=Student&action=index&top_menu=1',
    collapseToggle: { icon_id: 'submenu__application_sub', menuname: '問合せ' },
    shortcut:       '資料請求一覧',
  },
  studentMemoList: {
    directUrl:      '/index.php?module=SMSMemo&action=ListView&is_memo=1&parent_module=Student&empty_form=1',
    moduleUrl:      '/index.php?module=Student&action=index&top_menu=1',
    collapseToggle: { icon_id: 'submenu__smsmemo_sub', menuname: 'メモ' },
    shortcut:       'メモ一覧',
  },

  // ── クラス・コース系 ──────────────────────────────────────────
  classList: {
    directUrl: '/index.php?module=Course&action=ListView&course_list=true&query=true&initial_state',
    moduleUrl: '/index.php?module=Course&action=index&top_menu=1',
    shortcut:  'クラス一覧',
  },
  courseIchiran: {
    // ShimaCourse はサイドバーリンクに top_menu=1 がなく検索状態が残るため常に directUrl
    directUrl: '/index.php?module=ShimaCourse&action=LW_AN&top_menu=1',
  },
  attendanceToday: {
    directUrl: '/index.php?module=Course&action=AttendanceViewDetailed&initial_state=menu',
    moduleUrl: '/index.php?module=Course&action=index&top_menu=1',
    shortcut:  '本日の出席表一覧',
  },

  // ── 講師 ─────────────────────────────────────────────────────
  teacherList: {
    directUrl: '/index.php?module=Teacher&action=index&top_menu=1',
    moduleUrl: '/index.php?module=Teacher&action=index&top_menu=1',
    shortcut:  '講師検索',
  },
  teacherStudentList: {
    directUrl: '/index.php?module=Teacher&action=index&return_module=Teacher&return_action=index&student_list=true&query=true',
    moduleUrl: '/index.php?module=Teacher&action=index&top_menu=1',
    shortcut:  '講師別受講生一覧',
  },

  // ── コンタクト ────────────────────────────────────────────────
  contactModuleList: {
    directUrl: '/index.php?module=Contacts&action=index&top_menu=1',
    moduleUrl: '/index.php?module=Contacts&action=index&top_menu=1',
    shortcut:  '顧客一覧',
  },
  accountList: {
    directUrl:      '/index.php?module=Accounts&action=index&return_module=Accounts&return_action=DetailView&query=true',
    moduleUrl:      '/index.php?module=Contacts&action=index&top_menu=1',
    collapseToggle: { icon_id: 'submenu__account_sub', menuname: '法人/団体' },
    shortcut:       '法人/団体一覧',
  },
  staffList: {
    directUrl:      '/index.php?module=Staff&action=index&query=true',
    moduleUrl:      '/index.php?module=Contacts&action=index&top_menu=1',
    collapseToggle: { icon_id: 'submenu__employee_sub', menuname: 'スタッフ' },
    shortcut:       'スタッフ一覧',
  },
  parentList: {
    directUrl:      '/index.php?module=ParentSMS&action=index',
    moduleUrl:      '/index.php?module=Contacts&action=index&top_menu=1',
    collapseToggle: { icon_id: 'submenu__parent_sub', menuname: '保護者' },
    shortcut:       '保護者一覧',
  },

  // ── 部屋･備品 ────────────────────────────────────────────────
  classroomList: {
    directUrl: '/index.php?module=Resource&action=LWClassroom_AN&query=1',
    moduleUrl: '/index.php?module=Resource&action=LWClassroom_AN&top_menu=1',
    shortcut:  '部屋一覧',
  },
  schoolList: {
    directUrl: '/index.php?module=School&action=index&query=1',
    moduleUrl: '/index.php?module=Resource&action=LWClassroom_AN&top_menu=1',
    shortcut:  '店舗一覧',
  },

  // ── 有効性データ ──────────────────────────────────────────────
  validityDataOutput: {
    directUrl:      '/index.php?module=Student&action=LWValidityDataOutput_AN',
    moduleUrl:      '/index.php?module=Student&action=index&top_menu=1',
    collapseToggle: { icon_id: 'submenu__validity_data_sub', menuname: '有効性データ' },
    shortcut:       '有効性データ出力',
  },

  // ── 経理系 ───────────────────────────────────────────────────
  keiriInvoices: {
    directUrl: '/index.php?module=Keiri&action=index&keiri_report_type=Invoices&top_menu=1',
    moduleUrl: '/index.php?module=Keiri&action=index&top_menu=1',
    shortcut:  '受注＆売上',  // U+FF06 全角アンパサンド
  },
  mishukinList: {
    directUrl: '/index.php?module=Transaction&action=LWMishukin_AN&query=true',
    moduleUrl: '/index.php?module=Keiri&action=index&top_menu=1',
    shortcut:  '未収金',
  },
  transactionList: {
    directUrl:      '/index.php?module=Transaction&action=index&top_menu=1',
    moduleUrl:      '/index.php?module=Keiri&action=index&top_menu=1',
    collapseToggle: { icon_id: 'submenu__transaction_sub', menuname: '入出金' },
    shortcut:       '入出金一覧',
  },
  monthlyFeeCreation: {
    directUrl: '/index.php?module=Fee&action=LWMonthlyFeeCreation_AN',
    moduleUrl: '/index.php?module=Keiri&action=index&top_menu=1',
    shortcut:  '月謝一括作成',
  },
  urikakekin: {
    // サイドバーのリンクは query_date=当日 付きだが、directUrl では基準日を検索条件で渡す
    directUrl: '/index.php?module=Transaction&action=LWUrikakekin_AN&query=true',
    moduleUrl: '/index.php?module=Keiri&action=index&top_menu=1',
    shortcut:  '売掛金',
  },
  afsMemberSearch: {
    directUrl: '/index.php?module=Keiri&action=LW_ACSMemberNumberSearch_AN',
    moduleUrl: '/index.php?module=Keiri&action=index&top_menu=1',
    shortcut:  'AFS会員番号検索',
  },
  posResponseError: {
    directUrl: '/index.php?module=PosResponseError&action=LWPOSResponseErrorList_AN',
    moduleUrl: '/index.php?module=Keiri&action=index&top_menu=1',
    shortcut:  'POSレスポンスエラー一覧',
  },
  feeList: {
    directUrl:      '/index.php?module=Fee&action=index&general=0&top_menu=1',
    moduleUrl:      '/index.php?module=Keiri&action=index&top_menu=1',
    collapseToggle: { icon_id: 'submenu__fees_sub', menuname: '料金' },
    shortcut:       '料金一覧',
  },
  feeCommonList: {
    directUrl:      '/index.php?module=Fee&action=LWCommon_AN&top_menu=1',
    moduleUrl:      '/index.php?module=Keiri&action=index&top_menu=1',
    collapseToggle: { icon_id: 'submenu__fees_sub', menuname: '料金' },
    shortcut:       '料金一覧(共通)',
  },
};
