# tframe サイドメニュー 画面一覧 × テスト開発状況マッピング

最終更新: 2026-09-10（初版・Issue #196 / PO無し画面のパターン分類を追記・Issue #197）

実機採取: `tframe.culture_beta`（`https://newculture.e-school.jp/beta/`）/ `tframe.juku_beta`（`https://newsms.e-school.jp/beta/`）を
管理者アカウントでログインし、左サイドメニュー（`#sideBar`）を全アイコン展開して採取。
生データは `scripts/output/tframe_menus/culture_beta.json` / `juku_beta.json`（※ `output/` は gitignore のため付録として本ファイル末尾にも全文を保持）。

---

## このドキュメントの位置づけ

| ドキュメント | 切り口 | 見るもの |
|---|---|---|
| **本ファイル `menu_coverage.md`** | **左サイドメニュー起点**。「メニューに実在する画面」を culture / juku で洗い出し、Page Object 有無とテスト有無を**別列**で突き合わせる | 「この製品のこのメニュー項目、操作できる？テストある？」 |
| `screen_coverage.md` | テストシナリオ起点のカバレッジ分析（系統別の優先度メモ） | 「次に何をテストすべきか」の優先度判断 |
| `pages/tframe/_common/sideMenus.js` | テストの**メニューナビ検証**用のメニュー定義（環境非依存の単一定義） | メニューナビテストが辿る導線 |

`sideMenus.js` は環境非依存の単一定義で「culture にしかない / juku にしかない」を表現できていない。
本ファイルがその差分の一次情報。将来 `sideMenus.js` を環境タグ付きに再構成する際の入力にもなる（→ 末尾「フェーズ2」）。

---

## 凡例

- **C** / **J** … その画面が **culture_beta** / **juku_beta** の左メニューに**項目として存在するか**
  - `●` 存在　`-` メニューに無い　`(空)` グループ枠はあるが項目0件
- **Page Object** …
  - `✓ XxxPage` … その画面専用の操作メソッド（遷移・フォーム入力・検索など）を持つ Page Object がある
  - `△ menu-nav` … 専用操作は無いが、メニューナビ検証 PO（`EmailPage` / `CalendarPage` / `ReportPage` / `HelpPage` / `MasterMenuPage` / `KeiryoMasterPage`）が
    クリック遷移＋スクショ＋（あれば）検索実行まではしている
  - `✗` … Page Object なし
- **テスト** …
  - `✓ xxx_test.js` … その画面を対象にした `*_test.js` がある
  - `△ (メニューナビ)` … 画面単体のテストは無いが、`navigation_after_login_test` / 各アイコンの `*_test.js` のメニュー巡回でクリック遷移は踏まれる
  - `✗` … テストなし

---

## 差分サマリ（片側の製品にしか存在しない画面）

### culture_beta のみ（juku_beta の左メニューに無い）

| 画面 | route | Page Object | テスト |
|---|---|---|---|
| コース別商品一覧 | `course/sw/proByCourse` | ✓ CoursePage | ✓ `proByCourse_ichiran_test.js` |
| 商品登録 | `product/ew/_default` | ✓ ShohinPage | ✓ `shohin_touroku_test.js` |
| 商品一覧 | `product/sw/_default` | ✓ ShohinPage | ✓ `shohin_ichiran_test.js` |
| 調整金登録（講師謝礼グループ） | `shareiDetail/ew/_default` | ✓ ChosekinPage | ✓ `chosekin_touroku_test.js` |
| 講師謝礼一覧 | `shareiDetail/sw/_default` | ✓ ChosekinPage | ✓ `chosekin_ichiran_test.js` |
| 講師謝礼計算 | `shareiDetail/sw/teRewardCalc` | ✗ | ✗ |
| 講師謝礼合計計算 | `shareiTotal/sw/teRewardTotalCalc` | ✗ | ✗ |
| 講師謝礼合計一覧 | `shareiTotal/sw/_default` | ✗ | ✗ |
| 講師謝礼明細（個人） | `shareiDetail/sw/teacherRewardStatement` | ✗ | ✗ |
| 講師謝礼明細（法人） | `shareiDetail/sw/companyRewardStatement` | ✗ | ✗ |
| 当月謝礼明細（個人） | `shareiDetail/sw/monthRewardStatement` | ✗ | ✗ |
| 当月謝礼明細（法人） | `shareiDetail/sw/companyMonthRewardStatement` | ✗ | ✗ |
| 支払調書 | `shareiTotal/sw/paymentStatement` | ✗ | △ API のみ（`flow/96-60_teacher_payment_report_test.js`） |

### juku_beta のみ（culture_beta の左メニューに無い）

