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

## 一覧検索テスト — CSV対応表

| テストファイル | CSV | 説明 |
|---|---|---|
| `tests/tframe/page/jukusei_ichiran_test.js` | `jukusei_ichiran_search_data.csv` | B: 空検索→結果あり確認 / C: 姓で絞り込み→特定レコード確認 |
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
