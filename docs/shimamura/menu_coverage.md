# shimamura サイドメニュー 画面一覧 × テスト開発状況マッピング

最終更新: 2026-09-28（#251 初版）

- **サマリとアイコン別表は自動生成**（`npm run docs:menu-coverage:shimamura` / commit 時にも自動再生成）。
  入力 = `pages/shimamura/_common/menuSnapshot/testgcp.json`（実機採取・採取日は JSON の `capturedAt`）
  × `pages/shimamura/**` の画面参照 × `tests/shimamura/**_test.js`。
- メニューが改定されたら `node scripts/html/fetch_shimamura_menus.js shimamura.testgcp` で採取し直す（データは変更しない・読むだけ）。
- 計画・バケット分類は [`screen_expansion_plan_2026-09.md`](screen_expansion_plan_2026-09.md)。

## このドキュメントの位置づけ

| ドキュメント | 切り口 | 見るもの |
|---|---|---|
| **本ファイル** | **左サイドメニュー起点**。メニューに実在する画面ごとに PO 有無・テスト有無を突き合わせる | 「この画面、操作できる？テストある？」「未着手はどれ？」 |
| `screen_navigation_diagram.md` | テストが辿る画面遷移（テスト起点） | ユーザー操作の経路 |
| `pages/shimamura/_common/sideMenus.js` | テストのメニューナビ定義 | テストが辿る導線 |

## 突き合わせの仕組み（読み方の注意）

- 画面の同一性は **route**（`module/action` ＋ 画面を区別するパラメータ）で判定。正規化規則は `scripts/html/shimamura_route.js`。
- PO 列は「その route の URL を直書き / その画面の `sideMenus` キーを参照 / その URL 定数を参照」している関数を持つファイル。
- テスト列は、テストが呼ぶ PO メソッド・import した FlowPage 関数を**同一ファイル内の呼び出しまで推移的に**たどって判定。
  ヘルパー（`support/shimamura/**`）経由の遷移は拾わないため、実際より ✗ が多めに出ることがある。
- **バケットE**（カレンダー・Ｅメール・レポート・ヘルプ・管理）は業務でほぼ使わないため、メニュー巡回で開けることの確認のみとする（計画書の決定事項）。

<!-- AUTOGEN:menu-table START — 生成: node scripts/docs/gen_shimamura_menu_coverage.js。手で編集しない -->

> 入力: `pages/shimamura/_common/menuSnapshot/testgcp.json`（採取日 2026-09-28）× `pages/shimamura/**` × `tests/shimamura/**_test.js`。
> **手で編集しない** — メニューが変わったら `node scripts/html/fetch_shimamura_menus.js` で採取し直して `npm run docs:menu-coverage:shimamura`。

## サマリ

route の重複（複数アイコンに同じ画面がある等）は1画面として数える。PDF リンクは除外。

| アイコン | 画面数 | PO あり | テストあり | 未着手（PO・テストとも無し） | 扱い |
|---|--:|--:|--:|--:|---|
| カレンダー | 28 | 1 | 1 | 27 | E（巡回のみ） |
| コース | 9 | 5 | 3 | 4 | 対象 |
| 受講生 | 17 | 6 | 6 | 11 | 対象 |
| 講師 | 4 | 2 | 2 | 2 | 対象 |
| コンタクト | 8 | 1 | 1 | 7 | 対象 |
| 部屋･備品 | 12 | 0 | 0 | 12 | 対象 |
| Ｅメール | 26 | 0 | 0 | 26 | E（巡回のみ） |
| 経理 | 39 | 6 | 7 | 32 | 対象 |
| レポート | 1 | 0 | 0 | 1 | E（巡回のみ） |
| ヘルプ | 5 | 0 | 0 | 5 | E（巡回のみ） |
| **合計（全体）** | **147** | **20** | **19** | **126** | |
| **合計（E を除く対象）** | **89** | **20** | **19** | **68** | |

## アイコン別 マッピング表