| 画面 | route | Page Object | テスト |
|---|---|---|---|
| 口座情報データ取込（取込グループ） | `student/ew/accountInfoDataImport` | ✗ | ✗ |
| 問合せデータ取込 | `student/ew/stInquiryDataImport` | ✗ | ✗ |
| 校舎登録 | `branch/ew/_default` | ✓ BranchPage | ✓ `branch_touroku_test.js` |
| 入退記録登録（入退室グループ） | `entranceLog/ew/_default` | ✗ | ✗ |
| 入退記録一覧 | `entranceLog/sw/_default` | ✗ | ✗ |
| 連絡一覧（連絡グループ） | `contact/sw/_default` | ✗ | ✗ |
| 料金マスタ作成 | `smsFeeMaster/ew/_default` | ✓ RyokinMasterPage | ✓ `ryokin_master_touroku_test.js` |
| 料金マスタ一覧 | `smsFeeMaster/sw/_default` | ✓ RyokinMasterPage | ✓ `ryokin_master_ichiran_test.js` |
| 料金パッケージ作成 | `smsFeeMasterPackage/ew/_default` | ✓ RyokinPackagePage | ✓ `ryokin_package_touroku_test.js` |
| 料金パッケージ一覧 | `smsFeeMasterPackage/sw/_default` | ✓ RyokinPackagePage | ✓ `ryokin_package_ichiran_test.js` |

> **注**: culture_beta の「校舎」グループは **「校舎一覧」のみ**で「校舎登録」項目が無い（`branch/ew` は BranchPage・テストとも存在するが、culture ではメニューから辿れない）。
> juku_beta の「入退室」「連絡」グループには項目があるが、culture_beta では**同名グループが項目0件（空）**で表示される。

---

## アイコン別 マッピング表

### 受講生（icon: `student`）

| 画面名 | route | C | J | Page Object | テスト |
|---|---|:-:|:-:|---|---|
| 受講生登録 | `student/ew/_default` | ● | ● | ✓ JukuseiPage | ✓ `jukusei_touroku_test.js` |
| 受講生一覧 | `student/sw/_default` | ● | ● | ✓ JukuseiPage | ✓ `jukusei_ichiran_test.js` / `jukusei_test.js` / `jukusei_ichiran_extract_test.js`(POC) |
| コース別受講生一覧 | `student/sw/stByCourse` | ● | ● | ✓ JukuseiPage | ✓ `stByCourse_ichiran_test.js` |
| 受講生別コース一覧 | `student/sw/courseBySt` | ● | ● | ✓ JukuseiPage | ✓ `courseBySt_ichiran_test.js` |
| 口座情報データ取込 | `student/ew/accountInfoDataImport` | - | ● | ✗ | ✗ |
| 問合せデータ取込 | `student/ew/stInquiryDataImport` | - | ● | ✗ | ✗ |
| 対応履歴一覧（受講生） | `infoHistory/sw/_default?menuModule=student` | ● | ● | ✓ InfoHistoryPage | ✓ `infoHistory_ichiran_test.js` |
| 対応履歴テンプレート登録（受講生） | `infoHistoryTemplate/ew/_default?menuModule=student` | ● | ● | ✓ InfoHistoryPage | ✓ `infoHistoryTemplate_touroku_test.js` |
| 対応履歴テンプレート一覧（受講生） | `infoHistoryTemplate/sw/_default?menuModule=student` | ● | ● | ✓ InfoHistoryPage | ✓ `infoHistoryTemplate_ichiran_test.js` |

### コース（icon: `course`）

| 画面名 | route | C | J | Page Object | テスト |
|---|---|:-:|:-:|---|---|
| コース登録 | `course/ew/_default` | ● | ● | ✓ CoursePage | ✓ `course_touroku_test.js` |
| コース一覧 | `course/sw/_default` | ● | ● | ✓ CoursePage | ✓ `course_ichiran_test.js` / `course_test.js` |
| コース別商品一覧 | `course/sw/proByCourse` | ● | - | ✓ CoursePage | ✓ `proByCourse_ichiran_test.js` |
| 本日の出席表一覧 | `attendance/sw/_default` | ● | ● | ✗ | ✗ |
| 出席表一括出力 | `attendance/sw/attendanceBulkOutput` | ● | ● | ✗ | ✗ |

### 講師（icon: `teacher`）

| 画面名 | route | C | J | Page Object | テスト |
|---|---|:-:|:-:|---|---|
| 講師登録 | `teacher/ew/_default` | ● | ● | ✓ KoshiPage | ✓ `koshi_touroku_test.js` |
| 講師一覧 | `teacher/sw/_default` | ● | ● | ✓ KoshiPage | ✓ `koshi_ichiran_test.js` / `koshi_test.js` |
| 講師別受講生一覧 | `teacher/sw/teByStudent` | ● | ● | ✓ KoshiPage | ✓ `teByStudent_ichiran_test.js` |
| 対応履歴一覧（講師） | `infoHistory/sw/_default?menuModule=teacher` | ● | ● | ✓ InfoHistoryPage | ✓ `infoHistory_ichiran_test.js` |
| 対応履歴テンプレート登録（講師） | `infoHistoryTemplate/ew/_default?menuModule=teacher` | ● | ● | ✓ InfoHistoryPage | ✗ （CSV に `menuModule=teacher` 行が無い。PO は対応済み） |
| 対応履歴テンプレート一覧（講師） | `infoHistoryTemplate/sw/_default?menuModule=teacher` | ● | ● | ✓ InfoHistoryPage | ✓ `infoHistoryTemplate_ichiran_test.js` |

