# tframe 画面テストカバレッジ分析

最終更新: 2026-05-08

---

## カバー済み（登録・一覧・メニューナビ）

> **環境凡例**: 両 = juku_test・culture_beta 両方 / culture = culture_beta のみ / juku = juku_test のみ

| 系統 | 登録 | 一覧 | メニューナビ | 環境 |
|---|---|---|---|---|
| 受講生 | ✓ | ✓ | ✓ | 両 |
| 講師 | ✓ | ✓ | ✓ | 両 |
| コース | ✓ | ✓ | ✓ | 両 |
| スタッフ | ✓ | ✓ | ✓（master_menu） | 両 |
| 校舎 | ✓ | ✓ | ✓（master_menu） | 両 |
| 教室 | ✓ | ✓ | ✓（master_menu） | 両 |
| 法人・団体 | ✓ | ✓ | ✓（master_menu） | 両 |
| 商品 | ✓ | ✓ | — | culture |
| 調整金（講師謝礼） | ✓ | ✓ | — | culture |
| 料金マスタ | ✓ | ✓ | — | juku |
| 料金パッケージ | ✓ | ✓ | — | juku |
| カレンダー | — | — | ✓ | 両 |
| Eメール | — | — | ✓ | 両 |
| レポート | — | — | ✓ | 両 |
| ヘルプ | — | — | ✓ | 両 |
| 経理 | — | — | ✓ | 両 |

---

## 未テスト画面（sideMenus.js に URL が定義されているもの）

### 受講生系（独自画面）

| 画面名 | URL | 系統 | 環境 |
|---|---|---|---|
| ~~コース別受講生一覧~~ | `student/sw/stByCourse` | 複合一覧 ✓ | 両 |
| ~~受講生別コース一覧~~ | `student/sw/courseBySt` | 複合一覧 ✓ | 両 |
| 口座情報データ取込 | `student/ew/accountInfoDataImport` | インポート | 両 |
| 問合せデータ取込 | `student/ew/stInquiryDataImport` | インポート | 両 |
| 対応履歴一覧 | `infoHistory/sw/_default?menuModule=student` | 対応履歴 | 両 |
| 対応履歴テンプレート登録 | `infoHistoryTemplate/ew/_default?menuModule=student` | 対応履歴 | 両 |
| 対応履歴テンプレート一覧 | `infoHistoryTemplate/sw/_default?menuModule=student` | 対応履歴 | 両 |

### 講師系

| 画面名 | URL | 系統 | 環境 |
|---|---|---|---|
| ~~講師別受講生一覧~~ | `teacher/sw/teByStudent` | 複合一覧 ✓ | 両 |
| 対応履歴一覧 | `infoHistory/sw/_default?menuModule=teacher` | 対応履歴 | 両 |
| 対応履歴テンプレート登録 | `infoHistoryTemplate/ew/_default?menuModule=teacher` | 対応履歴 | 両 |
| 対応履歴テンプレート一覧 | `infoHistoryTemplate/sw/_default?menuModule=teacher` | 対応履歴 | 両 |

### コース系

| 画面名 | URL | 系統 | 環境 |
|---|---|---|---|
| コース別商品一覧 | `course/sw/proByCourse` | 複合一覧 | culture |
| 本日の出席表一覧 | `attendance/sw/_default` | 出席 | 両 |
| 出席表一括出力 | `attendance/sw/attendanceBulkOutput` | 一括処理 | 両 |

### カレンダー系

| 画面名 | URL | 系統 | 環境 |
|---|---|---|---|
| 入退記録登録 | `entranceLog/ew/_default` | 入退室 | 両 |
| 入退記録一覧 | `entranceLog/sw/_default` | 入退室 | 両 |

### Eメール系

| 画面名 | URL | 系統 | 環境 |
|---|---|---|---|
| Eメール一覧 | `email/sw/_default` | メール | 両 |
| Eメールテンプレート登録 | `emailTemplate/ew/_default` | マスター | 両 |
| Eメールテンプレート一覧 | `emailTemplate/sw/_default` | マスター | 両 |
| Eメールテンプレートカテゴリ登録 | `emailTemplateCategory/ew/_default` | マスター | 両 |
| Eメールテンプレートカテゴリ一覧 | `emailTemplateCategory/sw/_default` | マスター | 両 |
| 名簿リスト登録 | `prospectList/ew/_default` | 見込み客管理 | 両 |
| 名簿リスト一覧 | `prospectList/sw/_default` | 見込み客管理 | 両 |
| お知らせ登録 | `announcement/ew/_default` | コミュニケーション | 両 |
| お知らせ一覧 | `announcement/sw/_default` | コミュニケーション | 両 |
| 連絡一覧 | `contact/sw/_default` | コミュニケーション | 両 |
| アンケート登録 | `poll/ew/_default` | フォーム系 | 両 |
| アンケート一覧 | `poll/sw/_default` | フォーム系 | 両 |