- **sideMenus キー** … `pages/shimamura/_common/sideMenus.js` に定義があればそのキー
- **Page Object** … その画面へ遷移・操作する `pages/shimamura/**.js`（URL 直書き / sideMenus 参照 / URL 定数参照）
- **一覧 / フロー / その他テスト** … `tests/shimamura/{page,flow,それ以外}/*_test.js` のうち、その画面に触れるもの

### カレンダー（icon: `Calendar`） — バケットE

| グループ | 画面名 | route | sideMenus キー | Page Object | 一覧テスト | フローテスト | その他テスト |
|---|---|---|---|---|---|---|---|
| ショートカット | 今日のコース | `Calendar/index?el[]=all&event_category=course&view=day` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 今日の講師スケジュール | `Calendar/index?people_category=teacher&pl[]=all&view=day` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 今日の教室スケジュール | `Calendar/index?resource_category=classroom&rl[]=all&view=day` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 今週のコース | `Calendar/index?el[]=all&event_category=course&view=week` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 今日のマイスケジュール | `Calendar/index?people_category=staff&pl[]=*&view=day` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 今日のミーティング | `Calendar/index?el[]=all&event_category=meeting&view=day` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 本日の出席表一覧 | `Course/AttendanceViewDetailed` | `attendanceToday` | ✓ IchiranPage | ✓ `attendance_today_ichiran_test.js` | ✗ |  |
| 入退室 | 入退記録作成 | `Entrance/EditView` |  | ✗ | ✗ | ✗ |  |
| 入退室 | 入退記録一覧 | `Entrance/index` |  | ✗ | ✗ | ✗ |  |
| 入退室 | 入退・出席一覧 | `Entrance/index?shusseki=1` |  | ✗ | ✗ | ✗ |  |
| ミーティング | ミーティング設定 | `SMSMeeting/EditViewSchedule` |  | ✗ | ✗ | ✗ |  |
| ミーティング | ミーティング一覧 | `SMSMeeting/index` |  | ✗ | ✗ | ✗ |  |
| ミーティング | 今週のミーティング | `Calendar/index?el[]=all&event_category=meeting&view=week` |  | ✗ | ✗ | ✗ |  |
| カウンセリング | カウンセリング設定 | `SMSCounseling/EditViewSchedule` |  | ✗ | ✗ | ✗ |  |
| カウンセリング | カウンセリング一覧 | `SMSCounseling/index` |  | ✗ | ✗ | ✗ |  |
| カウンセリング | 今週のカウンセリング | `Calendar/index?el[]=all&event_category=counseling&view=week` |  | ✗ | ✗ | ✗ |  |
| セミナー | セミナー設定 | `SMSSeminar/EditViewSchedule` |  | ✗ | ✗ | ✗ |  |
| セミナー | セミナー一覧 | `SMSSeminar/index` |  | ✗ | ✗ | ✗ |  |
| セミナー | 今週のセミナー | `Calendar/index?el[]=all&event_category=seminar&view=week` |  | ✗ | ✗ | ✗ |  |
| イベント | イベント設定 | `SMSEvent/EW_AN` |  | ✗ | ✗ | ✗ |  |
| イベント | イベント一覧 | `SMSEvent/index` |  | ✗ | ✗ | ✗ |  |
| イベント | 今週のイベント | `Calendar/index?el[]=all&event_category=event&view=week` |  | ✗ | ✗ | ✗ |  |
| 休校日 | 休校日設定 | `SMSHoliday/EditViewSchedule` |  | ✗ | ✗ | ✗ |  |
| 休校日 | 休校日一覧 | `SMSHoliday/index` |  | ✗ | ✗ | ✗ |  |
| 休校日 | 今月の休校日 | `Calendar/index?el[]=all&event_category=holiday&view=month` |  | ✗ | ✗ | ✗ |  |
| 休日 | 休日一覧 | `SMSVacation/index?module_called_from=Calendar` |  | ✗ | ✗ | ✗ |  |
| 休日 | 今月の休日 | `Calendar/index?el[]=all&event_category=vacation&view=month` |  | ✗ | ✗ | ✗ |  |
| コマの管理 | コマの管理 | `SMSSchedule/EditViewTimeslot` |  | ✗ | ✗ | ✗ |  |