### マスター（icon: `staff`）

| 画面名 | route | C | J | Page Object | テスト |
|---|---|:-:|:-:|---|---|
| スタッフ登録 | `staff/ew/_default` | ● | ● | ✓ StaffPage | ✓ `staff_touroku_test.js` |
| スタッフ一覧 | `staff/sw/_default` | ● | ● | ✓ StaffPage | ✓ `staff_ichiran_test.js` |
| 校舎登録 | `branch/ew/_default` | - | ● | ✓ BranchPage | ✓ `branch_touroku_test.js` |
| 校舎一覧 | `branch/sw/_default` | ● | ● | ✓ BranchPage | ✓ `branch_ichiran_test.js` |
| 教室登録 | `classroom/ew/_default` | ● | ● | ✓ ClassroomPage | ✓ `kyoshitsu_touroku_test.js` |
| 教室一覧 | `classroom/sw/_default` | ● | ● | ✓ ClassroomPage | ✓ `kyoshitsu_ichiran_test.js` |
| 法人・団体登録 | `account/ew/_default` | ● | ● | ✓ AccountPage | ✓ `account_touroku_test.js` |
| 法人・団体一覧 | `account/sw/_default` | ● | ● | ✓ AccountPage | ✓ `account_ichiran_test.js` |

> マスターメニュー全体の遷移確認は `master_menu_test.js`（MasterMenuPage）。

### カレンダー（icon: `calendar`）

| 画面名 | route | C | J | Page Object | テスト |
|---|---|:-:|:-:|---|---|
| 今日のコース／講師／教室スケジュール | `calendar/sw/_default?calRowType=course\|teacher\|classroom` | ● | ● | △ CalendarPage（menu-nav） | ✓ `calendar_test.js`（表示・基本操作） |
| 入退記録登録 | `entranceLog/ew/_default` | (空) | ● | ✗ | ✗ |
| 入退記録一覧 | `entranceLog/sw/_default` | (空) | ● | ✗ | ✗ |

### Eメール（icon: `email`）

| 画面名 | route | C | J | Page Object | テスト |
|---|---|:-:|:-:|---|---|
| Eメール一覧 | `email/sw/_default` | ● | ● | △ EmailPage（menu-nav） | △ `email_test.js`（表示・メニュー構造検証） |
| Eメールテンプレート登録 | `emailTemplate/ew/_default` | ● | ● | ✗ | △ （`email_test.js` のメニュー巡回のみ） |
| Eメールテンプレート一覧 | `emailTemplate/sw/_default` | ● | ● | ✗ | △ |
| Eメールテンプレートカテゴリ登録 | `emailTemplateCategory/ew/_default` | ● | ● | ✗ | △ |
| Eメールテンプレートカテゴリ一覧 | `emailTemplateCategory/sw/_default` | ● | ● | ✗ | △ |
| 名簿リスト登録 | `prospectList/ew/_default` | ● | ● | ✗ | ✗ |
| 名簿リスト一覧 | `prospectList/sw/_default` | ● | ● | ✗ | ✗ |
| お知らせ登録 | `announcement/ew/_default` | ● | ● | ✗ | ✗ |
| お知らせ一覧 | `announcement/sw/_default` | ● | ● | ✗ | ✗ |
| 連絡一覧 | `contact/sw/_default` | (空) | ● | ✗ | ✗ |
| アンケート登録 | `poll/ew/_default` | ● | ● | ✗ | ✗ |
| アンケート一覧 | `poll/sw/_default` | ● | ● | ✗ | ✗ |

### 経理（icon: `smsFee`）

