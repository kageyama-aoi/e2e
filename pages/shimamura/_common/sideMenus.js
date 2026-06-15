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

  // ── コンタクト ────────────────────────────────────────────────
  contactModuleList: {
    directUrl: '/index.php?module=Contacts&action=index&top_menu=1',
    moduleUrl: '/index.php?module=Contacts&action=index&top_menu=1',
    shortcut:  '顧客一覧',
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
};
