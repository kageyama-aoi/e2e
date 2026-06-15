---
name: shimamura-html-fetch
description: |
  shimamura の画面 HTML を取得してフォームフィールドを解析するスキル。
  以下のような依頼があったら使用すること：
  - 「〇〇画面のフィールドを確認したい」
  - 新しい Page Object を作る前に検索フォームや登録フォームのフィールド名を調べたい
  - fetch_shimamura_screens.js に新しい画面を追加して HTML を取得したい

  ワークフロー: TARGETS に追記 → fetch 実行 → フィールド解析 → 呼び出し元スキルに返す

  ※ このスキルは単体でも使えるが、将来作成する /shimamura-ichiran-dev や
     /shimamura-registration-dev の Step 1（フォーム確認）として内部的に呼ばれることを想定している
---

# shimamura-html-fetch スキル — フォーム HTML 取得 & フィールド解析

shimamura の画面 HTML を Playwright で取得し、検索・登録フォームの
フィールド名（name 属性・id 属性）を抽出して整理するスキル。

---

## 引数（ARGUMENTS）

```
/shimamura-html-fetch <module> <action> [<name>] [<extra_params>] [<profile>]
```

| 引数 | 説明 | 例 |
|---|---|---|
| `module` | URL の `module=` パラメータ | `Student` |
| `action` | URL の `action=` パラメータ | `index` |
| `name` | 保存ファイル名に使う短い名前（省略時は module_action から自動生成） | `student_search` |
| `extra_params` | 追加クエリパラメータ（省略可） | `contact_status=5&top_menu=1` |
| `profile` | 使用プロファイル（省略時: `shimamura.testgcp`） | `shimamura.traininggcp` |

### URL 構造（参考）

```
{BASE_URL}index.php?module={module}&action={action}&{extra_params}
```

Phase 0/1 で確認済みの主要 URL パターン:

| 画面 | module | action | extra_params |
|---|---|---|---|
| 受講生検索 | `Student` | `index` | `top_menu=1` |
| 候補生一覧 | `Student` | `index` | `contact_status=5&top_menu=1` |
| 候補生登録 | `Student` | `EditView` | `contact_status=5&return_module=Student&return_action=DetailView&from_mainmenu=true` |
| コース別受講生一覧 | `Student` | `index` | `contact_status=0&course_list=true&initial_state&top_menu=1` |
| クラス一覧 | `Course` | `ListView` | `course_list=true&query=true&initial_state` |
| 受注・売上（経理） | `Keiri` | `index` | `keiri_report_type=Invoices&top_menu=1` |
| 入出金一覧 | `Transaction` | `index` | `top_menu=1` |
| 管理トップ | `Administration` | `index` | — |

---

## ワークフロー

### Step 1: 引数を確認する

ARGUMENTS から以下を特定する。

```
module       : Student
action       : index
extra_params : contact_status=5&top_menu=1
name         : contact_list（省略時は {module}_{action} を snake_case に変換）
profile      : shimamura.testgcp（省略時）
directUrl    : {BASE_URL}index.php?module={module}&action={action}&{extra_params}
```

---

### Step 2: fetch_shimamura_screens.js の TARGETS に追記する

`scripts/html/fetch_shimamura_screens.js` の TARGETS 配列を開き、
既に同じ name が存在しない場合に末尾へ追記する。

```javascript
{ name: '{name}',
  hint: '{hint（画面名）}',
  directUrl: `${BASE_URL}index.php?module={module}&action={action}&{extra_params}` },
```

例:
```javascript
{ name: 'contact_list',
  hint: '問合せ一覧（候補生）',
  directUrl: `${BASE_URL}index.php?module=Student&action=index&contact_status=5&top_menu=1` },
```

---

### Step 3: fetch スクリプトを実行する

```powershell
node scripts/html/fetch_shimamura_screens.js {profile}
```

出力例:
```
✓ 保存: scripts/html/shimamura/{name}.html (21 KB)
リンク: 58 件 → scripts/html/shimamura/{name}_links.json
```

**失敗した場合のチェックポイント:**
- HTML が 0 KB → URL が間違っている（BASE_URL の末尾スラッシュは自動補完済み）
- ログインエラー → `SHIMAMURA_USER` / `SHIMAMURA_PASSWORD` / `SHIMAMURA_TANTOUSYA` を確認
- 担当者番号入力でタイムアウト → `SHIMAMURA_TANTOUSYA` が正しいか確認