| 画面名 | route | C | J | Page Object | テスト |
|---|---|:-:|:-:|---|---|
| 料金一覧 | `smsFee/sw/_default` | ● | ● | △ KeiryoMasterPage（menu-nav） | △ `keiryo_master_test.js` |
| 契約一覧 | `smsContract/sw/_default` | ● | ● | △ menu-nav | △ |
| 入金一覧 | `smsPayment/sw/_default` | ● | ● | △ menu-nav | △ |
| 未収金 | `smsTransaction/sw/unpaidAmountList` | ● | ● | △ menu-nav | △ |
| 翌月月謝一括作成 | `smsFee/ew/tuitionFeeBulkCreate` | ● | ● | △ menu-nav | △ |
| 一括入金処理 | `smsPayment/sw/batchPayment` | ● | ● | △ menu-nav | △ |
| 入出金一覧 | `smsTransaction/sw/_default` | ● | ● | △ menu-nav | △ |
| 口座振替請求データ作成 | `bankTransfer/ew/bankTransferExport` | ● | ● | ✗ | ✗ |
| 口座振替請求データ読込 | `bankTransfer/ew/bankTransferImport` | ● | ● | ✗ | ✗ |
| 口座振替データ履歴 | `bankActionsHistory/sw/_default` | ● | ● | ✗ | ✗ |
| **商品登録** | `product/ew/_default` | ● | - | ✓ ShohinPage | ✓ `shohin_touroku_test.js` |
| **商品一覧** | `product/sw/_default` | ● | - | ✓ ShohinPage | ✓ `shohin_ichiran_test.js` |
| **料金マスタ作成** | `smsFeeMaster/ew/_default` | - | ● | ✓ RyokinMasterPage | ✓ `ryokin_master_touroku_test.js` |
| **料金マスタ一覧** | `smsFeeMaster/sw/_default` | - | ● | ✓ RyokinMasterPage | ✓ `ryokin_master_ichiran_test.js` |
| **料金パッケージ作成** | `smsFeeMasterPackage/ew/_default` | - | ● | ✓ RyokinPackagePage | ✓ `ryokin_package_touroku_test.js` |
| **料金パッケージ一覧** | `smsFeeMasterPackage/sw/_default` | - | ● | ✓ RyokinPackagePage | ✓ `ryokin_package_ichiran_test.js` |
| **調整金登録** | `shareiDetail/ew/_default` | ● | - | ✓ ChosekinPage | ✓ `chosekin_touroku_test.js` |
| **講師謝礼一覧** | `shareiDetail/sw/_default` | ● | - | ✓ ChosekinPage | ✓ `chosekin_ichiran_test.js` |
| **講師謝礼計算** | `shareiDetail/sw/teRewardCalc` | ● | - | ✗ | ✗ |
| **講師謝礼合計計算** | `shareiTotal/sw/teRewardTotalCalc` | ● | - | ✗ | ✗ |
| **講師謝礼合計一覧** | `shareiTotal/sw/_default` | ● | - | ✗ | ✗ |
| **講師謝礼明細（個人）** | `shareiDetail/sw/teacherRewardStatement` | ● | - | ✗ | ✗ |
| **講師謝礼明細（法人）** | `shareiDetail/sw/companyRewardStatement` | ● | - | ✗ | ✗ |
| **当月謝礼明細（個人）** | `shareiDetail/sw/monthRewardStatement` | ● | - | ✗ | ✗ |
| **当月謝礼明細（法人）** | `shareiDetail/sw/companyMonthRewardStatement` | ● | - | ✗ | ✗ |
| **支払調書** | `shareiTotal/sw/paymentStatement` | ● | - | ✗ | △ 支払調書データ取得 API のみ（`flow/96-60_teacher_payment_report_test.js`） |

> culture_beta の経理グループ構成 = 経理 / 商品 / 入出金 / 講師謝礼
> juku_beta の経理グループ構成 = 経理 / 料金マスタ作成 / 入出金

### レポート（icon: `report`）

| 画面名 | route | C | J | Page Object | テスト |
|---|---|:-:|:-:|---|---|
| 問合せ・入学・退学レポート | `report/sw/inquiryEnrollCancelReport` | ● | ● | △ ReportPage（menu-nav） | △ `report_test.js` |
| 受講生データ組合せレポート | `report/sw/stDataCombinedReport` | ● | ● | △ menu-nav | △ |
| 受講生スケジュールレポート | `report/sw/stScheduleReport` | ● | ● | △ menu-nav | △ |
| 講師スケジュールレポート | `report/sw/teScheduleReport` | ● | ● | △ menu-nav | △ |

### ヘルプ（icon: `help`）

| 画面名 | route | C | J | Page Object | テスト |
|---|---|:-:|:-:|---|---|
| 全体説明 | `cmn/gw/help` | ● | ● | △ HelpPage（menu-nav） | △ `help_test.js` |
| マニュアル一覧 | `help/sw/manualList` | ● | ● | △ HelpPage（menu-nav） | △ `help_test.js` |

### ホーム（icon: `home` / 左サイドメニュー無し）

| 画面名 | route | C | J | Page Object | テスト |
|---|---|:-:|:-:|---|---|
| My Home | `home/gw/_default` | ● | ● | ✓ HomePage | ✓ `home_test.js` |

---

## `sideMenus.js` との差分（コード修正の入口）

`pages/tframe/_common/sideMenus.js` は実機採取と比べて以下のズレがある。

