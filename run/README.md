# run_gui.py — CodeceptJS テストランナー GUI

Python 標準ライブラリ（Tkinter）のみで動作するテスト実行ランチャー。  
`run_gui.bat` をダブルクリックするだけで起動できる。

---

## 動作要件

| 項目 | 条件 |
|---|---|
| Python | 3.8 以上（Tkinter 付属、標準配布で OK） |
| Node.js / npm | `npx codeceptjs` が実行できること |
| CodeceptJS | プロジェクトに `node_modules/` がインストール済み |
| sv-ttk | **任意**。`pip install sv-ttk` でインストールすると Windows 11 スタイルのモダンテーマが有効になる。未インストールでも標準 ttk テーマで正常動作する |
| tkcalendar | **任意**。`pip install tkcalendar` で CSV エディタの日付列にカレンダーピッカーが有効になる |

---

## 起動方法

```
run/run_gui.bat をダブルクリック
```

内部では `python run_gui.py` を呼び出している。  
直接起動する場合はリポジトリルートか `run/` のどちらからでも可。

---

## 画面構成

```
┌────────────────────────────────────────────────────────────┐
│  [左ペイン]                    │  [右ペイン]               │
│  Product     ← tests/ のサブフォルダ  │  Command（参照用）        │
│  Test File   ← *_test.js 一覧  │  Log（色付きリアルタイム）│
│  Profile     ← .env.* 一覧     │                           │
│  Grep（任意）                  │                           │
│  [Run] [Stop] [Open Allure] [Open CSV]                     │
└────────────────────────────────────────────────────────────┘
```

### 左ペイン

| 要素 | 説明 |
|---|---|
| **Product** | `tests/` 直下のサブフォルダを自動スキャン。選択するとテスト・プロファイルリストが絞り込まれる |
| **Test File** | 選択 Product の `*_test.js` 一覧（`check/` `page/` などサブフォルダ付き、等幅整形） |
| **説明テキスト** | テストファイル選択時に `test_descriptions.json` の日本語説明を表示 |
| **Profile** | `env/.env.<profile>` を自動スキャン。Product 名と一致するプロファイルのみに絞り込む |
| **Grep（任意）** | テストファイル内の `@タグ` を自動抽出してドロップダウンに表示。文字入力での自由指定も可 |
| **デバッグモード** | `--steps --debug` を付加し、ブラウザを閉じずに残す（`KEEP_BROWSER_OPEN=1`） |

### ボタン

| ボタン | 動作 |
|---|---|
| **Run Test** | 選択テストをサブスレッドで実行。ログをリアルタイム表示 |
| **Stop** | 実行中プロセスを `terminate()` で停止。停止後にログを自動保存 |
| **Open Allure** | `allure-results/<profile>/` を確認し `node scripts/allure/serve_latest.js <profile>` を呼び出す |
| **Open CSV** | テストファイルに対応する `data/<product>/*_data*.csv` をデフォルトアプリで開く |
| **Login & Hold (shimamura)** | shimamura プロファイル専用。新しいコンソールウィンドウでブラウザを起動し、ログイン後に手動操作できる状態で待機させる。ターミナルに `resume` を入力するか Ctrl+C × 2 で終了 |

### 右ペイン

| 要素 | 説明 |
|---|---|
| **Command** | 実行するコマンド全体を読み取り専用で表示（確認・手動コピー用） |
| **Log** | 実行ログをリアルタイムに色付き表示。右クリックで「Save Log…」「Clear Log」 |

#### ログの色分けルール

| 色 | 条件 |
|---|---|
| 青 | `===` で始まる行（ヘッダー） |
| グレー | `---` で始まる行（DEBUG 情報） |
| 緑 | `✓` / `passed` / `PASS` |
| 赤（太字） | `FAIL` / `-- FAILURES:` |
| ピンク | `×` / `Error:` / `ERROR:` |
| オレンジ | `warn` / `warning` を含む行 |

---

## ダウンロードファイルパネル

テスト実行完了後、`output/downloads/` に新しく作成された `.csv` / `.tsv` / `.txt` ファイルを自動検出して右ペイン下部に一覧表示する。

| 列 | 内容 |
|---|---|
| ファイル名 | ダウンロードされたファイル名 |
| サイズ | ファイルサイズ（B / KB / MB） |
| 件数 | 行数またはレコード数（固定長120バイトのファイルはレコード数で表示） |
| 形式/エンコード | Shift-JIS / UTF-8 / 固定長-120 など |

- **フォルダを開く** — `output/downloads/` をエクスプローラーで開く
- **Excelで開く** — 選択中のファイルをデフォルトアプリで開く

ダウンロード検証テストを実行した際に結果をすぐ確認できる。

---

## 自動ログ保存・クリーンアップ

### テスト終了時の自動保存

Run 終了（正常終了・Stop・エラー）後に `logs/<testname>_<YYYYMMDD_HHMMSS>.log` へ自動保存する。

### 起動時のログアーカイブ

起動 0.3 秒後にバックグラウンドで実行。  
`logs/` 内の `<name>_<YYYYMMDD_HHMMSS>.log` のうち **30 日以上** 古いものを `logs/archive/<name>.log.zip` に圧縮してから削除する。

また、`docs/common/learning/bash_YYYYMMDD.md` のうち **30 日以上** 古いものも同時に削除する（アーカイブなし）。

