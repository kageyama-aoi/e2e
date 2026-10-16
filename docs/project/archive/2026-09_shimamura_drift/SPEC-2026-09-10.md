# SPEC - プルダウン選択肢スキャンテスト

## 概要
各アイコンページ配下の全遷移画面上にある `<select>` 要素を検出し、
選択肢の一覧をログ・スクショで記録する一時テスト。

---

## スコープ

### 対象アイコン（全8件）
- 受講生 / コース / 講師 / マスター / カレンダー / Eメール / レポート / ヘルプ

### 対象ページ
- 各アイコン配下のサブメニューページ全件
- 検索結果ページ・詳細ページ・詳細タブページも含む（MenuNavigationMixin の通常フローで遷移するすべての画面）

### 除外
- **アイコン押下直後の画面**（clickXxxIcon() 後、サブメニュー遷移前のランディング画面）

---

## 検出対象

- DOM上の `<select>` 要素
- `getComputedStyle` で `display !== 'none'` かつ `visibility !== 'hidden'` のもの（可視状態のみ）
- 1ページに複数ある場合はすべて処理する

---

## 動作仕様（1ページあたりの処理）

1. **`<select>` 要素を全件取得**（`I.executeScript` で DOM から収集）
2. `<select>` が0件のページ → `I.say('【プルダウンなし】...')` のみ、スクショなし
3. `<select>` が1件以上のページ → 各 `<select>` ごとに以下を実施：
   a. `<select>` の識別情報を取得（`name` / `id` / index）
   b. `<select>` の選択肢一覧（`option` のテキスト）を収集
   c. **JS で一時的な選択肢オーバーレイを描画**して「開いた状態」を再現（後述）
   d. スクリーンショット保存（ファイル名に select 識別子を含める）
   e. オーバーレイを削除
   f. `I.say()` でコンソールに選択肢一覧を出力
4. **JSON ファイルに追記**（ページ名・select識別子・選択肢一覧を記録）

---

## スクリーンショットについての技術的注意

Playwright（Chromium）ではネイティブ `<select>` の開いた状態は OS レベルの UI で描画されるため、
そのままでは撮影不可。そのため下記の方法で「開いた状態」を再現する：

**JS オーバーレイ方式：**
- `<select>` の位置に絶対配置の `<ul>` を生成して選択肢テキストを表示
- スクロールして `<select>` が画面内に入るよう調整してからスクショ
- スクショ後にオーバーレイを削除

---

## ログ仕様

### コンソール出力（`I.say`）
```
【プルダウン検出】受講生登録 / select[name="status"] / 選択肢数: 3
  - (選択なし)
  - 在籍中
  - 退会済み
```

### JSON ファイル
- 保存先：テスト出力ディレクトリ直下 `dropdown_options.json`
- 形式：
```json
[
  {
    "page": "受講生登録",
    "selector": "select[name='status']",
    "options": ["(選択なし)", "在籍中", "退会済み"]
  }
]
```

---

## スクリーンショット命名規則

```
DD_CHECK_[ページ名]_[select識別子].png
```

例：
```
DD_CHECK_受講生登録_select_status.png
DD_CHECK_受講生一覧_select_0.png      ← name/id がない場合は index
```

---

## ファイル構成

| ファイル | 役割 |
|---|---|
| `tests/tframe/dropdown_check_test.js` | テスト本体（一時的） |
| `bat/tframe_run_dropdown_check.bat` | 起動用 BAT |

---

## 実装方針

- `MenuNavigationMixin` の `_onPageLoaded` フックを利用
- `createMenuNavigationMixin.setPageLoadedCallback(...)` で各ページ遷移後に `scanDropdowns(I, pageName)` を呼ぶ
- `lang_check_test.js` と同様の構造で実装
- JSON ファイルはテスト開始時に初期化し、遷移ごとに追記

---

## 削除方法（一時テスト）

以下の2ファイルを削除するだけで完結。他ファイルへの影響なし：
- `tests/tframe/dropdown_check_test.js`
- `bat/tframe_run_dropdown_check.bat`

---

## 確定済み仕様

- [x] JSON ファイルの保存先：**テスト実行ディレクトリ内**（`saveLogToFile` 等で出力ディレクトリに保存）
- [x] オーバーレイの見た目：**白背景＋黒テキストのシンプルなリスト表示**