| 箇所 | `sideMenus.js` の現状 | 実機（採取結果） | 対応方針 |
|---|---|---|---|
| student「取込」グループ | 定義あり（口座情報/問合せデータ取込） | **juku のみ**存在。culture には無い | 環境タグ `envs:['juku']` を付ける |
| course「コース別商品一覧」 | 定義なし | **culture のみ**存在（`course/sw/proByCourse`） | 追加 ＋ `envs:['culture']` |
| staff「校舎」 | 校舎登録＋校舎一覧 | culture は**校舎一覧のみ** | 校舎登録に `envs:['juku']` |
| calendar「入退室」 | entranceLog 登録/一覧を定義 | juku のみ。culture は空グループ | `envs:['juku']` |
| email「連絡」 | `連絡一覧`（`altName` のみ・href なし） | juku は `contact/sw/_default`、culture は空グループ | href 補完 ＋ `envs:['juku']` |
| accounting「料金マスタ作成」 | 定義あり | **juku のみ** | `envs:['juku']` |
| accounting「商品」 | 定義あり | **culture のみ** | `envs:['culture']` |
| accounting「講師謝礼」 | `調整金登録` の1項目のみ | **culture のみ**・実際は10項目（計算/合計/明細/支払調書） | 9項目追加 ＋ `envs:['culture']` |
| accounting グループ順 | 経理→料金マスタ作成→商品→講師謝礼→入出金 | culture: 経理→商品→入出金→講師謝礼 / juku: 経理→料金マスタ作成→入出金 | 環境別の並び順は無理に追わない（項目の有無で十分） |
| calendar スケジュール3項目 | 個別 href（`sideMenuItemForce` 付き） | route 本体は全て `calendar/sw/_default`、`calRowType` で分岐 | 現状維持で可 |

---

## 未カバー画面（テスト開発の発注リスト）

Page Object もテストも無い画面。優先度は `screen_coverage.md` の系統別優先度も参照。

**両製品（culture / juku 共通）**

- 本日の出席表一覧 `attendance/sw/_default` ／ 出席表一括出力 `attendance/sw/attendanceBulkOutput`
- 名簿リスト 登録/一覧 `prospectList/ew|sw/_default`
- お知らせ 登録/一覧 `announcement/ew|sw/_default`
- アンケート 登録/一覧 `poll/ew|sw/_default`
- Eメールテンプレート／カテゴリ 登録/一覧（`emailTemplate*` / `emailTemplateCategory*`）※ menu-nav 巡回のみ
- 口座振替請求データ 作成/読込 `bankTransfer/ew/bankTransferExport|Import` ／ 口座振替データ履歴 `bankActionsHistory/sw/_default`
- 経理一覧系（料金/契約/入金/未収金/入出金）※ menu-nav 巡回のみ、専用検索テストなし
- 一括処理系（翌月月謝一括作成 / 一括入金処理）※ 副作用あり

**juku_beta のみ**

- 口座情報データ取込 `student/ew/accountInfoDataImport` ／ 問合せデータ取込 `student/ew/stInquiryDataImport`
- 入退記録 登録/一覧 `entranceLog/ew|sw/_default`
- 連絡一覧 `contact/sw/_default`

**culture_beta のみ**

- 講師謝礼 計算・合計・明細・支払調書（`shareiDetail/sw/teRewardCalc` ほか8画面）※ 計算実行は副作用あり、明細は表示確認のみで可
- 対応履歴テンプレート登録（講師メニュー）… PO 対応済み。CSV に `menuModule=teacher` 行を足すだけ

---

## PO無し画面のパターン分類（フェーズ1.5・2026-09-10 実機偵察 / Issue #197）

PO無し画面を1画面ずつ開き、フォーム構成（検索フォーム / 入力フォーム / ファイル入力 / 実行ボタン / 結果テーブル）から
着手パターンを分類。**A→B→C** の順で標準パターンによる量産が可能。**D・E** は副作用・ファイル操作のため個別設計。

### A. 一覧検索系 — `/tframe-ichiran-dev` ＋ `IchiranMixin` で量産可（20画面）

検索/クリアボタン＋結果テーブルの標準構造。CSV は「空検索 / 主要条件で絞り込み」の2行が基本。

| 画面 | route | 環境 | 備考 |
|---|---|---|---|
| 出席表一覧 | `attendance/sw/_default` | 両 | 「出席表編集」ボタンあり（編集導線は対象外で可） |
| 名簿リスト一覧 | `prospectList/sw/_default` | 両 | |
| お知らせ一覧 | `announcement/sw/_default` | 両 | |
| アンケート一覧 | `poll/sw/_default` | 両 | |
| Eメール一覧 | `email/sw/_default` | 両 | `EmailPage` に ichiran メソッドを追加する形 |
| Eメールテンプレート一覧 | `emailTemplate/sw/_default` | 両 | |
| Eメールテンプレートカテゴリ一覧 | `emailTemplateCategory/sw/_default` | 両 | |
| 料金一覧 | `smsFee/sw/_default` | 両 | 検索条件多め（select 6） |
| 契約一覧 | `smsContract/sw/_default` | 両 | |
| 入金一覧 | `smsPayment/sw/_default` | 両 | |
| 未収金一覧 | `smsTransaction/sw/unpaidAmountList` | 両 | 「検索結果を名簿リストにする」ボタンあり（対象外で可） |
| 入出金一覧 | `smsTransaction/sw/_default` | 両 | 検索条件多め |
| 口座振替データ履歴 | `bankActionsHistory/sw/_default` | 両 | シンプル |
| 問合せ・入学・退学レポート | `report/sw/inquiryEnrollCancelReport` | 両 | 集計表示 |
| 受講生データ組合せレポート | `report/sw/stDataCombinedReport` | 両 | 組合せ条件多め（select 9） |
| 受講生スケジュールレポート | `report/sw/stScheduleReport` | 両 | |
| 講師スケジュールレポート | `report/sw/teScheduleReport` | 両 | |
| 講師謝礼合計一覧 | `shareiTotal/sw/_default` | culture | |
| 入退記録一覧 | `entranceLog/sw/_default` | juku | |
| 連絡一覧 | `contact/sw/_default` | juku | 検索条件多め |