### コース（icon: `Course`）

| グループ | 画面名 | route | sideMenus キー | Page Object | 一覧テスト | フローテスト | その他テスト |
|---|---|---|---|---|---|---|---|
| ショートカット | コース一覧 | `ShimaCourse/LW_AN` | `courseIchiran` | ✓ IchiranPage | ✓ `course_ichiran_test.js` | ✗ |  |
| ショートカット | コース設定 | `ShimaCourse/EditView` |  | ✓ CourseClassSetupFlowPage | ✗ | ✗ |  |
| ショートカット | クラス一覧 | `Course/ListView?course_list=true` | `classList` | ✓ IchiranPage | ✓ `class_list_ichiran_test.js` | ✗ | ✓ `shimamura_class_existence_check_test.js` |
| ショートカット | クラス編集 | `Course/EditView` |  | ✓ CourseClassSetupFlowPage | ✗ | ✗ |  |
| ショートカット | 本日の出席表一覧 | `Course/AttendanceViewDetailed` | `attendanceToday` | ✓ IchiranPage | ✓ `attendance_today_ichiran_test.js` | ✗ |  |
| シラバス | シラバス一覧 | `Syllabus/index` |  | ✗ | ✗ | ✗ |  |
| シラバス | アップファイル一覧 | `SMSDocument/index` |  | ✗ | ✗ | ✗ |  |
| シラバス | ホームワーク一覧 | `HomeWork/index` |  | ✗ | ✗ | ✗ |  |
| コマ割の設定 | コマ設定 | `SMSSchedule/EditViewTimeslot` |  | ✗ | ✗ | ✗ |  |

### 受講生（icon: `Student`）

| グループ | 画面名 | route | sideMenus キー | Page Object | 一覧テスト | フローテスト | その他テスト |
|---|---|---|---|---|---|---|---|
| ショートカット | 受講生登録 | `Student/EditView` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 受講生検索 | `Student/index` | `studentSearch` | ✓ IchiranPage | ✓ `student_search_ichiran_test.js` | ✗ |  |
| ショートカット | 債権買取顧客情報一覧 | `Student/LW_CreditPurchaseCustomerInfo_AN` |  | ✗ | ✗ | ✗ |  |
| ショートカット | コース別受講生一覧 | `Student/index?contact_status=0&course_list=true` | `courseByStudent` | ✓ IchiranPage | ✓ `course_by_student_ichiran_test.js` | ✗ |  |
| ショートカット | 受講生別クラス一覧 | `Student/index?contact_status=0&courses_by_student=true` |  | ✗ | ✗ | ✗ |  |
| ショートカット | EDI会員データ取込 | `ImportCreditSummary/LWEDIMemberDataImport_AN` |  | ✗ | ✗ | ✗ |  |
| 見込み客連携 | 見込み客連携 | `Student/EWCustomerInterface_AN` |  | ✗ | ✗ | ✗ |  |
| 見込み客連携 | 受講生詳細 | `Student/DetailView` |  | ✓ GessyaIkkatuFlowPage / StudentSaikenkaiFlowPage | ✗ | ✓ `gessya_ikkatu_test.js` / `student_saikenkai_test.js` |  |
| 候補生 | 候補生検索 | `ContactsKouho/LW_AN` |  | ✗ | ✗ | ✗ |  |
| 問合せ | 問合せ登録 | `Student/EditView?contact_status=5` |  | ✓ ContactRegisterPage | ✗ | ✓ `contact_register_test.js` |  |
| 問合せ | 問合せ一覧 | `Student/index?contact_status=5` | `contactList` | ✓ IchiranPage | ✓ `contact_list_ichiran_test.js` | ✗ |  |
| 問合せ | 資料請求一覧 | `Student/index?contact_status=11` |  | ✗ | ✗ | ✗ |  |
| メモ | メモ一覧 | `SMSMemo/ListView?is_memo=1&parent_module=Student` |  | ✗ | ✗ | ✗ |  |
| メモ | メモテンプレート登録 | `SMSMemoTemplates/EditView` |  | ✗ | ✗ | ✗ |  |
| メモ | メモテンプレート一覧 | `SMSMemoTemplates/ListView` |  | ✗ | ✗ | ✗ |  |
| 有効性データ | 有効性データ出力 | `Student/LWValidityDataOutput_AN` | `validityDataOutput` | ✓ IchiranPage | ✓ `validity_data_output_test.js` | ✗ |  |
| 有効性データ | 有効性データ取込 | `Student/EWValidityImport_AN` |  | ✗ | ✗ | ✗ |  |

