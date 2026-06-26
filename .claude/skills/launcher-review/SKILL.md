---
name: launcher-review
description: |
  run/run_gui.py を修正した後にレイアウトの整合性を静的にレビューするスキル。
  以下のような作業をした後に使うこと：
  - ボタンやウィジェットを追加・削除した
  - 左ペインの構造を変更した
  - ウィンドウサイズ (geometry/minsize) を変更した
---

# GUIランチャー レイアウトレビュースキル

`run/run_gui.py` を読んで、レイアウト上の問題を静的にチェックする。

---

## 実行手順

### Step 1: 構文チェック

```bash
python -m py_compile run/run_gui.py && echo "OK"
```

エラーがあれば即報告してここで止める。

---

### Step 2: run_gui.py を読んで以下の観点を確認する

`run/run_gui.py` を Read ツールで全文読み込む。

---

### Step 3: チェック項目

#### A. ボタンの親フレームが left_bot になっているか

`_build_ui` 内のボタンウィジェット（ttk.Button）をすべてリストアップし、
それぞれの親フレーム引数を確認する。

**正しい形**:
```python
left_bot = ttk.Frame(left)
left_bot.pack(fill=tk.X, ...)

btn_frame = ttk.Frame(left_bot)   # ← left_bot が親
```

**NG パターン（ボタンが切れる原因）**:
```python
btn_frame = ttk.Frame(left)        # ← left や left_top が親になっている
btn_frame.grid(row=12, ...)        # ← grid で配置されている
```

---

#### B. left_top に rowconfigure が設定されているか

`left_top.rowconfigure(3, weight=...)` と `left_top.rowconfigure(7, weight=...)` が
存在するかを確認する。

これがないとテストリスト・プロファイルリストが固定高さになり、
ウィンドウを広げてもリストが伸びない（かつ縮小時にボタンを押し出す）。

**正しい形**:
```python
left_top.rowconfigure(3, weight=2)  # テストリスト行
left_top.rowconfigure(7, weight=1)  # プロファイルリスト行
```

---

#### C. geometry と minsize の整合性

`self.geometry(...)` と `self.minsize(...)` の値を読み取り、
以下を確認する：

1. `geometry` の高さ ≥ `minsize` の高さ（初期サイズが最小サイズより大きい）
2. ボタン固定エリア（`left_bot`）の推定高さを計算する

   **left_bot 内の行数カウント**:
   - btn_frame 内の grid 行数（row=0, 1, 2, ... の最大値 + 1）
   - 各行の高さ目安: チェックボックス行 ≈ 28px、ボタン行 ≈ 30px
   - pady の合計も加算

   **minsize の高さから逆算した left_top の最大高さ**:
   ```
   left_top の最大高さ = minsize高さ - タイトルラベル(35px) - ステータスバー(25px) - left_bot高さ - 余白(20px)
   ```

   left_top 内に収まるべき固定ウィジェット（テストリスト・プロファイルリスト以外）の
   合計高さが left_top の最大高さを超えていれば警告する。

---

#### D. 新規追加ボタンが left_bot に入っているか（差分確認）

`git diff run/run_gui.py` を実行し、`+` 行に `ttk.Button` が含まれる場合は
その前後 5 行を確認して親フレームが `left_bot` 系（btn_frame など）になっているかチェックする。

---

### Step 4: 結果を報告する

以下の形式でまとめる：

```
## ランチャーレイアウトレビュー結果

### A. ボタン親フレーム
✅ / ⚠️ ... （問題の説明）

### B. rowconfigure
✅ / ⚠️ ... （問題の説明）

### C. geometry / minsize
✅ / ⚠️ ... （問題の説明）
  geometry: 1100x720
  minsize:  860x600
  left_bot 推定高さ: ~180px
  left_top 最小利用可能高さ: ~480px

### D. 新規追加ボタン
✅ / ⚠️ ... （問題の説明）

### 総合判定
✅ 問題なし  または  ⚠️ N 件の問題があります
```

問題があれば修正案のコードスニペットも提示する。

---

## 重要な構造メモ（2026-06-26 時点）

```
RunnerApp._build_ui()
├── タイトルラベル (pack)
├── body (pack fill=BOTH expand=True)
│   ├── left (pack fill=Y)           ← 左ペイン
│   │   ├── left_top (pack fill=BOTH expand=True)
│   │   │   ├── row=0  Product ラベル
│   │   │   ├── row=1  Product コンボ
│   │   │   ├── row=2  Test File ラベル
│   │   │   ├── row=3  テストリスト  ← rowconfigure weight=2
│   │   │   ├── row=4  横スクロールバー
│   │   │   ├── row=5  説明ラベル
│   │   │   ├── row=6  Profile ラベル
│   │   │   ├── row=7  プロファイルリスト  ← rowconfigure weight=1
│   │   │   ├── row=8  Grep ラベル
│   │   │   ├── row=9  Grep コンボ
│   │   │   ├── row=10 Grep ヒント
│   │   │   └── row=11 機能番号フィルター
│   │   └── left_bot (pack fill=X)   ← ボタン固定エリア
│   │       └── btn_frame
│   │           ├── row=0 デバッグチェックボックス
│   │           ├── row=1 Run Test / Stop
│   │           ├── row=2 Open Allure / Open CSV
│   │           ├── row=3 Login & Hold
│   │           └── row=4 Settings (.env)
│   └── right (pack fill=BOTH expand=True)
│       ├── Command 表示
│       ├── Log エリア
│       └── ダウンロードパネル（動的表示）
└── ステータスバー (pack fill=X)
```

新しいボタンを追加する際は必ず `btn_frame` (= `left_bot` の子) に grid で追加し、
`left_top` や `left` に直接追加しないこと。