**推奨サブグループ（1弾＝1テーマ）**: ①名簿リスト/お知らせ/アンケート一覧　②Eメール系一覧　③経理一覧系　④レポート4種　⑤juku入退記録・連絡

### B. 登録・編集フォーム系 — `/tframe-registration-dev` ＋ `KoshiPage` 雛形（6画面）

保存/キャンセルボタンの標準フォーム。

| 画面 | route | 環境 | 備考 |
|---|---|---|---|
| 名簿リスト編集 | `prospectList/ew/_default` | 両 | 小（input2 / select2 / textarea1） |
| お知らせ編集 | `announcement/ew/_default` | 両 | textarea1（本文） |
| Eメールテンプレートカテゴリ編集 | `emailTemplateCategory/ew/_default` | 両 | 小 |
| Eメールテンプレート編集 | `emailTemplate/ew/_default` | 両 | 「挿入」ボタン＝差込変数。本文 textarea |
| アンケート編集 | `poll/ew/_default` | 両 | textarea2・設問行の動的追加あり（**やや複雑**・設計注意） |
| 入退記録編集 | `entranceLog/ew/_default` | juku | input4 / select2 |

### C. 帳票出力系 — 検索フォーム＋出力ボタン（6画面）

検索は A と同じだが、主アクションが「出力/印刷」。**出力結果（PDF/CSV/帳票画面）の検証方式を先に決める**必要あり
（`/shimamura-download-verify` 相当が使えるか要確認）。当面は「検索→出力ボタン押下→エラーが出ないこと＋スクショ」で可。

| 画面 | route | 環境 | 出力ボタン |
|---|---|---|---|
| 出席表一括出力 | `attendance/sw/attendanceBulkOutput` | 両 | 出席表印刷 |
| 講師謝礼明細（個人） | `shareiDetail/sw/teacherRewardStatement` | culture | 謝礼明細出力 |
| 講師謝礼明細（法人） | `shareiDetail/sw/companyRewardStatement` | culture | 謝礼明細出力 |
| 当月謝礼明細（個人） | `shareiDetail/sw/monthRewardStatement` | culture | 謝礼明細出力 |
| 当月謝礼明細（法人） | `shareiDetail/sw/companyMonthRewardStatement` | culture | 謝礼明細出力 |
| 支払調書 | `shareiTotal/sw/paymentStatement` | culture | 支払調書出力 |

### D. 一括処理・計算系 — 副作用あり・個別設計（5画面）

単一の実行ボタンでDB更新やファイル生成。**実行条件・冪等性・テスト環境の状態依存**の設計が必要。
`tests/shimamura/flow/gessya_ikkatu_test.js`（月謝一括作成）の設計が参考になる。

| 画面 | route | 環境 | アクション |
|---|---|---|---|
| 翌月月謝一括作成 | `smsFee/ew/tuitionFeeBulkCreate` | 両 | 対象月選択→一括作成（DB更新） |
| 一括入金処理 | `smsPayment/sw/batchPayment` | 両 | 検索→対象選択→一括入金実行 |
| 口座振替請求データ作成 | `bankTransfer/ew/bankTransferExport` | 両 | 条件選択→請求データ生成（ファイル） |
| 講師謝礼計算 | `shareiDetail/sw/teRewardCalc` | culture | 対象選択→謝礼計算実行 |
| 講師謝礼合計計算 | `shareiTotal/sw/teRewardTotalCalc` | culture | 合計計算実行 |

### E. インポート系 — ファイルアップロード（3画面）

`input[type=file]` ＋「データ取込」ボタン。テスト用の取込CSVを `data/tframe/` に用意し、`file_upload` で流し込む。
`/shimamura-download-verify` の逆（アップロード版）に相当。

| 画面 | route | 環境 | 備考 |
|---|---|---|---|
| 口座振替請求データ読込 | `bankTransfer/ew/bankTransferImport` | 両 | 振替結果ファイルの取込 |
| 口座情報データ取込 | `student/ew/accountInfoDataImport` | juku | |
| 問合せデータ取込 | `student/ew/stInquiryDataImport` | juku | select3（取込種別など）＋ファイル |

### 着手順の提案

1. **第1弾**: バケット A の①〜⑤（サブグループ単位で 取得→PO→CSV→テスト を一気通貫）
2. **第2弾**: バケット B（アンケート編集は最後に回す）
3. **第3弾**: バケット C（出力検証方式を決めてから）
4. **後回し**: バケット D・E（1画面＝1Issue、副作用・ファイル操作の個別設計）

---

## フェーズ2（別Issue候補）