### 講師（icon: `Teacher`）

| グループ | 画面名 | route | sideMenus キー | Page Object | 一覧テスト | フローテスト | その他テスト |
|---|---|---|---|---|---|---|---|
| ショートカット | 講師登録 | `Teacher/EditView` |  | ✓ TeacherKeiriFlowPage | ✗ | ✓ `teacher_keiri_setup_test.js` |  |
| ショートカット | 講師検索 | `Teacher/index?student_list=false` | `teacherList` | ✓ IchiranPage | ✓ `teacher_list_ichiran_test.js` | ✗ |  |
| ショートカット | 講師一覧 | `Teacher/index?student_list=false` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 講師別受講生一覧 | `Teacher/index?student_list=true` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 講師一覧出力 | `Teacher/EWInterfaceTeacherExport_AN` |  | ✗ | ✗ | ✗ |  |

### コンタクト（icon: `Contacts`）

| グループ | 画面名 | route | sideMenus キー | Page Object | 一覧テスト | フローテスト | その他テスト |
|---|---|---|---|---|---|---|---|
| ショートカット | 顧客登録 | `Contacts/EditView` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 顧客一覧 | `Contacts/index` | `contactModuleList` | ✓ IchiranPage | ✓ `contact_module_list_ichiran_test.js` | ✗ |  |
| 法人/団体 | 法人/団体登録 | `Accounts/EditView` |  | ✗ | ✗ | ✗ |  |
| 法人/団体 | 法人/団体一覧 | `Accounts/index` |  | ✗ | ✗ | ✗ |  |
| スタッフ | スタッフ登録 | `Staff/EditView` |  | ✗ | ✗ | ✗ |  |
| スタッフ | スタッフ一覧 | `Staff/index` |  | ✗ | ✗ | ✗ |  |
| 保護者 | 保護者登録 | `ParentSMS/EditView` |  | ✗ | ✗ | ✗ |  |
| 保護者 | 保護者一覧 | `ParentSMS/index` |  | ✗ | ✗ | ✗ |  |

### 部屋･備品（icon: `Resource`）

| グループ | 画面名 | route | sideMenus キー | Page Object | 一覧テスト | フローテスト | その他テスト |
|---|---|---|---|---|---|---|---|
| ショートカット | 部屋一覧 | `Resource/LWClassroom_AN` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 会議室一覧 | `Resource/index?category=meeting_room` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 部屋・備品一覧 | `Resource/index?category=other` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 店舗一覧 | `School/index` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 部屋登録 | `Resource/EWClassroom_AN` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 会議室登録 | `Resource/EditView?category=meeting_room` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 部屋・備品登録 | `Resource/EditView?category=other` |  | ✗ | ✗ | ✗ |  |
| テキスト在庫 | テキスト一覧 | `Product/index` |  | ✗ | ✗ | ✗ |  |
| テキスト在庫 | テキスト登録 | `Product/EditView` |  | ✗ | ✗ | ✗ |  |
| テキスト在庫 | テキストカテゴリー | `ProductCategory/index` |  | ✗ | ✗ | ✗ |  |
| テキスト在庫 | テキスト仕入・販売一覧 | `ProductInOut/index` |  | ✗ | ✗ | ✗ |  |
| テキスト在庫 | テキスト仕入・販売登録 | `ProductInOut/EditView` |  | ✗ | ✗ | ✗ |  |

### Ｅメール（icon: `Emails`） — バケットE

