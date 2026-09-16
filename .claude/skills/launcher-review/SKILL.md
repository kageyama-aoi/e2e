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

#### B. PanedWindow の weight 設定と、left 内グループの伸び縮みが壊れていないか

画面全体は入れ子の `ttk.PanedWindow` で構成されている（2026-09 のレイアウト改修で
右ペイン方式から移行）。

- `_outer_pane`（VERTICAL）: `_top_pane` (weight=1) / `bottom`（Command+Log+Downloads, weight=2）
- `_top_pane`（HORIZONTAL）: `left`（操作パネル, weight=1）/ `test_panel`（Test File, weight=3）

**`left` パネル自体（`product_group` / `cond_group` / `left_bot` を grid で縦に並べる親）には
意図的に `rowconfigure` の weight を付けていない。** 各グループは中身の自然なサイズのまま
上詰めで並び、余白は `test_panel`・`bottom` 側に流す設計。過去に `left.rowconfigure(1, weight=1)`
と `cond_group.rowconfigure(1, weight=1)` を付けて「実行条件」ブロックを引き伸ばした結果、
その枠だけ異様に間延びする不具合が実際に起きている。**`left` 配下に新しい `LabelFrame` や
ウィジェットを追加するときも、明確な意図がない限り行 weight を付けないこと。**

伸縮させたいのは以下の2箇所だけ：
```python
test_panel.rowconfigure(0, weight=1)   # Test File パネル自体
test_group.rowconfigure(0, weight=1)   # ↑の中のテストリスト行
```
`cond_group` 内の Profile リスト（`height=3` 固定）は意図的に伸縮させていない。
もし将来伸縮させたくなった場合は、`left` 全体が weight を持たない設計と矛盾しないか
（＝結局 `left` ごと引き伸ばす形に戻さないか）を確認すること。

**PanedWindow の初期比率を `sashpos()` で明示的に固定するのは危険。** 過去に
`after(50, ...)` で起動直後に `sashpos()` を呼んだところ、`test_panel` と `bottom` が
両方とも潰れて見えなくなる不具合が発生した（スクリーンショット検証で発覚・原因のメソッドを
削除して解決）。デフォルトの weight ベースの初期配置で十分機能するため、`sashpos()` を
使うなら起動直後ではなくユーザー操作後の保存/復元用途に限定し、スクリーンショットで
実際に両ペインが見えることを必ず確認する。

---

#### C. geometry と minsize の整合性

`self.geometry('1100x760')` と `self.minsize(860, 640)`（`RunnerApp.__init__` 内）を
読み取り、以下を確認する：

1. `geometry` の高さ・幅 ≥ `minsize` の高さ・幅
2. `left` パネルは伸縮しないため、`minsize` まで縮めても
   `product_group` + `cond_group` + `left_bot`（ボタン群）の合計高さがウィンドウ内に
   収まるか。収まらない場合、`_top_pane` の縦幅が足りずボタンが見切れる。
   目安：`product_group` ≈ 70px、`cond_group` ≈ 230px、`left_bot`（デバッグ行+ボタン4行）
   ≈ 190px。タイトルラベル・ステータスバー・`_outer_pane` の `bottom` 側最低表示分
   （Command 1行 + Log 見出し、目安 80px）も差し引く。
3. 目視より確実な方法として、`RunnerApp` を `withdraw()` した状態で構築し
   `update_idletasks()` 後に `winfo_reqheight()` を測るスクリプト検証、または
   実際に起動してスクリーンショットで両ペイン（Test File・Log）が見えることを確認する
   （`/launcher-gui-design` スキルの Step 6 参照）。**見た目のレイアウト崩れは
   属性 assert では拾えないため、PanedWindow 関連の変更は必ずスクリーンショットで確認する。**

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

### B. PanedWindow / 伸縮設定
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

## 重要な構造メモ（2026-09-16 時点）

2026-09 のレイアウト改修で、右ペイン方式から入れ子 `ttk.PanedWindow`（ドラッグで
上下・左右比率を調整可能）に変更された。Test File は「アイコン別グループ見出し＋
日本語説明」が付いて行が長くなったため、独立した横幅の広いペインに切り出されている。

```
RunnerApp._build_ui()
├── タイトルラベル (pack)
└── body (pack fill=BOTH expand=True)
    └── _outer_pane = PanedWindow(VERTICAL)
        ├── _top_pane = PanedWindow(HORIZONTAL, weight=1)
        │   ├── left (grid, columnconfigure(0)=1／rowconfigure は付けない＝伸縮させない, weight=1)
        │   │   ├── product_group = LabelFrame('１ まず選ぶ', style='ProductCard.TLabelframe')
        │   │   │   │   (grid row=0, sticky=ew／淡いブルーの独立カードでProduct選択を強調)
        │   │   │   ├── row=0  Product ラベル (style='ProductCard.TLabel')
        │   │   │   └── row=1  Product コンボ
        │   │   ├── cond_group = LabelFrame('実行条件') (grid row=1, sticky=ew)
        │   │   │   ├── row=0  Profile ラベル
        │   │   │   ├── row=1  プロファイルリスト（height=3 固定・伸縮させない）
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
        │   └── test_panel (grid, rowconfigure(0)=1, weight=3)   ← Test File 専用の幅広ペイン
        │       └── test_group = LabelFrame('Test File') (grid row=0, sticky=nsew)
        │           ├── row=0  テストリスト（tk.Listbox） ← rowconfigure weight=1で伸縮
        │           ├         縦スクロールバー (column=1)
        │           ├── row=1  横スクロールバー
        │           └── row=2  説明ラベル（選択中テストの日本語説明）
        └── bottom = Frame(pack, weight=2)   ← 全幅・下段
            ├── Command 表示
            ├── Log エリア（ScrolledText）
            └── ダウンロードパネル（動的表示、ボタンは BTN_SECONDARY）
```

（ステータスバーは `_outer_pane` の外、`RunnerApp` 直下に `pack(fill=X)` で別途配置）

新しいボタンを追加する際は必ず `btn_frame` (= `left_bot` の子) に grid で追加し、
`left` や `product_group` / `cond_group` に直接追加しないこと。
また `style=BTN_PRIMARY` / `BTN_SECONDARY` / `BTN_TERTIARY` のいずれかを必ず指定すること
（無指定の素の `ttk.Button` は使わない。詳細は `run/README.md`「UI テーマについて」）。

Product 系のウィジェットを追加する場合は `product_group` に、Test File 系は
`test_group`（`test_panel` 配下）に、Profile/Grep/機能番号フィルター系は `cond_group` に
追加する。`left` 配下の3グループ（`product_group` / `cond_group` / `left_bot`）は
**意図的に rowconfigure の weight を付けていない**（Step 3-B 参照）。新しい `LabelFrame` を
`left` に増やす場合も、明確な意図がなければ伸縮させない（自然サイズのまま上詰め）方針を踏襲する。
画面全体の比率調整（左右・上下）は `_top_pane` / `_outer_pane` の `weight=` 側で行う。