1. `sideMenus.js` を環境タグ付き（`envs: ['culture','juku']`）に再構成 — 消費側（`MenuNavigationMixin` / `EmailPage.verifyMenuStructure` / `master_menu_test` など）の影響調査を伴う
2. 採取スクリプト `scripts/html/fetch_tframe_menus.js`（既存 `scripts/html/extract_side_menu_groups.py` の後継 / プロファイル指定でログイン→`#sideBar` 走査→JSON 出力）
3. 生成スクリプト `scripts/docs/gen_tframe_menu_coverage.js`（メニューカタログ × Page Object の `r=` 参照 × `test_catalog` を join して本ファイルの表を自動生成、`--check` でドリフト検出、`.githooks/pre-commit` に組込み）

---

## 付録: 実機採取したメニュー構成全文（2026-09-10）

### culture_beta（`https://newculture.e-school.jp/beta/`）

```
受講生
  受講生
    受講生登録                       student/ew/_default
    受講生一覧                       student/sw/_default
    コース別受講生一覧               student/sw/stByCourse
    受講生別コース一覧               student/sw/courseBySt
  対応履歴
    対応履歴一覧                     infoHistory/sw/_default?menuModule=student
    対応履歴テンプレート登録         infoHistoryTemplate/ew/_default?menuModule=student
    対応履歴テンプレート一覧         infoHistoryTemplate/sw/_default?menuModule=student
コース
  コース
    コース登録                       course/ew/_default
    コース一覧                       course/sw/_default
    コース別商品一覧                 course/sw/proByCourse
    本日の出席表一覧                 attendance/sw/_default
    出席表一括出力                   attendance/sw/attendanceBulkOutput
講師
  講師
    講師登録                         teacher/ew/_default
    講師一覧                         teacher/sw/_default
    講師別受講生一覧                 teacher/sw/teByStudent
  対応履歴
    対応履歴一覧                     infoHistory/sw/_default?menuModule=teacher
    対応履歴テンプレート登録         infoHistoryTemplate/ew/_default?menuModule=teacher
    対応履歴テンプレート一覧         infoHistoryTemplate/sw/_default?menuModule=teacher
マスター
  スタッフ
    スタッフ登録                     staff/ew/_default
    スタッフ一覧                     staff/sw/_default
  校舎
    校舎一覧                         branch/sw/_default
  教室
    教室登録                         classroom/ew/_default
    教室一覧                         classroom/sw/_default
  法人・団体
    法人・団体登録                   account/ew/_default
    法人・団体一覧                   account/sw/_default
カレンダー
  カレンダー
    今日のコーススケジュール         calendar/sw/_default?calRowType=course
    今日の講師スケジュール           calendar/sw/_default?calRowType=teacher
    今日の教室スケジュール           calendar/sw/_default?calRowType=classroom
  入退室
    （項目なし・空グループ）
Eメール
  Eメール
    Eメール一覧                      email/sw/_default
    Eメールテンプレート登録          emailTemplate/ew/_default
    Eメールテンプレート一覧          emailTemplate/sw/_default
    Eメールテンプレートカテゴリ登録  emailTemplateCategory/ew/_default
    Eメールテンプレートカテゴリ一覧  emailTemplateCategory/sw/_default
  名簿リスト
    名簿リスト登録                   prospectList/ew/_default
    名簿リスト一覧                   prospectList/sw/_default
  お知らせ
    お知らせ登録                     announcement/ew/_default
    お知らせ一覧                     announcement/sw/_default
  連絡
    （項目なし・空グループ）
  アンケート
    アンケート登録                   poll/ew/_default
    アンケート一覧                   poll/sw/_default
経理
  経理
    料金一覧                         smsFee/sw/_default
    契約一覧                         smsContract/sw/_default
    入金一覧                         smsPayment/sw/_default
    未収金                           smsTransaction/sw/unpaidAmountList
    翌月月謝一括作成                 smsFee/ew/tuitionFeeBulkCreate
    一括入金処理                     smsPayment/sw/batchPayment
  商品
    商品登録                         product/ew/_default
    商品一覧                         product/sw/_default
  入出金
    入出金一覧                       smsTransaction/sw/_default
    口座振替請求データ作成           bankTransfer/ew/bankTransferExport
    口座振替請求データ読込           bankTransfer/ew/bankTransferImport
    口座振替データ履歴               bankActionsHistory/sw/_default
  講師謝礼
    講師謝礼計算                     shareiDetail/sw/teRewardCalc
    調整金登録                       shareiDetail/ew/_default
    講師謝礼一覧                     shareiDetail/sw/_default
    講師謝礼合計計算                 shareiTotal/sw/teRewardTotalCalc
    講師謝礼合計一覧                 shareiTotal/sw/_default
    講師謝礼明細（個人）             shareiDetail/sw/teacherRewardStatement
    講師謝礼明細（法人）             shareiDetail/sw/companyRewardStatement
    当月謝礼明細（個人）             shareiDetail/sw/monthRewardStatement
    当月謝礼明細（法人）             shareiDetail/sw/companyMonthRewardStatement
    支払調書                         shareiTotal/sw/paymentStatement
レポート
  受講生レポート
    問合せ・入学・退学レポート       report/sw/inquiryEnrollCancelReport
    受講生データ組合せレポート       report/sw/stDataCombinedReport
    受講生スケジュールレポート       report/sw/stScheduleReport
  講師レポート
    講師スケジュールレポート         report/sw/teScheduleReport
ヘルプ
  ヘルプ
    全体説明                         cmn/gw/help
    マニュアル一覧                   help/sw/manualList
```