| グループ | 画面名 | route | sideMenus キー | Page Object | 一覧テスト | フローテスト | その他テスト |
|---|---|---|---|---|---|---|---|
| ショートカット | メール検索 | `Emails/LW_AN` |  | ✗ | ✗ | ✗ |  |
| メールテンプレート | テンプレートカテゴリー作成 | `EmailTemplatesCategory/EditView` |  | ✗ | ✗ | ✗ |  |
| メールテンプレート | テンプレートカテゴリー一覧 | `EmailTemplatesCategory/index` |  | ✗ | ✗ | ✗ |  |
| メールテンプレート | 文面登録 | `EmailTemplates/EditView` |  | ✗ | ✗ | ✗ |  |
| メールテンプレート | 文面テンプレート一覧 | `EmailTemplates/index` |  | ✗ | ✗ | ✗ |  |
| キャンペーン | キャンペーン一覧 | `Campaigns/index` |  | ✗ | ✗ | ✗ |  |
| キャンペーン | キャンペーン作成 | `Campaigns/EditView` |  | ✗ | ✗ | ✗ |  |
| 名簿リスト | 名簿リスト作成 | `ProspectLists/EditView` |  | ✗ | ✗ | ✗ |  |
| 名簿リスト | 名簿リスト一覧 | `ProspectLists/index` |  | ✗ | ✗ | ✗ |  |
| フォーラム | フォーラム一覧 | `Forums/index` |  | ✗ | ✗ | ✗ |  |
| フォーラム | フォーラム作成 | `Forums/EditView` |  | ✗ | ✗ | ✗ |  |
| プロジェクト | 私のプロジェクト | `Project/index?current_user_only=on` |  | ✗ | ✗ | ✗ |  |
| プロジェクト | プロジェクト一覧 | `Project/index` |  | ✗ | ✗ | ✗ |  |
| プロジェクト | プロジェクト作成 | `Project/EditView` |  | ✗ | ✗ | ✗ |  |
| プロジェクト | プロジェクトタスク一覧 | `ProjectTask/index` |  | ✗ | ✗ | ✗ |  |
| プロジェクト | プロジェクトタスク作成 | `ProjectTask/EditView` |  | ✗ | ✗ | ✗ |  |
| タスク | 私のタスク | `Tasks/index?current_user_only=on` |  | ✗ | ✗ | ✗ |  |
| タスク | タスク一覧 | `Tasks/index` |  | ✗ | ✗ | ✗ |  |
| タスク | タスク作成 | `Tasks/EditView` |  | ✗ | ✗ | ✗ |  |
| 連絡 | 私宛の連絡 | `SMSMemo/index?do_not_search_school=1&is_notice=1&my_inbox=1` |  | ✗ | ✗ | ✗ |  |
| 連絡 | 私が送った連絡 | `SMSMemo/index?do_not_search_school=1&is_notice=1&my_sent=1` |  | ✗ | ✗ | ✗ |  |
| 連絡 | 連絡一覧 | `SMSMemo/index?do_not_search_school=1&is_notice=1` |  | ✗ | ✗ | ✗ |  |
| 連絡 | 連絡作成 | `SMSMemo/EditView?is_notice=1` |  | ✗ | ✗ | ✗ |  |
| お知らせ | お知らせ作成 | `SMSMemo/EditView?is_announcement=1` |  | ✗ | ✗ | ✗ |  |
| お知らせ | お知らせ一覧 | `SMSMemo/index?do_not_search_school=1&is_announcement=1` |  | ✗ | ✗ | ✗ |  |
| はがき | はがき作成 | `Postcard/EditView` |  | ✗ | ✗ | ✗ |  |

### 経理（icon: `Keiri`）

