# run_gui.py リファクタリング学習ノート

> 各修正について「Before → After」と「なぜ変えるか・何が変わるか」を記録する。

---

## 修正一覧

| # | 内容 | 優先度 | 状態 |
|---|---|---|---|
| 1 | `_run_process` のスレッドアンセーフな UI 操作 | 高 | ✅ 完了 #146 |
| 2 | subprocess 読み取りループの重複 | 中 | ✅ 完了 #147 |
| 3 | ログクリーンアップ2関数の骨格重複 | 中 | ✅ 完了 #148 |
| 4 | ハードコードパスの定数化 | 中 | ✅ 完了 #149 |
| 5 | Login & Hold のコマンド構築の非統一 | 中 | ✅ 完了 #150 |
| 6 | CSV の BOM 非対称 | 中 | ✅ 完了 #151 |
| 7 | RunnerApp 専用モジュール関数の整理 | 低 | ✅ 完了 #152 |

---

## #1 `_run_process` のスレッドアンセーフな UI 操作

### 背景知識：tkinter とスレッドの関係

tkinter は **シングルスレッド** で動作するように設計されている。
ウィジェットの読み書き（`widget.get()` / `widget.state()` など）は
**必ずメインスレッド（= イベントループが走っているスレッド）から行う** 必要がある。

バックグラウンドスレッドから直接ウィジェットを触ると、
- クラッシュ（まれ）
- 描画の乱れ・ちらつき
- 状態の不整合（ボタンが押せなくなる等）

といった問題が起きる可能性がある。
tkinter が提供する安全な橋渡し手段が **`widget.after(ms, callback)`** で、
これはメインスレッドのイベントキューにコールバックを積む仕組みになっている。

---

### Before（問題のあるコード）

```python
# run_gui.py:1218〜1248（_run_process メソッド）
def _run_process(self, cmd, debug=False):
    env = os.environ.copy()
    if debug:
        env['KEEP_BROWSER_OPEN'] = '1'
    try:
        self.proc = subprocess.Popen(
            wrap_command_for_windows(cmd),
            cwd=self.repo_root,
            ...
        )
        for line in self.proc.stdout:
            self.log_queue.put(line)        # ← キュー経由なので OK
        exit_code = self.proc.wait()
        self.log_queue.put(f'\n=== Finished (exit code {exit_code}) ===\n')
        self.after(400, self._show_downloads_panel)  # ← after 経由なので OK
    except FileNotFoundError:
        self.log_queue.put(...)
    except Exception as exc:
        self.log_queue.put(...)
    finally:
        self.proc = None
        if self.is_running:
            self._set_running(False)      # ← ❌ バックグラウンドスレッドから直接 UI 操作
            self._autosave_log_file()     # ← ❌ バックグラウンドスレッドから log_text.get() を呼ぶ
```

**問題点の整理：**

| 行 | 何をしているか | なぜ危険か |
|---|---|---|
| `self._set_running(False)` | `run_btn.state()`, `stop_btn.state()` などウィジェットを操作 | スレッドから直接 tkinter オブジェクトを変更している |
| `self._autosave_log_file()` | `self.log_text.get('1.0', tk.END)` でテキストを読み取り | スレッドから tkinter ウィジェットを読み取っている |

`log_queue.put()` や `self.after()` はスレッドセーフだが、
`_set_running` / `_autosave_log_file` の中身はどちらも tkinter API を直接呼ぶ。

---

### After（修正後のコード）

```python
def _run_process(self, cmd, debug=False):
    env = os.environ.copy()
    if debug:
        env['KEEP_BROWSER_OPEN'] = '1'
    try:
        self.proc = subprocess.Popen(
            wrap_command_for_windows(cmd),
            cwd=self.repo_root,
            ...
        )
        for line in self.proc.stdout:
            self.log_queue.put(line)
        exit_code = self.proc.wait()
        self.log_queue.put(f'\n=== Finished (exit code {exit_code}) ===\n')
        self.after(400, self._show_downloads_panel)
    except FileNotFoundError:
        self.log_queue.put(...)
    except Exception as exc:
        self.log_queue.put(...)
    finally:
        self.proc = None
        if self.is_running:
            self.after(0, self._set_running, False)   # ✅ メインスレッドにスケジュール
            self.after(0, self._autosave_log_file)    # ✅ メインスレッドにスケジュール
```

**`self.after(0, callback)` の動作：**

- `0` ミリ秒後 = 「できるだけ早く、ただしイベントループ上で」実行する
- バックグラウンドスレッドから呼んでも安全（tkinter が内部でキューに積む）
- callback が実行される時点ではメインスレッドなので、ウィジェット操作も安全

