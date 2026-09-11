# data/tframe/ — テストデータ管理

## ファイル命名規則

| パターン | 用途 |
|---|---|
| `{name}_data.csv` | フル入力テスト（全フィールド） |
| `{name}_data_minimum.csv` | 最小入力テスト（必須フィールドのみ） |
| `{name}_data_{profile}.csv` | プロファイル別上書き（自動適用） |
| `_urlPath.js` | BASE_URL からパスプレフィックスを実行時解決（sideMenus.js 内で使用） |

## 登録テスト — CSV対応表

| テストファイル | フルCSV | 最小CSV | 状態 |
|---|---|---|---|
| `tests/tframe/page/koshi_touroku_test.js` | `koshi_touroku_data.csv` | `koshi_touroku_data_minimum.csv` | フルのみ実装済み、minimum は未組込 |
| `tests/tframe/page/account_touroku_test.js` | `account_touroku_data.csv` | `account_touroku_data_minimum.csv` | フルのみ実装済み、minimum は未組込 |
| `tests/tframe/page/staff_touroku_test.js` | `staff_touroku_data.csv` | `staff_touroku_data_minimum.csv` | フルのみ実装済み、minimum は未組込 |
| `tests/tframe/page/shohin_touroku_test.js` | `shohin_touroku_data.csv` | — | 実装済み |
| `tests/tframe/page/chosekin_touroku_test.js` | `chosekin_touroku_data.csv` | — | 実装済み。school_area_id / school_branch_id / shareiKomoku は環境依存のため CSV に実値を要設定。personId は空欄時にポップアップから先頭の講師を自動選択 |
| `tests/tframe/page/course_touroku_test.js` | `course_touroku_data.csv` | — | 実装済み |
| `tests/tframe/page/jukusei_touroku_test.js` | `jukusei_touroku_data.csv` | — | 実装済み |
| `tests/tframe/page/kyoshitsu_touroku_test.js` | `kyoshitsu_touroku_data.csv` | — | 実装済み |
| `tests/tframe/page/ryokin_master_touroku_test.js` | `ryokin_master_touroku_data.csv` | — | 実装済み（juku_test のみ） |
| `tests/tframe/page/branch_touroku_test.js` | `branch_touroku_data.csv` | — | 実装済み |
| `tests/tframe/page/ryokin_package_touroku_test.js` | `ryokin_package_touroku_data.csv` | — | 実装済み（juku_test のみ） |
| `tests/tframe/page/infoHistoryTemplate_touroku_test.js` | `infoHistoryTemplate_touroku_data.csv` | — | 実装済み。menuModule=student で登録。 |

## 業務フローテスト — CSV対応表

| テストファイル | CSV | 説明 |
|---|---|---|
| `tests/tframe/flow/jukusei_course_link_flow_test.js` | `jukusei_course_link_flow_data.csv` | コース新規登録→受講生新規登録→受講生詳細「コース」タブでのコース紐付けを確認。`courseNameBase` はテスト側でタイムスタンプを付与し一意化。校舎（`school_area_id`）は環境側フォームの都合により未指定 |

## 一覧検索テスト — CSV対応表