| グループ | 画面名 | route | sideMenus キー | Page Object | 一覧テスト | フローテスト | その他テスト |
|---|---|---|---|---|---|---|---|
| ショートカット | 受注＆売上 | `Keiri/index?keiri_report_type=Invoices` | `keiriInvoices` | ✓ IchiranPage | ✓ `keiri_invoices_ichiran_test.js` | ✗ |  |
| ショートカット | 講師給与 | `Keiri/index?teacher` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 未収金 | `Transaction/LWMishukin_AN` | `mishukinList` | ✓ IchiranPage | ✓ `mishukin_list_ichiran_test.js` | ✗ |  |
| ショートカット | 売掛金 | `Transaction/LWUrikakekin_AN` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 月謝一括作成 | `Fee/LWMonthlyFeeCreation_AN` | `monthlyFeeCreation` | ✓ GessyaIkkatuFlowPage | ✗ | ✓ `gessya_ikkatu_test.js` |  |
| ショートカット | 一括入金処理 | `Transaction/MultiUpdateOverdueView` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 源泉税率マスタ | `MasterKanri/DWGensenZeiritsuMaster_AN` |  | ✗ | ✗ | ✗ |  |
| ショートカット | AFS会員番号検索 | `Keiri/LW_ACSMemberNumberSearch_AN` |  | ✗ | ✗ | ✗ |  |
| ショートカット | POSレスポンスエラー一覧 | `PosResponseError/LWPOSResponseErrorList_AN` |  | ✗ | ✗ | ✗ |  |
| 料金 | 料金設定（入会金用） | `Fee/EditView` |  | ✗ | ✗ | ✗ |  |
| 料金 | 料金一覧 | `Fee/index?general=0` |  | ✗ | ✗ | ✗ |  |
| 料金 | 料金一覧(共通) | `Fee/LWCommon_AN` |  | ✗ | ✗ | ✗ |  |
| 料金 | 料金パッケージ作成 | `SalesGroup/EditView?template` |  | ✗ | ✗ | ✗ |  |
| 料金 | 料金パッケージ一覧 | `SalesGroup/index?template=true` |  | ✗ | ✗ | ✗ |  |
| 入出金 | 入出金一覧 | `Transaction/index` | `transactionList` | ✓ IchiranPage | ✓ `transaction_ichiran_test.js` | ✗ |  |
| 入出金 | 本日の入出金 | `Transaction/index?date_selection=t_date` |  | ✗ | ✗ | ✗ |  |
| 入出金 | 口座振替請求データ履歴 | `BankActionsHistory/LWAccountDebitBillData_AN` |  | ✗ | ✗ | ✗ |  |
| 入出金 | 口座振替請求データ読込 | `Transaction/EWImportAccntDebitBill_AN` |  | ✗ | ✗ | ✗ |  |
| 入出金 | 口座振替データ履歴 | `BankActionsHistory/index` |  | ✗ | ✗ | ✗ |  |
| 入出金 | 口座振替スケジュール登録 | `ShimaSchedule/LWAccountTransferScheduleRegistration_AN` |  | ✗ | ✗ | ✗ |  |
| 入出金 | コンビニ収納結果取込 | `Transaction/Import?combini_import=true&step=1` |  | ✗ | ✗ | ✗ |  |
| 入出金 | コンビニ収納結果履歴 | `CombiniActionsHistory/index` |  | ✗ | ✗ | ✗ |  |
| 入出金 | 返金一覧 | `Transaction/LWRefundList_AN` |  | ✗ | ✗ | ✗ |  |
| 入出金 | クレジット請求データ履歴 | `CreditActionsHistory/LW_AN` |  | ✗ | ✗ | ✗ |  |
| 債権買取 | 債権買取請求データ履歴 | `SmbcActionsHistory/LWBillingDataHistory_AN` |  | ✗ | ✗ | ✗ |  |
| 債権買取 | 債権買取状態読込 | `SmbcStateSummary/EWSMBCPurchaseStatusImport_AN` |  | ✗ | ✗ | ✓ `smbc_state_import_test.js` |  |
| 債権買取 | 債権買取状態一覧 | `SmbcContacts/LW_AN` |  | ✗ | ✗ | ✗ |  |
| 講師謝礼 | 講師謝礼計算 | `ShareiNichibetsu/LWKoushiShareiKeisan_AN` |  | ✗ | ✗ | ✗ |  |
| 講師謝礼 | 講師謝礼追加 | `ShareiNichibetsu/EW_KoushiShareiTsuika_AN` |  | ✓ KoushiShareiFlowPage | ✗ | ✓ `koushi_sharei_manual_test.js` / `koushi_sharei_tsuika_test.js` |  |
| 講師謝礼 | 講師謝礼一覧 | `ShareiNichibetsu/LWShareiIchiran_AN` |  | ✓ KoushiShareiFlowPage | ✗ | ✓ `koushi_sharei_manual_test.js` / `koushi_sharei_tsuika_test.js` |  |
| 講師謝礼 | 当月報酬明細 | `Keiri/LWTantouHoushuuMeisai_AN` |  | ✗ | ✗ | ✗ |  |
| 講師謝礼 | 当月支払集計表 | `ShareiNichibetsu/LWTougetsuShiharaiShuukeiHyou_AN` |  | ✗ | ✗ | ✗ |  |
| 講師謝礼 | 講師謝礼支払明細 | `Keiri/LW_TeacherDetailedPayment_AN` |  | ✗ | ✗ | ✗ |  |
| 講師謝礼 | 講師謝礼支払明細メッセージ | `ShareiMeisaiMsg/EW_AN` |  | ✗ | ✗ | ✗ |  |
| 講師謝礼 | 支払調書 | `ShareiNichibetsu/LWShiharaiChousho_AN` |  | ✗ | ✗ | ✗ |  |
| 講師謝礼 | 講師支払調書データ出力 | `ShareiNichibetsu/LW_MPInterfacePaymentRecord_AN` |  | ✗ | ✗ | ✗ |  |
| 講師謝礼 | 講師支払明細出力 | `ShareiNichibetsu/LWTeacherInvoiceOutput_AN` |  | ✗ | ✗ | ✗ |  |
| 料金明細 | 料金明細一覧 | `SalesGroup/index` |  | ✗ | ✗ | ✗ |  |
| 料金明細 | 料金明細一覧詳細 | `SalesGroup/index?list_detailed` |  | ✗ | ✗ | ✗ |  |

