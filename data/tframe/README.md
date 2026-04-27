# data/tframe/ — テストデータ管理

## ファイル命名規則

| パターン | 用途 |
|---|---|
| `{name}_data.csv` | フル入力テスト（全フィールド） |
| `{name}_data_minimum.csv` | 最小入力テスト（必須フィールドのみ） |
| `{name}_data_{profile}.csv` | プロファイル別上書き（自動適用） |
| `{name}SideMenu.js` | メニュー定義（ナビゲーションテスト用） |
| `_urlPath.js` | BASE_URL からパスプレフィックスを実行時解決（SideMenu 内で使用） |

## 登録テスト — CSV対応表

| テストファイル | フルCSV | 最小CSV | 状態 |
|---|---|---|---|
| `tests/tframe/page/koshi_touroku_test.js` | `koshi_touroku_data.csv` | `koshi_touroku_data_minimum.csv` | フルのみ実装済み、minimum は未組込 |
| `tests/tframe/page/account_touroku_test.js` | `account_touroku_data.csv` | `account_touroku_data_minimum.csv` | フルのみ実装済み、minimum は未組込 |
| `tests/tframe/page/staff_touroku_test.js` | `staff_touroku_data.csv` | `staff_touroku_data_minimum.csv` | フルのみ実装済み、minimum は未組込 |

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

> SideMenu ファイルは `pages/tframe/` に移動しました。

| SideMenuファイル | 参照テスト |
|---|---|
| `pages/tframe/studentSideMenu.js` | `lang_check_test.js`, `dropdown_check_test.js`, `jukusei_test.js` |
| `pages/tframe/teacherSideMenu.js` | `lang_check_test.js`, `dropdown_check_test.js`, `koshi_test.js` |
| `pages/tframe/courseSideMenu.js` | `lang_check_test.js`, `dropdown_check_test.js`, `course_test.js` |
| `pages/tframe/calendarSideMenu.js` | `lang_check_test.js`, `dropdown_check_test.js`, `calendar_test.js` |
| `pages/tframe/emailSideMenu.js` | `lang_check_test.js`, `dropdown_check_test.js`, `email_test.js` |
| `pages/tframe/helpSideMenu.js` | `lang_check_test.js`, `dropdown_check_test.js`, `help_test.js` |
| `pages/tframe/masterSideMenu.js` | `lang_check_test.js`, `dropdown_check_test.js`, `master_menu_test.js` |
| `pages/tframe/accountingSideMenu.js` | `dropdown_check_test.js`, `keiryo_master_test.js` |
| `pages/tframe/reportSideMenu.js` | `lang_check_test.js`, `dropdown_check_test.js`, `report_test.js` |

## その他のデータファイル

| ファイル | 参照テスト | 内容 |
|---|---|---|
| `teacherPaymentReportParams.js` | `flow/96-60_teacher_payment_report_test.js` | 支払レポートの検索パラメータ |