### レポート系（集計・可視化）

| 画面名 | URL | 系統 | 環境 |
|---|---|---|---|
| 問合せ・入学・退学レポート | `report/sw/inquiryEnrollCancelReport` | 集計 | 両 |
| 受講生データ組合せレポート | `report/sw/stDataCombinedReport` | 集計 | 両 |
| 受講生スケジュールレポート | `report/sw/stScheduleReport` | スケジュール可視化 | 両 |
| 講師スケジュールレポート | `report/sw/teScheduleReport` | スケジュール可視化 | 両 |

### 経理系（独自性高）

| 画面名 | URL | 系統 | 環境 |
|---|---|---|---|
| 料金一覧 | `smsFee/sw/_default` | 一覧 | 両 |
| 契約一覧 | `smsContract/sw/_default` | 一覧 | 両 |
| 入金一覧 | `smsPayment/sw/_default` | 一覧 | 両 |
| 未収金 | `smsTransaction/sw/unpaidAmountList` | 集計 | 両 |
| 翌月月謝一括作成 | `smsFee/ew/tuitionFeeBulkCreate` | 一括処理 | 両 |
| 一括入金処理 | `smsPayment/sw/batchPayment` | 一括処理 | 両 |
| 入出金一覧 | `smsTransaction/sw/_default` | 一覧 | 両 |
| 口座振替請求データ作成 | `bankTransfer/ew/bankTransferExport` | エクスポート | 両 |
| 口座振替請求データ読込 | `bankTransfer/ew/bankTransferImport` | インポート | 両 |
| 口座振替データ履歴 | `bankActionsHistory/sw/_default` | 履歴 | 両 |

### 講師謝礼系（culture_beta のみ）

> `shareiDetail` / `shareiTotal` モジュール。AGENTS.md の `chosekin_` prefix が指す `shareiDetail` の
> 登録・一覧はカバー済みだが、謝礼計算・合計・明細系は未テスト。

| 画面名 | URL | 系統 |
|---|---|---|
| 講師謝礼計算 | `shareiDetail/sw/teRewardCalc` | 計算 |
| 講師謝礼合計計算 | `shareiTotal/sw/teRewardTotalCalc` | 計算 |
| 講師謝礼合計一覧 | `shareiTotal/sw/_default` | 一覧 |
| 講師謝礼明細（個人） | `shareiDetail/sw/teacherRewardStatement` | 明細 |
| 講師謝礼明細（法人） | `shareiDetail/sw/companyRewardStatement` | 明細 |
| 当月謝礼明細（個人） | `shareiDetail/sw/monthRewardStatement` | 明細 |
| 当月謝礼明細（法人） | `shareiDetail/sw/companyMonthRewardStatement` | 明細 |
| 支払調書 | `shareiTotal/sw/paymentStatement` | 明細 |

---

## 系統別の優先度

| 系統 | 難易度 | 環境 | 備考 |
|---|---|---|---|
| 複合一覧（コース別受講生など） | 低 | 両 | 一覧検索と同パターン、`/tframe-ichiran-dev` で対応可能 |
| コース別商品一覧 | 低 | culture | 複合一覧と同パターン |
| 対応履歴 | 低〜中 | 両 | 登録・一覧の標準パターン（受講生・講師の両メニューに存在） |
| 出席・入退室 | 中 | 両 | 日付・コースを組み合わせた検索 |
| Eメール系 | 中 | 両 | メール送信フローは独自（テンプレート系は標準パターン） |
| レポート | 中 | 両 | 検索条件 → グラフ/表 出力の確認が必要 |
| 経理一覧系（料金・契約・入金） | 中 | 両 | 一覧は標準パターン、金額データの確認が要る |
| 講師謝礼系（明細・計算） | 中〜高 | culture | 計算実行は副作用あり、明細は表示確認のみで可 |
| 一括処理系 | 高 | 両 | 副作用あり、実行条件が複雑 |
| インポート/エクスポート | 高 | 両 | ファイル操作が絡む |