### レポート（icon: `SMSReports`） — バケットE

| グループ | 画面名 | route | sideMenus キー | Page Object | 一覧テスト | フローテスト | その他テスト |
|---|---|---|---|---|---|---|---|
| ショートカット | レポート | `SMSReports/report_handler?report_category=student` |  | ✗ | ✗ | ✗ |  |

### メインメニュー（icon: `Main`）

_左サイドバー無し（採取対象外）_

### ヘルプ（icon: `SMSHelp`） — バケットE

| グループ | 画面名 | route | sideMenus キー | Page Object | 一覧テスト | フローテスト | その他テスト |
|---|---|---|---|---|---|---|---|
| ショートカット | 総合ヘルプ | `SMSHelp/index` |  | ✗ | ✗ | ✗ |  |
| ショートカット | ヘルプ検索 | `SMSHelp/Search` |  | ✗ | ✗ | ✗ |  |
| ショートカット | アニメーションヘルプ | `SMSHelp/index?animation=1` |  | ✗ | ✗ | ✗ |  |
| ショートカット | システム体験レッスン | `SMSHelp/index?animation=2` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 初めて使うには | `../include/help/ja/QuickStart.pdf` |  | ✗ | ✗ | ✗ |  |
| ショートカット | 全体説明 | `../include/help/ja/SMSgeneric.pdf` |  | ✗ | ✗ | ✗ |  |
| ショートカット | クイックマニュアル | `../include/help/ja/quick_manual.pdf` |  | ✗ | ✗ | ✗ |  |
| ショートカット | FAQ（よくある質問） | `SMSHelp/index?faq` |  | ✗ | ✗ | ✗ |  |
| ショートカット | ヘルプご使用にあたって | `../include/help/ja/guidance.pdf` |  | ✗ | ✗ | ✗ |  |

### 管理（icon: `Administration`）

_左サイドバー無し（採取対象外）_

<!-- AUTOGEN:menu-table END -->
