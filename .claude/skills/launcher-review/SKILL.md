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

#### A. ボタンの親フレームが left_bot になっているか、スタイルが指定されているか

`_build_ui` 内のボタンウィジェット（ttk.Button）をすべてリストアップし、
それぞれの親フレーム引数と `style=` 引数を確認する。

**正しい形**:
```python
left_bot = ttk.Frame(left)
left_bot.grid(row=2, column=0, sticky='ew')

btn_frame = ttk.Frame(left_bot)   # ← left_bot が親
ttk.Button(btn_frame, text='...', style=BTN_SECONDARY, command=...)  # ← style 必須
```

**NG パターン（ボタンが切れる原因）**:
```python
btn_frame = ttk.Frame(left)        # ← left や test_group/cond_group が親になっている
btn_frame.grid(row=12, ...)        # ← grid で配置されている
```

**NG パターン（見た目の一貫性が崩れる）**:
```python
ttk.Button(btn_frame, text='...', command=...)  # ← style 未指定（素の ttk.Button）
```
`style=` は `BTN_PRIMARY`（1ウィンドウにつき主操作1つだけ）/ `BTN_SECONDARY`（標準）/
`BTN_TERTIARY`（Cancel・閉じる等）のいずれかを指定すること。詳細は `run/README.md`「UI テーマについて」。

---

#### B. test_group / cond_group に rowconfigure が設定されているか

左ペインはグルーピング用に `test_group`（テスト選択）と `cond_group`（実行条件）の
2つの `ttk.LabelFrame` に分かれている。それぞれ内部のリスト行に rowconfigure が
設定されているかを確認する。

これがないとテストリスト・プロファイルリストが固定高さになり、
ウィンドウを広げてもリストが伸びない（かつ縮小時にボタンを押し出す）。

**正しい形**:
```python
test_group.rowconfigure(3, weight=1)  # テストリスト行
cond_group.rowconfigure(1, weight=1)  # プロファイルリスト行
```

さらに `left`（`test_group` / `cond_group` / `left_bot` を grid で縦に並べる親）にも
`left.rowconfigure(0, weight=2)` / `left.rowconfigure(1, weight=1)` が設定され、
2グループ間の伸び縮み比率を制御していることを確認する。

---

#### C. geometry と minsize の整合性

`self.geometry(...)` と `self.minsize(...)` の値を読み取り、
以下を確認する：

1. `geometry` の高さ ≥ `minsize` の高さ（初期サイズが最小サイズより大きい）
2. ボタン固定エリア（`left_bot`）の推定高さを計算する

   **left_bot 内の行数カウント**:
   - btn_frame 内の grid 行数（row=0, 1, 2, ... の最大値 + 1）
   - 各行の高さ目安: チェックボックス行 ≈ 28px、`BTN_SECONDARY` 行 ≈ 32px、`BTN_PRIMARY` 行 ≈ 38px
   - pady の合計も加算

   **minsize の高さから逆算した左ペイン全体の最大高さ**:
   ```
   左ペイン最大高さ = minsize高さ - タイトルラベル(35px) - ステータスバー(25px) - left_bot高さ - 余白(20px)
   ```

   `test_group` + `cond_group`（それぞれ LabelFrame の見出し・padding 込み、目安 +20px/グループ）の
   固定ウィジェット（テストリスト・プロファイルリスト以外）の合計高さが
   左ペイン最大高さを超えていれば警告する。

   目視より確実な方法として、`RunnerApp` を `withdraw()` した状態で構築し
   `update_idletasks()` 後に `winfo_reqheight()` を測るスクリプト検証も使える
   （`/launcher-gui-design` スキルの Step 6 参照）。

---

#### D. 新規追加ボタンが left_bot に入っているか（差分確認）

`git diff run/run_gui.py` を実行し、`+` 行に `ttk.Button` が含まれる場合は
その前後 5 行を確認して親フレームが `left_bot` 系（btn_frame など）になっているか、
`style=BTN_*` が指定されているかをチェックする。

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

## 重要な構造メモ（2026-07-21 時点）

```
RunnerApp._build_ui()
├── タイトルラベル (pack)
├── body (pack fill=BOTH expand=True)
│   ├── left (grid, columnconfigure(0)=1, rowconfigure(0)=2, rowconfigure(1)=1) ← 左ペイン
│   │   ├── test_group = LabelFrame('テスト選択') (grid row=0, sticky=nsew)
│   │   │   ├── row=0  Product ラベル
│   │   │   ├── row=1  Product コンボ
│   │   │   ├── row=2  Test File ラベル
│   │   │   ├── row=3  テストリスト  ← rowconfigure weight=1
│   │   │   ├── row=4  横スクロールバー
│   │   │   └── row=5  説明ラベル
│   │   ├── cond_group = LabelFrame('実行条件') (grid row=1, sticky=nsew)
│   │   │   ├── row=0  Profile ラベル
│   │   │   ├── row=1  プロファイルリスト  ← rowconfigure weight=1
│   │   │   ├── row=2  Grep ラベル
│   │   │   ├── row=3  Grep コンボ
│   │   │   ├── row=4  Grep ヒント
│   │   │   └── row=5  機能番号フィルター
│   │   └── left_bot (grid row=2, sticky=ew)   ← ボタン固定エリア
│   │       └── btn_frame
│   │           ├── row=0 デバッグチェックボックス
│   │           ├── row=1 Run Test(BTN_PRIMARY) / Stop(BTN_SECONDARY)
│   │           ├── row=2 Open Allure / Open CSV（ともに BTN_SECONDARY）
│   │           ├── row=3 Login & Hold（BTN_SECONDARY）
│   │           └── row=4 Settings (.env)（BTN_SECONDARY）
│   └── right (pack fill=BOTH expand=True)
│       ├── Command 表示
│       ├── Log エリア
│       └── ダウンロードパネル（動的表示、ボタンは BTN_SECONDARY）
└── ステータスバー (pack fill=X)
```

新しいボタンを追加する際は必ず `btn_frame` (= `left_bot` の子) に grid で追加し、
`left` や `test_group` / `cond_group` に直接追加しないこと。
また `style=BTN_PRIMARY` / `BTN_SECONDARY` / `BTN_TERTIARY` のいずれかを必ず指定すること
（無指定の素の `ttk.Button` は使わない。詳細は `run/README.md`「UI テーマについて」）。

Product/Test File 系のウィジェットを追加する場合は `test_group` に、
Profile/Grep/機能番号フィルター系は `cond_group` に追加する。
`left` は `test_group`（weight=2）/ `cond_group`（weight=1）/ `left_bot`（weight=0）の
3行 grid になっているため、新しい LabelFrame を左ペインに増やす場合は `left.rowconfigure()` の
重み配分も見直すこと。