| テストファイル | CSV | 説明 |
|---|---|---|
| `tests/tframe/page/jukusei_ichiran_test.js` | `jukusei_ichiran_search_data.csv` | B: 空検索→結果あり確認 / C: 姓で絞り込み→特定レコード確認 |
| `tests/tframe/page/jukusei_ichiran_extract_test.js` | `jukusei_ichiran_extract_data.csv` | POC: 検索条件＋`sortKey`/`sortDir` を指定して検索し、結果テーブル1ページ目を `output/tframe/` に CSV 抽出（ページ送りなし）。`sortKey` は画面表示言語依存の列名（juku_test は英語） |
| `tests/tframe/page/course_ichiran_test.js` | `course_ichiran_search_data.csv` | B: 空検索→結果あり確認 / C: コース名で絞り込み→特定レコード確認 |
| `tests/tframe/page/koshi_ichiran_test.js` | `koshi_ichiran_search_data.csv` | B: 空検索→結果あり確認 / C: 姓で絞り込み→特定レコード確認 |
| `tests/tframe/page/shohin_ichiran_test.js` | `shohin_ichiran_search_data.csv` | B: 空検索→結果あり確認 / C: 商品名で絞り込み→特定レコード確認 |
| `tests/tframe/page/chosekin_ichiran_test.js` | `chosekin_ichiran_search_data.csv` | B: 空検索→結果あり確認 / C: 年度で絞り込み→結果あり確認（名前検索なし） |
| `tests/tframe/page/account_ichiran_test.js` | `account_ichiran_search_data.csv` | B: 空検索→結果あり確認 / C: 法人名で絞り込み→特定レコード確認 |
| `tests/tframe/page/staff_ichiran_test.js` | `staff_ichiran_search_data.csv` | B: 空検索→結果あり確認 / C: 姓で絞り込み→特定レコード確認 |
| `tests/tframe/page/kyoshitsu_ichiran_test.js` | `kyoshitsu_ichiran_search_data.csv` | B: 空検索→結果あり確認 / C: 教室名で絞り込み→特定レコード確認 |
| `tests/tframe/page/branch_ichiran_test.js` | `branch_ichiran_search_data.csv` | B: 空検索→結果あり確認 / C: 校舎名で絞り込み→特定レコード確認 |
| `tests/tframe/page/ryokin_master_ichiran_test.js` | `ryokin_master_ichiran_search_data.csv` | B: 空検索→結果あり確認 / C: 名前で絞り込み→特定レコード確認 ※juku_test のみ |
| `tests/tframe/page/ryokin_package_ichiran_test.js` | `ryokin_package_ichiran_search_data.csv` | B: 空検索→結果あり確認 / C: 名前で絞り込み→特定レコード確認 ※juku_test のみ |
| `tests/tframe/page/fee_ichiran_test.js` | `fee_ichiran_search_data.csv` | 料金一覧（経理）。B: 全期間検索→実データ行確認 / C: 受講生姓で絞り込み。dateFrom/dateTo で日付レンジを広げる（既定は当月）。※juku_beta 主 |
| `tests/tframe/page/contract_ichiran_test.js` | `contract_ichiran_search_data.csv` | 契約一覧（経理）。姓フィールドは `#last_name`。※juku_beta 主 |
| `tests/tframe/page/payment_ichiran_test.js` | `payment_ichiran_search_data.csv` | 入金一覧（経理）。※juku_beta 主 |
| `tests/tframe/page/unpaid_amount_ichiran_test.js` | `unpaid_amount_ichiran_search_data.csv` | 未収金一覧（経理 `smsTransaction/sw/unpaidAmountList`）。※juku_beta 主 |
| `tests/tframe/page/transaction_ichiran_test.js` | `transaction_ichiran_search_data.csv` | 入出金一覧（経理 `smsTransaction/sw/_default`）。※juku_beta 主 |
| `tests/tframe/page/email_ichiran_test.js` | `email_ichiran_search_data.csv` | Eメール一覧。dateFrom/dateTo で送信日レンジを広げる（既定は当月）。※juku_beta 主 |
| `tests/tframe/page/email_template_ichiran_test.js` | `email_template_ichiran_search_data.csv` | Eメールテンプレート一覧。name で絞り込み。※juku_beta 主 |
| `tests/tframe/page/email_template_category_ichiran_test.js` | `email_template_category_ichiran_search_data.csv` | Eメールテンプレートカテゴリ一覧。name で絞り込み。※juku_beta 主 |
| `tests/tframe/page/prospect_list_ichiran_test.js` | `prospect_list_ichiran_search_data.csv` | 名簿リスト一覧。name で絞り込み。※juku_beta 主 |
| `tests/tframe/page/announcement_ichiran_test.js` | `announcement_ichiran_search_data.csv` | お知らせ一覧。dateFrom/dateTo で掲載日レンジを広げる。title で絞り込み。※juku_beta 主 |
| `tests/tframe/page/poll_ichiran_test.js` | `poll_ichiran_search_data.csv` | アンケート一覧。dateFrom/dateTo で回答期間レンジを広げる。title で絞り込み。※juku_beta 主 |
| `tests/tframe/page/report_inquiry_ichiran_test.js` | `report_inquiry_ichiran_search_data.csv` | 問合せ・入学・退学レポート（`report/sw/inquiryEnrollCancelReport`）。年月別集計表。targetYear / personStatus で絞り込み。※culture_beta 主 |
| `tests/tframe/page/report_stdata_ichiran_test.js` | `report_stdata_ichiran_search_data.csv` | 受講生データ組合せレポート（`report/sw/stDataCombinedReport`）。searchItems（組合せ項目）で切替。personStatus は空選択肢なしで既定「受講生」。※culture_beta 主 |
| `tests/tframe/page/report_stschedule_ichiran_test.js` | `report_stschedule_ichiran_search_data.csv` | 受講生スケジュールレポート（`report/sw/stScheduleReport`）。dateFrom/dateTo でレンジを広げる（既定は当月）。cancelStatus / attendanceStatus で絞り込み。※culture_beta 主 |
| `tests/tframe/page/report_teschedule_ichiran_test.js` | `report_teschedule_ichiran_search_data.csv` | 講師スケジュールレポート（`report/sw/teScheduleReport`）。stschedule と同構造。※culture_beta 主 |
| `tests/tframe/page/attendance_ichiran_test.js` | `attendance_ichiran_search_data.csv` | 本日の出席表一覧（`attendance/sw/_default`）。rangeFrom/rangeTo の既定が「本日」のみで広げる。校舎ごとの出席データ在庫差が大きく `branchValue` は「ダミー校舎」固定（東京(b1)・営業等は0件）。※culture_beta のみ（juku_beta はこの branchValue が存在せず0件になる） |
| `tests/tframe/page/bank_actions_history_ichiran_test.js` | `bank_actions_history_ichiran_search_data.csv` | 口座振替データ履歴（`bankActionsHistory/sw/_default`）。フィルタは `inputType` のみでセッション記憶なし。※culture_beta / juku_beta 両対応 |
| `tests/tframe/page/sharei_total_ichiran_test.js` | `sharei_total_ichiran_search_data.csv` | 講師謝礼合計一覧（`shareiTotal/sw/_default`）。計上月（`keijouMonthMonth`）がセッション記憶され特定月に固定されデータ0件になることがあるため、検索前に必ず「すべて」へリセット。※culture_beta のみ |
| `tests/tframe/page/entrance_log_ichiran_test.js` | `entrance_log_ichiran_search_data.csv` | 入退記録一覧（`entranceLog/sw/_default`）。rangeFrom/rangeTo（入退日時）の既定が「本日」のみで広げる。※juku_beta のみ |
| `tests/tframe/page/contact_ichiran_test.js` | `contact_ichiran_search_data.csv` | 連絡一覧（`contact/sw/_default`）。検索条件が多い。**スケジュール開始日・作成日はどちらか一方を7日以内にしないと検索が拒否される**ため、片方のみ広げる。実機確認時点でデータ0件のため `verifyResultsExist`（弱いチェック）を使用。※juku_beta のみ |
| `tests/tframe/page/prospect_list_touroku_test.js` | `prospect_list_touroku_data.csv` | 名簿リスト編集（登録・`prospectList/ew/_default`）。※culture_beta / juku_beta 両対応 |
| `tests/tframe/page/announcement_touroku_test.js` | `announcement_touroku_data.csv` | お知らせ編集（登録・`announcement/ew/_default`）。postStart/postEnd/titleが必須。※culture_beta / juku_beta 両対応 |
| `tests/tframe/page/email_template_category_touroku_test.js` | `email_template_category_touroku_data.csv` | Eメールテンプレートカテゴリ編集（登録・`emailTemplateCategory/ew/_default`）。※culture_beta / juku_beta 両対応 |
| `tests/tframe/page/email_template_touroku_test.js` | `email_template_touroku_data.csv` + `email_template_touroku_data_tframe.juku_beta.csv` | Eメールテンプレート編集（登録・`emailTemplate/ew/_default`）。`categoryId`（既存カテゴリのrecord ID）が必須で環境ごとに値が異なるため、juku_beta 用にプロファイル別CSVを用意。※culture_beta / juku_beta 両対応 |
| `tests/tframe/page/payment_statement_output_test.js` | `payment_statement_output_data.csv` | 支払調書（帳票出力・`shareiTotal/sw/paymentStatement`）。出力ボタンは同画面を `isExportType=output` 付きで再読込する流れでファイルダウンロードが発生するが、中身は未検証。`#tf-message-summary` の成功メッセージのみ確認。※culture_beta のみ |
| `tests/tframe/page/entrance_log_touroku_test.js` | `entrance_log_touroku_data.csv` | 入退記録編集（登録・`entranceLog/ew/_default`）。受講生はポップアップの先頭の結果を選択（`CalendarPage.selectEntranceLogStudent` → `support/tframe/utils.js` の `selectFirstFromPopupPicker`）。保存後は詳細画面ではなく一覧画面へ遷移するため `submitTframeFormAndVerify` は使わず専用の確認ロジックを使用。※juku_beta のみ |
| `tests/tframe/page/stByCourse_ichiran_test.js` | `stByCourse_ichiran_search_data.csv` | B: 空検索→結果あり確認 / C: コース名で絞り込み→結果あり確認（結果列は受講生情報） |
| `tests/tframe/page/courseBySt_ichiran_test.js` | `courseBySt_ichiran_search_data.csv` | B: 空検索→結果あり確認 / C: 受講生姓で絞り込み→結果あり確認（結果列はコース情報） |
| `tests/tframe/page/teByStudent_ichiran_test.js` | `teByStudent_ichiran_search_data.csv` | B: 空検索→結果あり確認 / C: 講師姓で絞り込み→結果あり確認（結果列は受講生情報） |
| `tests/tframe/page/proByCourse_ichiran_test.js` | `proByCourse_ichiran_search_data.csv` | B: 空検索→結果あり確認 / C: 商品名で絞り込み→結果あり確認（culture_beta のみ） |
| `tests/tframe/page/infoHistory_ichiran_test.js` | `infoHistory_ichiran_search_data.csv` | B: 空検索→結果あり確認 / C: 件名で絞り込み→結果あり確認（受講生・講師の両 menuModule） |
| `tests/tframe/page/infoHistoryTemplate_ichiran_test.js` | `infoHistoryTemplate_ichiran_search_data.csv` | B: 空検索→結果あり確認 / C: テンプレート名で絞り込み→結果あり確認（受講生・講師の両 menuModule） |