**修正の効果：**

| 修正前 | 修正後 |
|---|---|
| スレッドから直接 UI を触るため、まれにクラッシュ・状態不整合が起きうる | メインスレッドのイベントキュー経由なので、常に安全に UI が更新される |
| 「ボタンが戻らない」「ログが途中で消える」などの再現困難なバグが潜在 | そういった潜在バグが構造的に排除される |

---

## #2 subprocess 読み取りループの重複

### 背景知識：DRY 原則（Don't Repeat Yourself）

「同じ構造のコードが2箇所以上に存在する」状態は、
- 片方を直したとき、もう片方の修正を忘れるバグを生む
- 仕様変更のたびに複数箇所を探して直す手間が増える

という問題を抱える。共通処理を1箇所にまとめることで、変更が1点で済む状態にする。

---

### Before（問題のあるコード）

`_run_process`（テスト実行）と `_run_allure_process`（Allure 起動）の両方に、
ほぼ同一のサブプロセス読み取りループが存在する。

```python
# _run_process（1223〜1235行目）
self.proc = subprocess.Popen(
    wrap_command_for_windows(cmd),
    cwd=self.repo_root,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True, encoding='utf-8', errors='replace', bufsize=1,
    env=env,
)
for line in self.proc.stdout:
    self.log_queue.put(line)
```

```python
# _run_allure_process（1143〜1156行目）
proc = subprocess.Popen(
    wrap_command_for_windows(cmd),
    cwd=self.repo_root,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True, encoding='utf-8', errors='replace', bufsize=1,
)
for line in proc.stdout:
    self.log_queue.put(line)
```

**違いは `env=env` の有無だけ**。Popen のオプション群と読み取りループが完全に重複している。

---

### After（修正後のコード）

共通処理を `_pipe_process_output` という内部メソッドに抽出する。

```python
def _pipe_process_output(self, cmd, env=None):
    """cmd を実行して stdout を log_queue に流す。戻り値は Popen オブジェクト。"""
    return subprocess.Popen(
        wrap_command_for_windows(cmd),
        cwd=self.repo_root,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding='utf-8',
        errors='replace',
        bufsize=1,
        env=env,
    )

def _run_process(self, cmd, debug=False):
    env = os.environ.copy()
    if debug:
        env['KEEP_BROWSER_OPEN'] = '1'
    try:
        self.proc = self._pipe_process_output(cmd, env=env)
        for line in self.proc.stdout:
            self.log_queue.put(line)
        exit_code = self.proc.wait()
        self.log_queue.put(f'\n=== Finished (exit code {exit_code}) ===\n')
        self.after(400, self._show_downloads_panel)
    except FileNotFoundError:
        self.log_queue.put('\nERROR: npx が見つかりません。Node.js/npm をインストールしてください。\n')
    except Exception as exc:
        self.log_queue.put(f'\nERROR: {exc}\n')
    finally:
        self.proc = None
        if self.is_running:
            self.after(0, self._set_running, False)
            self.after(0, self._autosave_log_file)

def _run_allure_process(self, cmd):
    try:
        proc = self._pipe_process_output(cmd)
        for line in proc.stdout:
            self.log_queue.put(line)
    except Exception as exc:
        self.log_queue.put(f'\nERROR: Allure open failed: {exc}\n')
```

**修正の効果：**

| 修正前 | 修正後 |
|---|---|
| Popen のオプション（encoding, bufsize 等）が2箇所に書かれている | 1箇所だけ管理すれば済む |
| 片方だけ `errors='replace'` を消し忘れるようなバグが起きうる | 変更箇所が1点なのでミスが起きない |
| 将来「タイムアウト付き Popen」に変えたいとき2箇所直す必要がある | `_pipe_process_output` だけ修正すれば両方に反映される |

---

## #3 ログクリーンアップ2関数の骨格重複

### 背景知識：パラメータ化による共通化

「処理の骨格が同じで、一部だけ違う」2つの関数は、
違う部分をパラメータとして受け取る1つの関数に統合できる。

今回の2関数の比較：

| 項目 | `cleanup_old_logs` | `_cleanup_old_learning_logs` |
|---|---|---|
| 対象ディレクトリ | `logs/` | `docs/common/learning/` |
| ファイルパターン | `<name>_YYYYMMDD_HHMMSS.log` | `bash_YYYYMMDD.md` |
| 日付抽出 regex | `_(\d{8}_\d{6})\.log$` | `^bash_(\d{8})\.md$` |
| 日付フォーマット | `'%Y%m%d_%H%M%S'` | `'%Y%m%d'` |
| 処理 | zip アーカイブ → 削除 | 削除のみ |