### juku_beta（`https://newsms.e-school.jp/beta/`）

```
受講生
  受講生
    受講生登録                       student/ew/_default
    受講生一覧                       student/sw/_default
    コース別受講生一覧               student/sw/stByCourse
    受講生別コース一覧               student/sw/courseBySt
  取込
    口座情報データ取込               student/ew/accountInfoDataImport
    問合せデータ取込                 student/ew/stInquiryDataImport
  対応履歴
    対応履歴一覧                     infoHistory/sw/_default?menuModule=student
    対応履歴テンプレート登録         infoHistoryTemplate/ew/_default?menuModule=student
    対応履歴テンプレート一覧         infoHistoryTemplate/sw/_default?menuModule=student
コース
  コース
    コース登録                       course/ew/_default
    コース一覧                       course/sw/_default
    本日の出席表一覧                 attendance/sw/_default
    出席表一括出力                   attendance/sw/attendanceBulkOutput
講師
  講師
    講師登録                         teacher/ew/_default
    講師一覧                         teacher/sw/_default
    講師別受講生一覧                 teacher/sw/teByStudent
  対応履歴
    対応履歴一覧                     infoHistory/sw/_default?menuModule=teacher
    対応履歴テンプレート登録         infoHistoryTemplate/ew/_default?menuModule=teacher
    対応履歴テンプレート一覧         infoHistoryTemplate/sw/_default?menuModule=teacher
マスター
  スタッフ
    スタッフ登録                     staff/ew/_default
    スタッフ一覧                     staff/sw/_default
  校舎
    校舎登録                         branch/ew/_default
    校舎一覧                         branch/sw/_default
  教室
    教室登録                         classroom/ew/_default
    教室一覧                         classroom/sw/_default
  法人・団体
    法人・団体登録                   account/ew/_default
    法人・団体一覧                   account/sw/_default
カレンダー
  カレンダー
    今日のコーススケジュール         calendar/sw/_default?calRowType=course
    今日の講師スケジュール           calendar/sw/_default?calRowType=teacher
    今日の教室スケジュール           calendar/sw/_default?calRowType=classroom
  入退室
    入退記録登録                     entranceLog/ew/_default
    入退記録一覧                     entranceLog/sw/_default
Eメール
  Eメール
    Eメール一覧                      email/sw/_default
    Eメールテンプレート登録          emailTemplate/ew/_default
    Eメールテンプレート一覧          emailTemplate/sw/_default
    Eメールテンプレートカテゴリ登録  emailTemplateCategory/ew/_default
    Eメールテンプレートカテゴリ一覧  emailTemplateCategory/sw/_default
  名簿リスト
    名簿リスト登録                   prospectList/ew/_default
    名簿リスト一覧                   prospectList/sw/_default
  お知らせ
    お知らせ登録                     announcement/ew/_default
    お知らせ一覧                     announcement/sw/_default
  連絡
    連絡一覧                         contact/sw/_default
  アンケート
    アンケート登録                   poll/ew/_default
    アンケート一覧                   poll/sw/_default
経理
  経理
    料金一覧                         smsFee/sw/_default
    契約一覧                         smsContract/sw/_default
    入金一覧                         smsPayment/sw/_default
    未収金                           smsTransaction/sw/unpaidAmountList
    翌月月謝一括作成                 smsFee/ew/tuitionFeeBulkCreate
    一括入金処理                     smsPayment/sw/batchPayment
  料金マスタ作成
    料金マスタ作成                   smsFeeMaster/ew/_default
    料金マスタ一覧                   smsFeeMaster/sw/_default
    料金パッケージ作成               smsFeeMasterPackage/ew/_default
    料金パッケージ一覧               smsFeeMasterPackage/sw/_default
  入出金
    入出金一覧                       smsTransaction/sw/_default
    口座振替請求データ作成           bankTransfer/ew/bankTransferExport
    口座振替請求データ読込           bankTransfer/ew/bankTransferImport
    口座振替データ履歴               bankActionsHistory/sw/_default
レポート
  受講生レポート
    問合せ・入学・退学レポート       report/sw/inquiryEnrollCancelReport
    受講生データ組合せレポート       report/sw/stDataCombinedReport
    受講生スケジュールレポート       report/sw/stScheduleReport
  講師レポート
    講師スケジュールレポート         report/sw/teScheduleReport
ヘルプ
  ヘルプ
    全体説明                         cmn/gw/help
    マニュアル一覧                   help/sw/manualList
```
