---
name: tframe-html-fetch
description: |
  tframe の画面 HTML を取得してフォームフィールドを解析するスキル。
  以下のような依頼があったら使用すること：
  - 「〇〇画面のフィールドを確認したい」
  - 新しい Page Object を作る前に検索フォームや登録フォームの input/select ID を調べたい
  - fetch_tframe_forms.js に新しい画面を追加して HTML を取得したい

  ワークフロー: TARGETS に追記 → fetch 実行 → フィールド ID 抽出・整理 → 呼び出し元スキルに返す

  ※ このスキルは単体でも使えるが、/tframe-ichiran-dev や /tframe-registration-dev の
     Step 1（フォーム確認）として内部的に呼ばれることを想定している
---

# tframe-html-fetch スキル — フォーム HTML 取得 & フィールド解析

tframe の画面 HTML を Playwright で取得し、検索・登録フォームの
フィールド ID を抽出して整理するスキル。

---

## 引数（ARGUMENTS）

```
/tframe-html-fetch <r_param> [<hint>] [<profile>]
```

| 引数 | 説明 | 例 |
|---|---|---|
| `r_param` | URL の `r=` パラメータ部分 | `attendance/sw/_default` |
| `hint` | ファイル名に使う短い名前（省略時は r_param から自動生成） | `attendance_list` |
| `profile` | 使用プロファイル（省略時: `tframe.culture_beta`） | `tframe.juku_test` |

---

## ワークフロー

### Step 1: 引数を確認する

ARGUMENTS から以下を特定する。

```
r_param  : attendance/sw/_default
hint     : attendance_list（省略時は r_param の / を _ に変換）
name     : {hint} を snake_case にしたもの（例: attendance_list）
profile  : tframe.culture_beta（省略時）
```

---

### Step 2: fetch_tframe_forms.js の TARGETS に追記する

`scripts/html/fetch_tframe_forms.js` の TARGETS 配列末尾に追記する。

```javascript
{ name: '{name}', hint: '{hint}', directUrl: `${BASE_URL}index.php?r={r_param_encoded}` },
```

**URL エンコードルール:**
- `/` → `%2F`
- `?` → `&`（directUrl では `?r=` の後ろを `&` でつなぐ）

例:
```javascript
// r_param: attendance/sw/_default
{ name: 'attendance_list', hint: '本日の出席表一覧', directUrl: `${BASE_URL}index.php?r=attendance%2Fsw%2F_default` },

// r_param: infoHistory/sw/_default?menuModule=student  
{ name: 'infoHistory_student_list', hint: '対応履歴一覧（受講生）', directUrl: `${BASE_URL}index.php?r=infoHistory%2Fsw%2F_default&menuModule=student` },
```

---

### Step 3: fetch スクリプトを実行する

```powershell
node scripts/html/fetch_tframe_forms.js {profile}
```

出力例:
```
✓ 保存: scripts/html/input/{name}.html (12 KB)
```

失敗した場合（ログインエラー・404 等）はエラーメッセージを確認して対処する。

---

### Step 4: フィールド ID を抽出して整理する

保存された HTML から input / select の id を抽出する。

```bash
grep -oP 'id="[^"]*"' scripts/html/input/{name}.html \
  | grep -v 'wrapper_\|popup_\|_start\|_clear\|_display\|_csrf\|dummy\|rootWidget\|searchBlock\|searchButtonsMainGroup\|buttonsGroup\|otherButtons\|basicFields\|searchFields\|searchResult\|ewButtonsGroup\|ewButtonsMainGroup\|ewFormWrapper\|ewCancelButton\|ewSaveButton\|swSearchButton\|swClearButton\|tf-message' \
  | sort -u
```

**出力をテーブルに整理する：**

| フィールド ID | 種別 | ラベル（HTML内のテキストから推定） | 備考 |
|---|---|---|---|
| `#name` | text | コース名 | |
| `#courseCategory` | select | コースカテゴリ | |
| `#school_area_id` | select | エリア | AJAX連動あり |
| `#school_branch_id` | select | 校舎 | `school_area_id` 変更後に更新 |

**AJAX 連動の見分け方:**
HTML 内に `onchange="tf.ajax.tcnAjax(` があれば連動している。
→ Page Object では `I.selectOption` の後に `I.wait(1)` を追加する。

**ポップアップピッカーの見分け方:**
`popup-picker-start` クラスのボタンがある場合はポップアップ選択式。
→ テストでは使わず空のままにするか、事前に ID を直接セットする。

---

### Step 5: 結果を返す

以下のフォーマットで呼び出し元（または会話）に返す：

```
## {hint} のフォームフィールド

保存先: scripts/html/input/{name}.html

### テキスト入力
- `#name` — コース名

### セレクト
- `#school_area_id` — エリア（AJAX連動: school_branch_id を更新）
- `#school_branch_id` — 校舎

### スキップ推奨（ポップアップ選択式）
- `#courseId` — コース（ポップアップピッカー）

### 備考
- swSearchButton / ewSaveButton は標準セレクタのため Page Object への記載不要
```

---

## 複数画面を一度に取得する場合

複数の `r_param` が指定された場合は、TARGETS への追記をまとめてから
**1回だけ** fetch スクリプトを実行する（ログインを繰り返さないため）。

```javascript
// まとめて追記
{ name: 'attendance_list',       hint: '出席表一覧',   directUrl: `...` },
{ name: 'entranceLog_list',      hint: '入退記録一覧', directUrl: `...` },
{ name: 'entranceLog_touroku',   hint: '入退記録登録', directUrl: `...` },
```

---

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| `✗ エラー: ページ取得失敗` | ログインが必要な画面で未ログイン | `directUrl` を使っているか確認 |
| HTML が 1KB 以下 | リダイレクトされてログイン画面が保存された | profile の credentials が合っているか確認 |
| フィールドが見つからない | 画面が動的に生成される（検索実行後に表示） | HTML を目視確認し、`searchForm` 内の要素を探す |
| 同名ファイルが既にある | 過去に取得済み | 上書きして問題なし（内容が変わっていることがある） |