### minimum.csv の使い方（テスト実装時の方針）

テストファイル内で両方を明示的にロードし、タグで分ける：

```js
const csvFull    = loadCsvWithProfile('koshi_touroku_data', 'tframe');
const csvMinimum = loadCsvWithProfile('koshi_touroku_data_minimum', 'tframe');

Data(csvFull).Scenario('講師を新規登録できる（フル入力）',    { tag: '@full' },    withScenarioLabel(...));
Data(csvMinimum).Scenario('講師を新規登録できる（最小入力）', { tag: '@minimum' }, withScenarioLabel(...));
```

- `--grep @full` でフル入力シナリオのみ実行
- `--grep @minimum` で最小入力シナリオのみ実行
- `loadCsvWithProfile` のプロファイル上書きは minimum.csv にも自動で効く

### minimum.csv の現状と TODO

各 minimum.csv は現時点では列が不完全で、テストに組み込むには必須フィールドの洗い出しが必要。

| ファイル | 現在の列 | TODO |
|---|---|---|
| `koshi_touroku_data_minimum.csv` | `lastName, firstName` のみ | フォームの必須項目を確認して列を追加 |
| `account_touroku_data_minimum.csv` | `name, nameFurigana` のみ | 同上 |
| `staff_touroku_data_minimum.csv` | `lastName, firstName` のみ | 同上 |