「閾値より古いファイルを見つけて処理する」骨格は完全に同一。

---

### Before（問題のあるコード）

```python
# cleanup_old_logs（249〜284行目）
def cleanup_old_logs(logs_dir, days=LOG_CLEANUP_DAYS):
    TIMESTAMP_RE = re.compile(r'_(\d{8}_\d{6})\.log$')
    threshold = datetime.now() - timedelta(days=days)
    archive_dir = os.path.join(logs_dir, 'archive')
    results = []
    if not os.path.isdir(logs_dir):
        return results
    for fname in sorted(os.listdir(logs_dir)):
        if not fname.endswith('.log'):
            continue
        m = TIMESTAMP_RE.search(fname)
        if not m:
            continue
        try:
            dt = datetime.strptime(m.group(1), '%Y%m%d_%H%M%S')
        except ValueError:
            continue
        if dt >= threshold:
            continue
        src = os.path.join(logs_dir, fname)
        os.makedirs(archive_dir, exist_ok=True)
        dest = os.path.join(archive_dir, fname + '.zip')
        try:
            with zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED) as zf:
                zf.write(src, fname)
            os.remove(src)
            age = (datetime.now() - dt).days
            results.append(f'  archived: {fname} ({age}日前)')
        except Exception as exc:
            results.append(f'  error: {fname} -> {exc}')
    return results

# _cleanup_old_learning_logs（287〜315行目）— 骨格がほぼ同じ
def _cleanup_old_learning_logs(learning_dir, days=LOG_CLEANUP_DAYS):
    DATE_RE = re.compile(r'^bash_(\d{8})\.md$')
    threshold = datetime.now() - timedelta(days=days)
    results = []
    if not os.path.isdir(learning_dir):
        return results
    for fname in sorted(os.listdir(learning_dir)):
        m = DATE_RE.match(fname)
        ...
```

---

### After（修正後のコード）

「違う部分」をパラメータとして受け取る共通関数 `_cleanup_old_files` を定義し、
`cleanup_old_logs` / `_cleanup_old_learning_logs` はそれを呼ぶラッパーに変える。

```python
def _cleanup_old_files(target_dir, pattern, date_fmt, days, *, archive=False):
    """target_dir 内のファイルを pattern で検索し、days 日以上古ければ処理する。
    archive=True のとき zip 圧縮してから削除。False のとき削除のみ。"""
    threshold = datetime.now() - timedelta(days=days)
    archive_dir = os.path.join(target_dir, 'archive')
    results = []
    if not os.path.isdir(target_dir):
        return results
    for fname in sorted(os.listdir(target_dir)):
        m = pattern.search(fname)
        if not m:
            continue
        try:
            dt = datetime.strptime(m.group(1), date_fmt)
        except ValueError:
            continue
        if dt >= threshold:
            continue
        src = os.path.join(target_dir, fname)
        age = (datetime.now() - dt).days
        try:
            if archive:
                os.makedirs(archive_dir, exist_ok=True)
                dest = os.path.join(archive_dir, fname + '.zip')
                with zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED) as zf:
                    zf.write(src, fname)
                results.append(f'  archived: {fname} ({age}日前)')
            else:
                results.append(f'  deleted: {fname} ({age}日前)')
            os.remove(src)
        except Exception as exc:
            results.append(f'  error: {fname} -> {exc}')
    return results


def cleanup_old_logs(logs_dir, days=LOG_CLEANUP_DAYS):
    return _cleanup_old_files(
        logs_dir,
        pattern=re.compile(r'_(\d{8}_\d{6})\.log$'),
        date_fmt='%Y%m%d_%H%M%S',
        days=days,
        archive=True,
    )


def _cleanup_old_learning_logs(learning_dir, days=LOG_CLEANUP_DAYS):
    return _cleanup_old_files(
        learning_dir,
        pattern=re.compile(r'^bash_(\d{8})\.md$'),
        date_fmt='%Y%m%d',
        days=days,
        archive=False,
    )
```

**修正の効果：**

| 修正前 | 修正後 |
|---|---|
| 「閾値チェック」ロジックが2箇所に書かれている | `_cleanup_old_files` の1箇所だけ管理 |
| 新しいクリーンアップ対象を追加するたびに長い関数を1から書く | パラメータを変えるだけで新対象に対応できる |
| バグ修正時に2関数を両方直す必要がある | 1箇所直せば全対象に反映される |

