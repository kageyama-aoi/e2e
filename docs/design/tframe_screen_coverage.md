# tframe 画面テストカバレッジ分析

最終更新: 2026-05-08

---

## カバー済み（登録・一覧・メニューナビ）

| 系統 | 登録 | 一覧 | メニューナビ |
|---|---|---|---|
| 受講生 | ✓ | ✓ | ✓ |
| 講師 | ✓ | ✓ | ✓ |
| コース | ✓ | ✓ | ✓ |
| スタッフ | ✓ | ✓ | ✓（master_menu） |
| 校舎 | ✓ | ✓ | ✓（master_menu） |
| 教室 | ✓ | ✓ | ✓（master_menu） |
| 法人・団体 | ✓ | ✓ | ✓（master_menu） |
| 商品 | ✓ | ✓ | — |
| 調整金 | ✓ | ✓ | — |
| 料金マスタ | ✓ | ✓ | — |
| 料金パッケージ | ✓ | ✓ | — |
| カレンダー | — | — | ✓ |
| Eメール | — | — | ✓ |
| レポート | — | — | ✓ |
| ヘルプ | — | — | ✓ |
| 経理 | — | — | ✓ |

---

## 未テスト画面（sideMenus.js に URL が定義されているもの）

### 受講生系（独自画面）

| 画面名 | URL | 系統 |
|---|---|---|
| ~~コース別受講生一覧~~ | `student/sw/stByCourse` | 複合一覧 ✓ |
| ~~受講生別コース一覧~~ | `student/sw/courseBySt` | 複合一覧 ✓ |
| 口座情報データ取込 | `student/ew/accountInfoDataImport` | インポート |
| 問合せデータ取込 | `student/ew/stInquiryDataImport` | インポート |
| 対応履歴一覧 | `infoHistory/sw/_default?menuModule=student` | 対応履歴 |
| 対応履歴テンプレート登録 | `infoHistoryTemplate/ew/_default?menuModule=student` | 対応履歴 |
| 対応履歴テンプレート一覧 | `infoHistoryTemplate/sw/_default?menuModule=student` | 対応履歴 |

### 講師系

| 画面名 | URL | 系統 |
|---|---|---|
| ~~講師別受講生一覧~~ | `teacher/sw/teByStudent` | 複合一覧 ✓ |
| 対応履歴一覧 | `infoHistory/sw/_default?menuModule=teacher` | 対応履歴 |
| 対応履歴テンプレート登録 | `infoHistoryTemplate/ew/_default?menuModule=teacher` | 対応履歴 |
| 対応履歴テンプレート一覧 | `infoHistoryTemplate/sw/_default?menuModule=teacher` | 対応履歴 |

### コース系

| 画面名 | URL | 系統 |
|---|---|---|
| 本日の出席表一覧 | `attendance/sw/_default` | 出席 |
| 出席表一括出力 | `attendance/sw/attendanceBulkOutput` | 一括処理 |

### カレンダー系

| 画面名 | URL | 系統 |
|---|---|---|
| 入退記録登録 | `entranceLog/ew/_default` | 入退室 |
| 入退記録一覧 | `entranceLog/sw/_default` | 入退室 |

### Eメール系

| 画面名 | URL | 系統 |
|---|---|---|
| Eメール一覧 | `email/sw/_default` | メール |
| Eメールテンプレート登録 | `emailTemplate/ew/_default` | マスター |
| Eメールテンプレート一覧 | `emailTemplate/sw/_default` | マスター |
| Eメールテンプレートカテゴリ登録 | `emailTemplateCategory/ew/_default` | マスター |
| Eメールテンプレートカテゴリ一覧 | `emailTemplateCategory/sw/_default` | マスター |
| 名簿リスト登録 | `prospectList/ew/_default` | 見込み客管理 |
| 名簿リスト一覧 | `prospectList/sw/_default` | 見込み客管理 |
| お知らせ登録 | `announcement/ew/_default` | コミュニケーション |
| お知らせ一覧 | `announcement/sw/_default` | コミュニケーション |
| 連絡一覧 | （href なし — 要調査） | コミュニケーション |
| アンケート登録 | `poll/ew/_default` | フォーム系 |
| アンケート一覧 | `poll/sw/_default` | フォーム系 |

### レポート系（集計・可視化）

| 画面名 | URL | 系統 |
|---|---|---|
| 問合せ・入学・退学レポート | `report/sw/inquiryEnrollCancelReport` | 集計 |
| 受講生データ組合せレポート | `report/sw/stDataCombinedReport` | 集計 |
| 受講生スケジュールレポート | `report/sw/stScheduleReport` | スケジュール可視化 |
| 講師スケジュールレポート | `report/sw/teScheduleReport` | スケジュール可視化 |

### 経理系（独自性高）

| 画面名 | URL | 系統 |
|---|---|---|
| 料金一覧 | `smsFee/sw/_default` | 一覧 |
| 契約一覧 | `smsContract/sw/_default` | 一覧 |
| 入金一覧 | `smsPayment/sw/_default` | 一覧 |
| 未収金 | `smsTransaction/sw/unpaidAmountList` | 集計 |
| 翌月月謝一括作成 | `smsFee/ew/tuitionFeeBulkCreate` | 一括処理 |
| 一括入金処理 | `smsPayment/sw/batchPayment` | 一括処理 |
| 入出金一覧 | `smsTransaction/sw/_default` | 一覧 |
| 口座振替請求データ作成 | `bankTransfer/ew/bankTransferExport` | エクスポート |
| 口座振替請求データ読込 | `bankTransfer/ew/bankTransferImport` | インポート |
| 口座振替データ履歴 | `bankActionsHistory/sw/_default` | 履歴 |

---

## 系統別の優先度

| 系統 | 難易度 | 備考 |
|---|---|---|
| 複合一覧（コース別受講生など） | 低 | 一覧検索と同パターン、`/tframe-ichiran-dev` で対応可能 |
| 対応履歴 | 低〜中 | 登録・一覧の標準パターン（受講生・講師の両メニューに存在） |
| 出席・入退室 | 中 | 日付・コースを組み合わせた検索 |
| Eメール系 | 中 | メール送信フローは独自（テンプレート系は標準パターン） |
| レポート | 中 | 検索条件 → グラフ/表 出力の確認が必要 |
| 経理一覧系（料金・契約・入金） | 中 | 一覧は標準パターン、金額データの確認が要る |
| 一括処理系 | 高 | 副作用あり、実行条件が複雑 |
| インポート/エクスポート | 高 | ファイル操作が絡む |