## メニュー定義 — SideMenu 対応表

> 旧 `*SideMenu.js` ファイルは `pages/tframe/_common/sideMenus.js` に統合しました（#72）。

`pages/tframe/_common/sideMenus.js` はキー別にメニュー定義をエクスポートしており、各テストが必要なキーだけ require します。

| キー（`sideMenus.js` 内） | 参照テスト |
|---|---|
| `student` | `lang_check_test.js`, `dropdown_check_test.js`, `jukusei_test.js` |
| `teacher` | `lang_check_test.js`, `dropdown_check_test.js`, `koshi_test.js` |
| `course` | `lang_check_test.js`, `dropdown_check_test.js`, `course_test.js` |
| `calendar` | `lang_check_test.js`, `dropdown_check_test.js`, `calendar_test.js` |
| `email` | `lang_check_test.js`, `dropdown_check_test.js`, `email_test.js` |
| `help` | `lang_check_test.js`, `dropdown_check_test.js`, `help_test.js` |
| `master` | `lang_check_test.js`, `dropdown_check_test.js`, `master_menu_test.js` |
| `accounting` | `keiryo_master_test.js` |
| `report` | `lang_check_test.js`, `dropdown_check_test.js`, `report_test.js` |

## その他のデータファイル

| ファイル | 参照テスト | 内容 |
|---|---|---|
| `teacherPaymentReportParams.js` | `flow/96-60_teacher_payment_report_test.js` | 支払レポートの検索パラメータ |