---

## #4 ハードコードパスの定数化

### 背景知識：マジックストリング問題

コード中に直書きされた文字列リテラル（パス・コマンドなど）を**マジックストリング**と呼ぶ。
問題点：
- 同じ文字列が複数箇所に書かれると、変更時に1箇所直し忘れてバグが起きる
- コードを読む人が「この文字列は何を指しているのか」を即座に把握しにくい

解決策：モジュールトップに**定数**として定義し、各所から参照させる。

---

### Before（問題のあるコード）

```python
# _show_downloads_panel（1164行目）
dl_dir = os.path.join(self.repo_root, 'output', 'downloads')

# _open_downloads_folder（1191行目） — 同じパスがもう一度
dl_dir = os.path.join(self.repo_root, 'output', 'downloads')

# _on_open_allure（1137行目）
cmd = ['node', 'scripts/allure/serve_latest.js', profile]

# _on_login_and_hold（1111行目）
test_file = './tests/shimamura/util/login_and_hold.js'
```

`output/downloads` が2箇所に重複しているのが特に問題。
将来このパスを変えようとしたとき、片方を直し忘れると動作不整合になる。

---

### After（修正後のコード）

モジュールトップ（`REPO_ROOT` の直下）に定数を追加：

```python
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

_DOWNLOADS_DIR   = os.path.join('output', 'downloads')
_ALLURE_SCRIPT   = os.path.join('scripts', 'allure', 'serve_latest.js')
_LOGIN_HOLD_TEST = './tests/shimamura/util/login_and_hold.js'
```

各メソッド内は定数を参照するだけ：

```python
# _show_downloads_panel
dl_dir = os.path.join(self.repo_root, _DOWNLOADS_DIR)

# _open_downloads_folder
dl_dir = os.path.join(self.repo_root, _DOWNLOADS_DIR)

# _on_open_allure
cmd = ['node', _ALLURE_SCRIPT, profile]

# _on_login_and_hold
test_file = _LOGIN_HOLD_TEST
```

**修正の効果：**

| 修正前 | 修正後 |
|---|---|
| `output/downloads` が2箇所に書かれており、変更時に片方を忘れるリスクがある | 定数 `_DOWNLOADS_DIR` を変えれば全箇所に反映される |
| パス文字列を読んでも「何のためのパスか」が文脈なしには分かりにくい | 定数名 `_ALLURE_SCRIPT` などで意味が自明になる |

---

## #5 Login & Hold のコマンド構築の非統一

### 背景知識：一貫したインターフェースの重要性

同じ目的（「テストを実行するコマンドを作る」）を達成する処理が、
場所によってやり方が違うと：
- 「こっちはオプション付けたのにあっちは忘れた」というバグが起きやすい
- コードを読む人が「なぜここだけ違うのか？」と混乱する

既存の `build_command()` という関数があるのだから、
Login & Hold でも同じ関数を使うのが自然。

---

### Before（問題のあるコード）

```python
# _on_login_and_hold（独自の文字列組み立て）
test_file = _LOGIN_HOLD_TEST
npm_cmd = f'npx codeceptjs run {test_file} --profile {profile}'
title = f'Login & Hold [{profile}]'

subprocess.Popen(
    ['cmd.exe', '/c', 'start', title, 'cmd.exe', '/k', npm_cmd],
    cwd=self.repo_root,
)
```

`build_command()` が返すのはリスト形式だが、ここでは f-string で文字列を直接組み立て、
`cmd.exe /k <文字列>` に渡している。

`cmd.exe /k` はスペース区切りの文字列をそのまま解釈するため、
ファイルパスにスペースが含まれる場合に問題が起きる可能性がある。

---

### After（修正後のコード）

`build_command()` でリストを作り、`subprocess.list2cmdline()` で
Windows コマンドライン向けの安全な文字列に変換する。

```python
# _on_login_and_hold
parts = build_command(_LOGIN_HOLD_TEST, profile)
npm_cmd = subprocess.list2cmdline(parts)
title = f'Login & Hold [{profile}]'

subprocess.Popen(
    ['cmd.exe', '/c', 'start', title, 'cmd.exe', '/k', npm_cmd],
    cwd=self.repo_root,
)
```

**`subprocess.list2cmdline()` とは：**
リスト形式のコマンド引数を、Windows の `cmd.exe` が正しく解釈できる
文字列（スペースを含む引数をクォートするなど）に変換する標準ライブラリ関数。

**修正の効果：**