**shimamura のログインは 2 ステップ:**
1. username（`SHIMAMURA_USER`） + password（`SHIMAMURA_PASSWORD`）でログイン
2. 担当者番号入力画面（`input[name="idnumber"]`）が現れたら `SHIMAMURA_TANTOUSYA` を入力

---

### Step 4: フィールドを抽出して整理する

shimamura は tframe と異なり `name=` 属性が主体（`id=` も混在）。両方を抽出する。

```bash
# name 属性（フォームフィールドの主体）
grep -oE 'name="[^"]+"' scripts/html/shimamura/{name}.html \
  | grep -v 'name="body_only_AN\|is_popup_AN\|is_ajax_AN\|subpanel_\|action\|module\|return_\|from_\|csrf\|_AN"' \
  | sort -u

# id 属性（ラベルやコンテナの参照に使う）
grep -oE 'id="[^"]+"' scripts/html/shimamura/{name}.html \
  | grep -v 'id="body_only_\|id="top_message\|id="top_err\|id="calendar\|id="fixed_\|id="fullscreen\|id="HideHandle\|id="HideMenu\|id="usersMenu\|id="adminMenu\|id="subpanel_\|id="submenu__' \
  | sort -u
```

**出力をテーブルに整理する：**

| フィールド（name/id） | 種別 | ラベル（HTML 内のテキストから推定） | 備考 |
|---|---|---|---|
| `name="course_name"` | text | クラス名 | |
| `name="school_id"` | select | 校舎 | |
| `name="contact_status"` | select | 受講状況 | |

**shimamura 固有の注意点:**

| パターン | 説明 | テストでの扱い |
|---|---|---|
| `input[type="button"][value="検索"]` | 検索ボタン（全画面共通ではない） | `I.click('input[type="button"][value="検索"]')` または `I.click('検索')` |
| `#top_err_info_msg_div` | エラー表示コンテナ（tframe の `#tf-message-summary` 相当） | バリデーション確認に使う |
| `a.listViewTdLinkS1` | 検索結果リンク（一覧画面共通） | 結果確認に使う |
| `input[name="idnumber"]` | 担当者番号入力（ログイン時のみ） | スクリプト内部で処理済み |
| チェックボックス | DOM 構造が標準的でない場合あり | `clickCheckboxByLabelOrName` を使う |

**AJAX 連動の見分け方:**
HTML 内に `onchange` + Ajax 呼び出しがあれば連動している。
→ Page Object では選択後に `I.wait(1)` を追加する。

---

### Step 5: 結果を返す

以下のフォーマットで呼び出し元（または会話）に返す：

```
## {hint} のフォームフィールド

保存先: scripts/html/shimamura/{name}.html

### テキスト入力（name 属性）
- `name="course_name"` — クラス名

### セレクト（name 属性）
- `name="school_id"` — 校舎
- `name="contact_status"` — 受講状況

### 検索ボタン
- `input[type="button"][value="検索"]` または `'検索'`

### 検索結果
- `a.listViewTdLinkS1` — 結果リンク（一覧画面共通）

### エラー表示
- `#top_err_info_msg_div` — エラーメッセージコンテナ

### 備考
- AJAX 連動: なし / あり（〇〇選択後に△△が更新される）
```

---

## 複数画面を一度に取得する場合

複数の画面を指定された場合は、TARGETS への追記をまとめてから
**1回だけ** fetch スクリプトを実行する（ログインを繰り返さないため）。

```javascript
// まとめて追記
{ name: 'student_search', hint: '受講生検索', directUrl: `${BASE_URL}index.php?module=Student&action=index&top_menu=1` },
{ name: 'contact_list',   hint: '候補生一覧', directUrl: `${BASE_URL}index.php?module=Student&action=index&contact_status=5&top_menu=1` },
```

---

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| HTML が 0 KB | URL が不正（module/action の typo など） | URL を直接ブラウザで開いて確認 |
| HTML が 2〜3 KB | ログイン画面にリダイレクトされた | profile の credentials を確認 |
| `#body_only_td` が見つからない | ポップアップ/モーダル画面 | body フォールバックで取得される（正常動作）|
| 担当者番号でタイムアウト | `SHIMAMURA_TANTOUSYA` が未設定 | `.env.{profile}` に `SHIMAMURA_TANTOUSYA=番号` を追加 |
| 既にファイルがある | 過去に取得済み | 上書きして問題なし |