---

## UI テーマについて（設計判断の記録）

### 採用：sv-ttk（任意依存）

既存の Tkinter/ttk コードをそのまま使いながら Windows 11 スタイルのテーマを適用できる
[sv-ttk](https://github.com/rdbende/Sun-Valley-ttk-theme) を任意依存として採用した。

- `pip install sv-ttk` でインストール済みの場合のみ有効
- 未インストールでも標準 ttk テーマにフォールバックし、動作に影響なし

### 不採用：CustomTkinter

CustomTkinter への全面移行は以下の理由で見送った：

| 理由 | 詳細 |
|---|---|
| Treeview の代替品なし | `CsvEditorWindow` で使用する `ttk.Treeview` に CTk の同等品がなく、ttk との混在 UI になる |
| tkcalendar との不一致 | `DateEntry` は ttk ベースのウィジェットのため CTk 環境と外観が合わない |
| カラーログの互換性 | `ScrolledText.tag_configure` を使ったログ色分けが CTkTextbox では内部 API 扱いになる |
| 開発者専用ツール | 外部から見えないツールに対してコスト対効果が低い |

---

## メンテナンスガイド

### テスト説明文を追加・更新する

`run/test_descriptions.json` を編集する。形式：

```json
{
  "<product>": {
    "<サブフォルダ/ファイル名_test.js>": "日本語の説明"
  }
}
```

例：
```json
{
  "tframe": {
    "page/calendar_test.js": "カレンダー画面の基本表示と月切替を確認"
  }
}
```

`tests/tframe/` に新テストを追加した場合はこのファイルも必ず更新すること（AGENTS.md のドキュメント連動ルール）。

### ログクリーンアップの日数を変更する

`run_gui.py` の 34 行目：

```python
LOG_CLEANUP_DAYS = 30
```

### ログのフォント・サイズを変更する

`run_gui.py` の 35 行目：

```python
LOG_FONT = ('Courier New', 9)
```

### ログの色設定を変更する

`_LOG_TAGS` 辞書（38 行目付近）で各タグの色・太字を指定している：

```python
_LOG_TAGS = {
    'pass':  {'foreground': '#4ec94e'},
    'fail':  {'foreground': '#ff5555', 'font': LOG_FONT + ('bold',)},
    ...
}
```

色は HTML カラーコード（`#RRGGBB`）で指定する。  
新しいタグを追加する場合は `_get_log_tag()` メソッド（967 行目付近）にも判定条件を追加すること。

### 新プロダクトを追加する

`tests/<product>/` フォルダを作成し、`env/.env.<product>.*` を用意するだけで GUI に自動スキャンされる。  
GUI 側のコード変更は不要。

ただし以下は手動で追加すること：

- `test_descriptions.json` に `"<product>": { ... }` セクションを追加（TestFile 欄の日本語説明）
- 連続バッチ実行が必要な場合は `ps/_run_batch_core.ps1` を呼ぶラッパー `.ps1` と `.bat` を `run/` に追加

### ウィンドウサイズを変更する

`RunnerApp.__init__` の 2 行（664 行目付近）：

```python
self.geometry('960x640')   # 初期サイズ（幅×高さ）
self.minsize(760, 520)     # 最小サイズ
```

### Open Allure が動かない場合

`allure-results/<profile>/` が存在しないときはボタンを押してもエラーダイアログが出る。  
先にテストを 1 回実行してフォルダを生成すること。  
Allure の実行スクリプトは `scripts/allure/serve_latest.js`。

---

## ファイル構成（run/ 内の関連ファイル）

```
run/
├── run_gui.py               # このツールの本体
├── run_gui.bat              # ダブルクリック起動用ランチャー
├── test_descriptions.json   # テストファイルの日本語説明マップ
├── tframe_run_nav_all.bat   # tframe 全ページテスト連続実行バッチ
└── ps/
    ├── _run_batch_core.ps1      # バッチ連続実行の汎用ループ・集計ロジック
    └── tframe_run_nav_all.ps1   # tframe 向けテストリスト定義（コアへのラッパー）
```

---

## 主要な内部関数（修正時の参照用）

| 関数 | 役割 |
|---|---|
| `find_products(tests_dir)` | `tests/` サブフォルダ名をスキャン |
| `find_all_tests(tests_dir)` | `*_test.js` を再帰収集 |
| `find_all_profiles(env_dir)` | `.env.<profile>` をスキャン |
| `filter_profiles_for_product()` | Product 名でプロファイルを絞り込み |
| `extract_tags_from_test()` | テストファイルから `@タグ` を抽出 |
| `find_csvs_for_test()` | `data/<product>/<stem>_data*.csv` を検索 |
| `build_command()` | `npx codeceptjs run` コマンドを組み立て |
| `cleanup_old_logs()` | 古いログを zip アーカイブして削除 |
| `_cleanup_old_learning_logs()` | `docs/common/learning/bash_*.md` の古いファイルを削除 |
| `_analyze_download_file()` | ダウンロードファイルの件数・エンコードを解析 |
| `RunnerApp._run_process()` | テストをサブスレッドで実行してログをキューに流す |
| `RunnerApp._drain_log_queue()` | 100ms ごとにキューを消費して UI に反映 |
| `RunnerApp._show_downloads_panel()` | テスト完了後に新着ダウンロードファイルを検出して表示 |