| 修正前 | 修正後 |
|---|---|
| `build_command` を使わず独自に文字列を組み立てている | 同一の `build_command` 経由でコマンドが生成される |
| パスにスペースがある場合に誤動作する可能性がある | `list2cmdline` が適切にクォート処理してくれる |
| `build_command` の仕様変更（オプション追加等）が Login & Hold に反映されない | 自動的に反映される |

---

## #6 CSV の BOM 非対称

### 背景知識：BOM（Byte Order Mark）とは

BOM はファイルの先頭に置く数バイトのマーカーで、「このファイルはどの文字エンコーディングか」を
示す目印。UTF-8 BOM は `EF BB BF`（3バイト）。

Excel で CSV を開く場合、**BOM なし UTF-8 は文字化けすることが多い**（日本語環境）。
逆に **BOM あり UTF-8（utf-8-sig）** は Excel が正しく UTF-8 と認識する。

---

### Before（問題のあるコード）

```python
# _load_csv（読み込み）
with open(self.csv_path, encoding='utf-8-sig', newline='') as f:  # BOM を自動除去して読む
    rows = list(csv.reader(f))

# _save（書き込み）
with open(self.csv_path, 'w', encoding='utf-8', newline='') as f:  # BOM なしで書く
    w = csv.writer(f)
```

**何が起きるか：**
1. もとのファイルが `utf-8-sig`（BOM あり）だった場合
2. 読み込み時に `utf-8-sig` → Python 内部では BOM なしの文字列として扱う
3. 保存時に `utf-8`（BOM なし）で書き出す
4. 結果：**元は BOM ありだったファイルが、保存後 BOM なしに変わる**
5. 次に Excel でこのファイルを開くと日本語が文字化けする可能性がある

---

### After（修正後のコード）

```python
# _save
with open(self.csv_path, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
```

読み込みと保存のエンコーディングを `utf-8-sig` で揃える。

**`utf-8-sig` で書き込むとどうなるか：**
- Python の `utf-8-sig` コーデックは書き込み時に自動で BOM を先頭に付加する
- 読み込み時は BOM を自動的に取り除いてくれる
- Excel での文字化けが防止できる

**修正の効果：**

| 修正前 | 修正後 |
|---|---|
| 保存するたびに BOM が消える。Excel で再度開くと文字化けリスク | BOM が保持され、Excel での文字化けが起きない |
| 読み込みと保存でエンコーディングが違うため、ファイルの性質が変化する | 読み書きが対称になり、「開いて保存したら元と同じ」が保証される |

---

## #7 RunnerApp 専用モジュール関数の整理

### 背景知識：スコープ（公開範囲）の明示

Python のモジュールにおいて、**アンダースコア `_` で始まる名前**は
「このモジュールの内部実装であり、外から使うことは想定していない」という慣習的な合図。

現状、`RunnerApp` 専用なのにモジュールトップ（グローバル）に定義されている関数が3つある：

| 関数名 | 状態 | 問題 |
|---|---|---|
| `_format_filesize()` | `_` あり | スコープは OK だが `RunnerApp` 専用 |
| `_analyze_download_file()` | `_` あり | 同上 |
| `get_product_from_test()` | `_` なし | `RunnerApp` 専用なのに公開名になっている |

特に `get_product_from_test` は `_` がないため、
外部から `from run_gui import get_product_from_test` ができてしまう（意図していない）。

---

### Before（問題のあるコード）

```python
# モジュールトップに定義（RunnerApp の外）
def get_product_from_test(test_path):        # ← _ がない
    ...

def _format_filesize(size_bytes):            # ← _ はある
    ...

def _analyze_download_file(path):            # ← _ はある
    ...
```

---

### After（修正後のコード）

`get_product_from_test` に `_` を付けて非公開名に統一する。
（`_format_filesize` / `_analyze_download_file` は名前はすでに OK なので変更なし）

```python
def _get_product_from_test(test_path):   # _ を追加
    ...
```

`RunnerApp` 内の呼び出し箇所も同様に変更：

```python
# _on_product_select 内
self._filtered_test_paths = [t for t in self._all_tests if _get_product_from_test(t) == product]

# find_csvs_for_test を呼ぶ箇所
product = _get_product_from_test(test)
```

**修正の効果：**

| 修正前 | 修正後 |
|---|---|
| `get_product_from_test` が公開名のため、外部モジュールからも import できてしまう | `_get_product_from_test` として非公開であることが名前で明示される |
| モジュールの公開 API が意図せず増えている | 公開 API は本当に外部利用を想定したものだけになる |
