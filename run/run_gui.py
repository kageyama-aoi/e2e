# Generic CodeceptJS test runner GUI
# Uses only Python standard library (Tkinter)
# Optional: pip install sv-ttk   → Windows 11 style theme
# Optional: pip install tkcalendar → calendar picker in CSV editor

import csv
import json
import os
import re
try:
    from tkcalendar import DateEntry as _DateEntry
    _TKCALENDAR = True
except ImportError:
    _TKCALENDAR = False
try:
    import sv_ttk as _sv_ttk
    _SV_TTK = True
except ImportError:
    _SV_TTK = False
import sys
import queue
import zipfile
import threading
import subprocess
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from tkinter.scrolledtext import ScrolledText
from datetime import datetime, timedelta

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

_DOWNLOADS_DIR   = os.path.join('output', 'downloads')
_ALLURE_SCRIPT   = os.path.join('scripts', 'allure', 'serve_latest.js')
_LOGIN_HOLD_TEST = './tests/shimamura/util/login_and_hold.js'

_DATE_COL_KEYWORDS = {'date', 'datetime', 'day', '日付', 'keijoubi', 'tsuki', 'tuki', 'ymd'}
_DATE_VALUE_RE = re.compile(r'^\d{4}[-/]\d{1,2}[-/]\d{1,2}$')
LOG_CLEANUP_DAYS = 30
LOG_FONT = ('Courier New', 9)

# ログ行の色定義（foreground / font を指定）
_LOG_TAGS = {
    'header': {'foreground': '#4a9eff'},                                      # blue  : === lines
    'debug':  {'foreground': '#888888'},                                      # gray  : --- DEBUG
    'pass':   {'foreground': '#4ec94e'},                                      # green : ✓ / passed
    'fail':   {'foreground': '#ff5555', 'font': LOG_FONT + ('bold',)},                  # red bold : FAIL
    'error':  {'foreground': '#ff7777'},                                      # pink  : × / Error
    'warn':   {'foreground': '#ffb347'},                                      # orange: warnings
}


def _format_filesize(size_bytes):
    """バイト数を人が読みやすいサイズ文字列に変換する。"""
    if size_bytes < 1024:
        return f'{size_bytes} B'
    if size_bytes < 1024 * 1024:
        return f'{size_bytes / 1024:.1f} KB'
    return f'{size_bytes / 1024 / 1024:.1f} MB'


def _analyze_download_file(path):
    """ダウンロードファイルを解析し (件数, 単位, エンコード表示) を返す。
    改行なし かつ サイズが120の倍数 → 固定長レコード形式と判定する。"""
    try:
        with open(path, 'rb') as f:
            raw = f.read()
        size = len(raw)
        if size == 0:
            return 0, '行', '(空)'
        if raw.count(b'\n') == 0 and size % 120 == 0:
            return size // 120, 'レコード', '固定長-120'
        for enc in ('cp932', 'utf-8-sig', 'utf-8'):
            try:
                text = raw.decode(enc)
                count = sum(1 for line in text.splitlines() if line.strip())
                return count, '行', 'Shift-JIS' if enc == 'cp932' else 'UTF-8'
            except (UnicodeDecodeError, LookupError):
                continue
        return sum(1 for line in raw.split(b'\n') if line.strip()), '行', '不明'
    except Exception:
        return 0, '行', 'error'


def find_products(tests_dir):
    """tests/ 直下のサブディレクトリ名をプロダクト一覧として返す。"""
    if not os.path.isdir(tests_dir):
        return []
    return sorted(
        d for d in os.listdir(tests_dir)
        if os.path.isdir(os.path.join(tests_dir, d))
    )


def find_all_tests(tests_dir):
    """tests/ 配下の *_test.js を再帰収集し、./tests/... 形式で返す。"""
    results = []
    for dirpath, _dirs, filenames in os.walk(tests_dir):
        for fname in sorted(filenames):
            if fname.endswith('_test.js'):
                full = os.path.join(dirpath, fname)
                rel = os.path.relpath(full, REPO_ROOT).replace('\\', '/')
                results.append('./' + rel)
    return sorted(results)


def find_all_profiles(env_dir):
    """env/ 配下の .env.<profile> ファイルからプロファイル名を収集する。"""
    profiles = []
    if not os.path.isdir(env_dir):
        return profiles
    for name in os.listdir(env_dir):
        if not name.startswith('.env.'):
            continue
        if name.endswith('.template'):
            continue
        profile = name[len('.env.'):]
        if profile:
            profiles.append(profile)
    return sorted(set(profiles))


def _get_product_from_test(test_path):
    """./tests/<product>/... からプロダクト名を抽出する。"""
    parts = test_path.replace('\\', '/').lstrip('./').split('/')
    if len(parts) >= 2 and parts[0] == 'tests':
        return parts[1]
    return None


def load_descriptions(run_dir):
    """run/test_descriptions.json を読み込む。ファイルがなければ空辞書を返す。"""
    path = os.path.join(run_dir, 'test_descriptions.json')
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}


def get_desc_text(entry):
    """descriptions の値が文字列かオブジェクトかに関わらず説明文を返す。"""
    if isinstance(entry, dict):
        return entry.get('description', '')
    return entry or ''


def get_feature_no(entry):
    """descriptions の値から feature_no を返す。なければ空文字。"""
    if isinstance(entry, dict):
        return entry.get('feature_no', '') or ''
    return ''


def get_display_name(test_path, product, descriptions=None):
    """./tests/<product>/page/foo_test.js → page/foo_test.js
    feature_no がある場合は page/[1002_4_3] foo_test.js 形式にする。"""
    prefix = f'./tests/{product}/'
    if not test_path.startswith(prefix):
        return test_path
    rel = test_path[len(prefix):]  # e.g. page/student_search_ichiran_test.js
    if descriptions is not None:
        entry = descriptions.get(product, {}).get(rel)
        feature_no = get_feature_no(entry)
        if feature_no and '/' in rel:
            folder, fname = rel.split('/', 1)
            return f'{folder}/[{feature_no}] {fname}'
    return rel


def format_test_list(display_names):
    """フォルダプレフィックスを固定幅に揃え、ファイル名の開始列を統一する。

    例:
      auth/   login_test.js
      check/  dropdown_check_test.js
      page/   calendar_test.js
    """
    parts = []
    for name in display_names:
        if '/' in name:
            folder, fname = name.split('/', 1)
            parts.append((folder + '/', fname))
        else:
            parts.append(('', name))
    max_len = max((len(f) for f, _ in parts), default=0)
    return [f.ljust(max_len + 1) + fname for f, fname in parts]


def filter_profiles_for_product(all_profiles, product, order=None):
    """product に対応するプロファイルを返す。order が指定された場合はその順序を優先する。"""
    if not product:
        return list(all_profiles)
    matched = [p for p in all_profiles if p == product or p.startswith(product + '.')]
    result = matched if matched else list(all_profiles)
    if order:
        ordered = [p for p in order if p in result]
        remaining = sorted(p for p in result if p not in ordered)
        return ordered + remaining
    return result


def extract_tags_from_test(test_path):
    """テストファイルから @タグ を抽出して重複なしリストで返す。"""
    tags = set()
    try:
        with open(test_path, encoding='utf-8', errors='replace') as f:
            for line in f:
                if 'Scenario' in line or 'Feature' in line:
                    for tag in re.findall(r'@\w+', line):
                        tags.add(tag)
    except Exception:
        pass
    return sorted(tags)


def find_csvs_for_test(repo_root, test_path, product):
    """テストファイルに対応する CSV ファイルのパス一覧を返す。

    命名規則: tests/{product}/**/{stem}_test.js → data/{product}/{stem}_data*.csv
              または data/{product}/{stem}_*_data*.csv（一覧検索系など）
    """
    basename = os.path.basename(test_path)
    if not basename.endswith('_test.js'):
        return []
    stem = basename[:-len('_test.js')]
    data_dir = os.path.join(repo_root, 'data', product)
    if not os.path.isdir(data_dir):
        return []
    prefix = stem + '_'
    return sorted(
        os.path.join(data_dir, f)
        for f in os.listdir(data_dir)
        if f.startswith(prefix) and f.endswith('.csv') and '_data' in f
    )


def build_command(test_file, profile, grep=None, debug=False):
    cmd = ['npx', 'codeceptjs', 'run', test_file, '--profile', profile]
    if grep:
        cmd += ['--grep', grep]
    if debug:
        cmd += ['--steps', '--debug']
    return cmd


def wrap_command_for_windows(cmd):
    if os.name != 'nt':
        return cmd
    comspec = os.environ.get('ComSpec', 'cmd.exe')
    return [comspec, '/c'] + cmd


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
    """logs/ 配下の <name>_<YYYYMMDD_HHMMSS>.log を days 日以上古ければアーカイブして削除する。"""
    return _cleanup_old_files(
        logs_dir,
        pattern=re.compile(r'_(\d{8}_\d{6})\.log$'),
        date_fmt='%Y%m%d_%H%M%S',
        days=days,
        archive=True,
    )


def _cleanup_old_learning_logs(learning_dir, days=LOG_CLEANUP_DAYS):
    """docs/common/learning/ 配下の bash_YYYYMMDD.md を days 日以上古ければ削除する。"""
    return _cleanup_old_files(
        learning_dir,
        pattern=re.compile(r'^bash_(\d{8})\.md$'),
        date_fmt='%Y%m%d',
        days=days,
        archive=False,
    )


class _Tooltip:
    """ウィジェットにホバーしたときにポップアップテキストを表示する。"""
    def __init__(self, widget, textvariable):
        self._widget = widget
        self._var = textvariable
        self._tip = None
        widget.bind('<Enter>', self._show)
        widget.bind('<Leave>', self._hide)

    def _show(self, _event):
        text = self._var.get()
        if not text:
            return
        x = self._widget.winfo_rootx() + 4
        y = self._widget.winfo_rooty() + self._widget.winfo_height() + 4
        self._tip = tk.Toplevel(self._widget)
        self._tip.wm_overrideredirect(True)
        self._tip.wm_geometry(f'+{x}+{y}')
        tk.Label(
            self._tip, text=text, background='#ffffe0', relief='solid',
            borderwidth=1, font=('Segoe UI', 8), justify='left', padx=6, pady=3,
        ).pack()

    def _hide(self, _event):
        if self._tip:
            self._tip.destroy()
            self._tip = None


class CsvEditorWindow(tk.Toplevel):
    """CSVファイルをテーブル形式で編集するウィンドウ。"""

    def __init__(self, parent, csv_path):
        super().__init__(parent)
        self.csv_path = csv_path
        self.title(os.path.basename(csv_path))
        self.geometry('900x400')
        self.minsize(500, 280)
        self._entry = None
        self._editing = None
        self._headers = []
        self._numeric_cols = set()
        self._date_cols = set()
        self._load_csv()
        self._build_ui()

    # ── ヘルパー ──────────────────────────────────────

    @staticmethod
    def _is_numeric_str(s):
        """カンマを除いて数値のみかどうか判定（空文字は True）。
        先頭ゼロ付き文字列（0001, 001 等）はコード系とみなして False を返す。"""
        s = s.replace(',', '').strip()
        if not s:
            return True
        # 先頭が '0' かつ次の文字が '.' 以外 → 銀行コード・口座番号等のコード系
        if len(s) > 1 and s[0] == '0' and s[1] != '.':
            return False
        try:
            float(s)
            return True
        except ValueError:
            return False

    def _detect_numeric_cols(self):
        """全データが数値の列インデックスのセットを返す。"""
        numeric = set()
        for ci in range(len(self._headers)):
            vals = [row[ci] for row in self._data if ci < len(row) and row[ci].strip()]
            if vals and all(self._is_numeric_str(v) for v in vals):
                numeric.add(ci)
        return numeric

    def _detect_date_cols(self):
        """列名または列データから日付列のインデックスセットを返す。
        数値列と重複する場合は日付列を優先する。
        YYYY-MM のような年月のみ列は対象外（データが YYYY-MM-DD に一致するか確認）。"""
        date_cols = set()
        for ci, col in enumerate(self._headers):
            vals = [row[ci] for row in self._data if ci < len(row) and row[ci].strip()]
            data_is_full_date = not vals or all(_DATE_VALUE_RE.match(v) for v in vals)
            if any(kw in col.lower() for kw in _DATE_COL_KEYWORDS):
                # キーワード一致でもデータが YYYY-MM 等なら除外
                if data_is_full_date:
                    date_cols.add(ci)
                continue
            if vals and data_is_full_date:
                date_cols.add(ci)
        self._numeric_cols -= date_cols  # 日付列は数値列から除外
        return date_cols

    @staticmethod
    def _fmt_num(val):
        """数値文字列をカンマ区切り表示にフォーマット。"""
        s = val.replace(',', '').strip()
        if not s:
            return val
        try:
            n = float(s)
            return f'{int(n):,}' if n == int(n) else f'{n:,}'
        except ValueError:
            return val

    @staticmethod
    def _raw_num(val):
        """表示用カンマを除去した生の数値文字列を返す。"""
        return val.replace(',', '')

    # ── CSV 読み込み ──────────────────────────────────

    def _load_csv(self):
        try:
            with open(self.csv_path, encoding='utf-8-sig', newline='') as f:
                rows = list(csv.reader(f))
        except Exception as e:
            messagebox.showerror('Error', f'CSVを開けませんでした:\n{e}', parent=self)
            self.destroy()
            return
        self._headers = rows[0] if rows else []
        self._data = [
            (r + [''] * len(self._headers))[:len(self._headers)]
            for r in rows[1:]
        ]
        self._numeric_cols = self._detect_numeric_cols()
        self._date_cols = self._detect_date_cols()

    # ── UI 構築 ───────────────────────────────────────

    def _build_ui(self):
        if not self._headers:
            ttk.Label(self, text='CSVが空です。').pack(padx=16, pady=16)
            ttk.Button(self, text='閉じる', command=self.destroy).pack()
            return

        # ヘッダー行を太字・青字に
        style = ttk.Style(self)
        style.configure('CsvEditor.Treeview.Heading',
                         font=('Segoe UI', 9, 'bold'), foreground='#3a7dc8')

        tbl = ttk.Frame(self)
        tbl.pack(fill=tk.BOTH, expand=True, padx=8, pady=(8, 4))

        # 行番号列 (_no) + データ列
        all_cols = ['_no'] + list(self._headers)
        self.tree = ttk.Treeview(
            tbl, columns=all_cols, show='headings',
            selectmode='browse', style='CsvEditor.Treeview',
        )
        self.tree.heading('_no', text='#', anchor='center')
        self.tree.column('_no', width=36, minwidth=30, stretch=False, anchor='center')

        for ci, col in enumerate(self._headers):
            if col == 'scenario':
                w = 160
            elif ci in self._date_cols:
                w = 130
            else:
                w = 110
            anchor = 'e' if ci in self._numeric_cols else 'w'
            self.tree.heading(col, text=col, anchor=anchor)
            self.tree.column(col, width=w, minwidth=60, stretch=True, anchor=anchor)

        # ゼブラカラー
        self.tree.tag_configure('oddrow',  background='#f0f4fa')
        self.tree.tag_configure('evenrow', background='#ffffff')

        vsb = ttk.Scrollbar(tbl, orient='vertical', command=self.tree.yview)
        hsb = ttk.Scrollbar(tbl, orient='horizontal', command=self.tree.xview)
        self.tree.configure(yscrollcommand=vsb.set, xscrollcommand=hsb.set)
        self.tree.grid(row=0, column=0, sticky='nsew')
        vsb.grid(row=0, column=1, sticky='ns')
        hsb.grid(row=1, column=0, sticky='ew')
        tbl.rowconfigure(0, weight=1)
        tbl.columnconfigure(0, weight=1)

        self._populate()
        self.tree.bind('<Double-1>', self._on_double_click)

        btns = ttk.Frame(self)
        btns.pack(fill=tk.X, padx=8, pady=(0, 2))
        ttk.Button(btns, text='行を追加', command=self._add_row).pack(side=tk.LEFT, padx=2)
        ttk.Button(btns, text='行を削除', command=self._delete_row).pack(side=tk.LEFT, padx=2)
        ttk.Button(btns, text='Save', command=self._save).pack(side=tk.RIGHT, padx=2)
        ttk.Button(btns, text='Cancel', command=self.destroy).pack(side=tk.RIGHT, padx=2)

        # ステータスバー
        self._status_var = tk.StringVar()
        ttk.Label(
            self, textvariable=self._status_var,
            foreground='#888888', font=('Segoe UI', 8),
        ).pack(anchor='w', padx=10, pady=(0, 6))
        self._update_status()

    # ── テーブル操作 ──────────────────────────────────

    def _populate(self):
        for item in self.tree.get_children():
            self.tree.delete(item)
        for i, row in enumerate(self._data):
            display = [
                self._fmt_num(v) if ci in self._numeric_cols else v
                for ci, v in enumerate(row)
            ]
            tag = 'oddrow' if i % 2 == 0 else 'evenrow'
            self.tree.insert('', tk.END, values=[str(i + 1)] + display, tags=(tag,))

    def _renumber_rows(self):
        """行番号列と交互背景色を振り直す。"""
        for i, item in enumerate(self.tree.get_children()):
            vals = list(self.tree.item(item, 'values'))
            vals[0] = str(i + 1)
            tag = 'oddrow' if i % 2 == 0 else 'evenrow'
            self.tree.item(item, values=vals, tags=(tag,))

    def _update_status(self):
        """ステータスバーのテキストを更新する。"""
        try:
            mtime = os.path.getmtime(self.csv_path)
            dt = datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M')
        except Exception:
            dt = '---'
        count = len(self.tree.get_children())
        self._status_var.set(
            f'{os.path.basename(self.csv_path)}  |  {count} レコード  |  最終更新: {dt}'
        )

    def _on_double_click(self, event):
        self._commit_edit()
        if self.tree.identify_region(event.x, event.y) != 'cell':
            return
        row_id = self.tree.identify_row(event.y)
        col_id = self.tree.identify_column(event.x)
        if not row_id or not col_id:
            return
        # '#1'=行番号列, '#2'以降=データ列
        display_ci = int(col_id.lstrip('#')) - 1
        if display_ci == 0:   # 行番号列は編集不可
            return
        data_ci = display_ci - 1

        bbox = self.tree.bbox(row_id, col_id)
        if not bbox:
            return
        x, y, w, h = bbox
        vals = self.tree.item(row_id, 'values')
        val = vals[display_ci] if display_ci < len(vals) else ''
        if data_ci in self._numeric_cols:
            val = self._raw_num(val)

        self._editing = (row_id, data_ci)
        if data_ci in self._date_cols and _TKCALENDAR:
            self._entry = _DateEntry(
                self.tree, date_pattern='yyyy-mm-dd', width=12,
                background='#3a7dc8', foreground='white', borderwidth=1,
            )
            self._entry.place(x=x, y=y, width=w, height=h)
            if val:
                try:
                    from datetime import date as _date
                    parts = val.replace('/', '-').split('-')
                    self._entry.set_date(_date(int(parts[0]), int(parts[1]), int(parts[2])))
                except Exception:
                    pass
        else:
            self._entry = ttk.Entry(self.tree)
            self._entry.place(x=x, y=y, width=w, height=h)
            self._entry.insert(0, val)
            self._entry.select_range(0, tk.END)
        self._entry.focus_set()
        self._entry.bind('<Return>', lambda _: self._commit_edit())
        self._entry.bind('<Tab>',    lambda _: self._commit_edit())
        self._entry.bind('<Escape>', lambda _: self._cancel_edit())
        if data_ci in self._date_cols and _TKCALENDAR:
            # FocusOutはカレンダー展開時に誤発火するため除外
            # 日付選択完了時に発火する仮想イベントを使う
            self._entry.bind('<<DateEntrySelected>>', lambda _: self._commit_edit())
        else:
            self._entry.bind('<FocusOut>', lambda _: self._commit_edit())

    def _commit_edit(self):
        if not self._entry or not self._editing:
            return
        try:
            if not self._entry.winfo_exists():
                return
            row_id, data_ci = self._editing
            new_val = self._entry.get()
            display_val = self._fmt_num(new_val) if data_ci in self._numeric_cols else new_val
            vals = list(self.tree.item(row_id, 'values'))
            # vals[0]=行番号, vals[data_ci+1]=対象データ列
            while len(vals) <= data_ci + 1:
                vals.append('')
            vals[data_ci + 1] = display_val
            self.tree.item(row_id, values=vals)
        except Exception:
            pass
        finally:
            self._cancel_edit()

    def _cancel_edit(self):
        if self._entry:
            try:
                self._entry.destroy()
            except Exception:
                pass
            self._entry = None
        self._editing = None

    def _add_row(self):
        self._commit_edit()
        next_no = len(self.tree.get_children()) + 1
        tag = 'oddrow' if (next_no - 1) % 2 == 0 else 'evenrow'
        self.tree.insert('', tk.END,
                         values=[str(next_no)] + [''] * len(self._headers),
                         tags=(tag,))
        self._update_status()

    def _delete_row(self):
        self._commit_edit()
        for item in self.tree.selection():
            self.tree.delete(item)
        self._renumber_rows()
        self._update_status()

    def _save(self):
        self._commit_edit()
        try:
            with open(self.csv_path, 'w', encoding='utf-8-sig', newline='') as f:
                w = csv.writer(f)
                w.writerow(self._headers)
                for item in self.tree.get_children():
                    vals = list(self.tree.item(item, 'values'))
                    # vals[0] は行番号なのでスキップ
                    data_vals = (vals[1:] + [''] * len(self._headers))[:len(self._headers)]
                    saved = [
                        self._raw_num(v) if ci in self._numeric_cols else v
                        for ci, v in enumerate(data_vals)
                    ]
                    w.writerow(saved)
            messagebox.showinfo('Saved', '保存しました', parent=self)
            self.destroy()
        except Exception as e:
            messagebox.showerror('Error', f'保存に失敗しました:\n{e}', parent=self)


class EnvSettingsWindow(tk.Toplevel):
    """選択プロファイルの .env ファイルを GUI で編集するウィンドウ。"""

    # (key, label, type, options, hint)
    _SETTINGS = [
        ('HEADLESS',
         'ヘッドレスモード',
         'bool', None,
         'ON=ブラウザ画面を表示しない（高速・CI向き） / OFF=画面あり（目視確認向き）'),
        ('SCREENSHOT_ON_NAVIGATION',
         'スクリーンショット（画面遷移時）',
         'bool', None,
         'ON=遷移のたびにAllureレポートへ画像を添付 / OFF=撮影しない（実行時間短縮）'),
        ('CHECKBOX_DEBUG',
         'チェックボックスデバッグログ',
         'bool', None,
         'ON=どのセレクタでチェック操作したかをコンソールに出力（動作調査時のみ推奨）'),
        ('FORM_FILL_FAST',
         'フォーム一括入力（高速）',
         'bool', None,
         'ON=フィールドをまとめてセット（高速） / OFF=1つずつ入力（安全・デフォルト）'),
        ('SHIMAMURA_NAV',
         '遷移方式',
         'select', ['デフォルト（URLで直接遷移）', 'sidebar（メニュークリック）'],
         'デフォルト=URLを直接開いて遷移 / sidebar=サイドバーのメニューをクリックして遷移'),
    ]

    def __init__(self, parent, env_path):
        super().__init__(parent)
        self.env_path = env_path
        self.title(f'Settings — {os.path.basename(env_path)}')
        self.geometry('460x420')
        self.resizable(False, False)
        self._vars = {}
        self._load_and_build()

    def _load_env(self):
        result = {}
        try:
            with open(self.env_path, encoding='utf-8') as f:
                for line in f:
                    stripped = line.strip()
                    if not stripped or stripped.startswith('#'):
                        continue
                    if '=' in stripped:
                        k, _, v = stripped.partition('=')
                        result[k.strip()] = v.strip().strip('"').strip("'")
        except Exception:
            pass
        return result

    def _load_and_build(self):
        values = self._load_env()
        ttk.Label(
            self, text=os.path.basename(self.env_path),
            font=('Segoe UI', 10, 'bold'),
        ).pack(padx=16, pady=(12, 6), anchor='w')

        frame = ttk.Frame(self)
        frame.pack(fill=tk.BOTH, expand=True, padx=16, pady=4)
        frame.columnconfigure(0, weight=1)

        for i, (key, label, typ, options, hint) in enumerate(self._SETTINGS):
            row_base = i * 3
            # ラベル行
            ttk.Label(frame, text=label, font=('Segoe UI', 9, 'bold')).grid(
                row=row_base, column=0, sticky='w', pady=(8, 0))
            # コントロール行
            if typ == 'bool':
                var = tk.BooleanVar(value=values.get(key, 'false').lower() == 'true')
                ttk.Checkbutton(frame, variable=var, text='有効').grid(
                    row=row_base + 1, column=0, sticky='w', padx=(4, 0))
            else:
                raw = values.get(key, '')
                cur = 'sidebar（メニュークリック）' if raw == 'sidebar' else 'デフォルト（URLで直接遷移）'
                var = tk.StringVar(value=cur)
                ttk.Combobox(
                    frame, textvariable=var, values=options,
                    state='readonly', width=30,
                ).grid(row=row_base + 1, column=0, sticky='w', padx=(4, 0))
            self._vars[key] = var
            # ヒント行
            ttk.Label(
                frame, text=hint,
                foreground='#888888', font=('Segoe UI', 8),
                wraplength=410, justify='left',
            ).grid(row=row_base + 2, column=0, sticky='w', padx=(4, 0))

        btn_frame = ttk.Frame(self)
        btn_frame.pack(fill=tk.X, padx=16, pady=(8, 14))
        ttk.Button(btn_frame, text='Cancel', command=self.destroy).pack(side=tk.RIGHT, padx=(4, 0))
        ttk.Button(btn_frame, text='Save', command=self._save).pack(side=tk.RIGHT)

    def _save(self):
        try:
            with open(self.env_path, encoding='utf-8') as f:
                lines = f.readlines()
        except Exception as e:
            messagebox.showerror('Error', f'読み込みに失敗しました:\n{e}', parent=self)
            return

        new_values = {}
        for key, var in self._vars.items():
            if key == 'SHIMAMURA_NAV':
                new_values[key] = 'sidebar' if var.get().startswith('sidebar') else ''
            else:
                new_values[key] = 'true' if var.get() else 'false'

        updated_keys = set()
        new_lines = []
        for line in lines:
            stripped = line.strip()
            # コメントアウトされた SHIMAMURA_NAV 行の処理
            if re.match(r'^#\s*SHIMAMURA_NAV\s*=', stripped):
                if new_values.get('SHIMAMURA_NAV') == 'sidebar':
                    new_lines.append('SHIMAMURA_NAV=sidebar\n')
                    updated_keys.add('SHIMAMURA_NAV')
                else:
                    new_lines.append(line)
                continue
            m = re.match(r'^([A-Z_]+)=', stripped)
            if m and m.group(1) in new_values:
                k = m.group(1)
                val = new_values[k]
                if k == 'SHIMAMURA_NAV':
                    new_lines.append('SHIMAMURA_NAV=sidebar\n' if val == 'sidebar' else '# SHIMAMURA_NAV=sidebar\n')
                else:
                    new_lines.append(f'{k}={val}\n')
                updated_keys.add(k)
                continue
            new_lines.append(line)

        for key, val in new_values.items():
            if key not in updated_keys and key != 'SHIMAMURA_NAV':
                new_lines.append(f'{key}={val}\n')
            elif key not in updated_keys and val == 'sidebar':
                new_lines.append('SHIMAMURA_NAV=sidebar\n')

        try:
            with open(self.env_path, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)
            messagebox.showinfo('Saved', '設定を保存しました', parent=self)
            self.destroy()
        except Exception as e:
            messagebox.showerror('Error', f'保存に失敗しました:\n{e}', parent=self)


class SplashScreen(tk.Toplevel):
    """起動中スプラッシュスクリーン。RunnerApp の初期化が完了したら destroy() で閉じる。"""
    _W, _H = 400, 160

    def __init__(self, parent):
        super().__init__(parent)
        self.overrideredirect(True)
        sw, sh = self.winfo_screenwidth(), self.winfo_screenheight()
        x = (sw - self._W) // 2
        y = (sh - self._H) // 2
        self.geometry(f'{self._W}x{self._H}+{x}+{y}')
        self.configure(background='#1e2a3a')
        self.resizable(False, False)
        tk.Label(
            self, text='CodeceptJS Test Runner',
            font=('Segoe UI', 16, 'bold'),
            foreground='#4a9eff', background='#1e2a3a',
        ).pack(pady=(30, 4))
        tk.Label(
            self, text='起動中...',
            font=('Segoe UI', 9),
            foreground='#aaaaaa', background='#1e2a3a',
        ).pack()
        self._bar = ttk.Progressbar(self, mode='indeterminate', length=340)
        self._bar.pack(pady=(14, 0))
        self._bar.start(10)
        self.lift()
        self.update()


class RunnerApp(tk.Tk):
    def __init__(self, repo_root):
        super().__init__()
        self.withdraw()  # 初期化完了まで非表示
        self._splash = SplashScreen(self)
        self.title('CodeceptJS Test Runner')
        self.geometry('1100x720')
        self.minsize(860, 600)

        self.repo_root = repo_root
        self.env_dir = os.path.join(repo_root, 'env')
        self.tests_dir = os.path.join(repo_root, 'tests')
        self.logs_dir = os.path.join(repo_root, 'logs')

        self.log_queue = queue.Queue()
        self.proc = None
        self.thread = None
        self.is_running = False
        self._run_start_time = 0.0

        self._all_tests = []
        self._all_profiles = []
        self._filtered_test_paths = []  # 選択 Product の全テスト
        self._visible_test_paths = []   # フィルター・ソート後の表示対象
        self._descriptions = load_descriptions(os.path.dirname(__file__))

        self.product_var = tk.StringVar()
        self.test_var = tk.StringVar()
        self.profile_var = tk.StringVar()
        self.grep_var = tk.StringVar()
        self.feature_filter_var = tk.StringVar()
        self.sort_by_feature_var = tk.BooleanVar()
        self.debug_var = tk.BooleanVar()
        self.cmd_var = tk.StringVar()
        self.status_var = tk.StringVar(value='Ready')

        self._build_ui()
        if _SV_TTK:
            _sv_ttk.set_theme('light')
        self._all_tests = find_all_tests(self.tests_dir)
        self._all_profiles = find_all_profiles(self.env_dir)
        self._load_products()
        self.after(100, self._drain_log_queue)
        self.after(300, self._auto_cleanup_on_start)
        self._splash.destroy()
        self.deiconify()

    def _build_ui(self):
        ttk.Label(self, text='CodeceptJS Test Runner', font=('Segoe UI', 14, 'bold')).pack(pady=8)

        body = ttk.Frame(self)
        body.pack(fill=tk.BOTH, expand=True, padx=12, pady=4)

        # ---- 左ペイン ----
        left = ttk.Frame(body)
        left.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 12))

        # 上部：選択エリア（ウィンドウ高さに合わせて伸び縮みする）
        left_top = ttk.Frame(left)
        left_top.pack(fill=tk.BOTH, expand=True)
        left_top.columnconfigure(0, weight=1)
        left_top.rowconfigure(3, weight=2)  # テストリストが高さを吸収
        left_top.rowconfigure(7, weight=1)  # プロファイルリストも少し伸び縮み

        # 下部：ボタン（常に見える固定エリア）
        left_bot = ttk.Frame(left)
        left_bot.pack(fill=tk.X, pady=(6, 0))

        # Product
        ttk.Label(left_top, text='Product').grid(row=0, column=0, columnspan=2, sticky='w')
        self.product_combo = ttk.Combobox(left_top, textvariable=self.product_var, width=46, state='readonly')
        self.product_combo.grid(row=1, column=0, columnspan=2, sticky='ew')
        self.product_combo.bind('<<ComboboxSelected>>', self._on_product_select)

        # Test File
        ttk.Label(left_top, text='Test File').grid(row=2, column=0, columnspan=2, sticky='w', pady=(8, 0))
        self.test_list = tk.Listbox(left_top, width=48, height=8, exportselection=False, font=('Courier New', 9))
        tsb_y = ttk.Scrollbar(left_top, orient='vertical', command=self.test_list.yview)
        tsb_x = ttk.Scrollbar(left_top, orient='horizontal', command=self.test_list.xview)
        self.test_list.configure(yscrollcommand=tsb_y.set, xscrollcommand=tsb_x.set)
        self.test_list.grid(row=3, column=0, sticky='nsew')
        tsb_y.grid(row=3, column=1, sticky='ns')
        tsb_x.grid(row=4, column=0, sticky='ew')
        self.test_list.bind('<<ListboxSelect>>', self._on_test_select)

        # Test description
        self.desc_var = tk.StringVar(value='')
        desc_label = ttk.Label(
            left_top, textvariable=self.desc_var,
            foreground='#555555', wraplength=340, justify='left',
        )
        desc_label.grid(row=5, column=0, columnspan=2, sticky='w', pady=(2, 0))

        # Profile
        self.profile_label = ttk.Label(left_top, text='Profile')
        self.profile_label.grid(row=6, column=0, columnspan=2, sticky='w', pady=(8, 0))
        self.profile_list = tk.Listbox(left_top, width=48, height=3, exportselection=False)
        psb = ttk.Scrollbar(left_top, orient='vertical', command=self.profile_list.yview)
        self.profile_list.configure(yscrollcommand=psb.set)
        self.profile_list.grid(row=7, column=0, sticky='nsew')
        psb.grid(row=7, column=1, sticky='ns')
        self.profile_list.bind('<<ListboxSelect>>', self._on_profile_select)

        # Grep filter
        ttk.Label(left_top, text='Grep (任意)').grid(row=8, column=0, columnspan=2, sticky='w', pady=(8, 0))
        self.grep_combo = ttk.Combobox(left_top, textvariable=self.grep_var, width=46)
        self.grep_combo.grid(row=9, column=0, columnspan=2, sticky='ew')
        self.grep_combo.bind('<KeyRelease>', lambda _: self._update_cmd_display())
        self.grep_combo.bind('<<ComboboxSelected>>', lambda _: self._update_cmd_display())
        self.grep_hint_var = tk.StringVar(value='')
        ttk.Label(
            left_top, textvariable=self.grep_hint_var,
            foreground='#4a9eff', wraplength=340, justify='left',
        ).grid(row=10, column=0, columnspan=2, sticky='w')

        # 機能番号フィルター
        feature_filter_frame = ttk.Frame(left_top)
        feature_filter_frame.grid(row=11, column=0, columnspan=2, sticky='ew', pady=(8, 0))
        ttk.Label(feature_filter_frame, text='機能番号フィルター').pack(side=tk.LEFT)
        ttk.Entry(feature_filter_frame, textvariable=self.feature_filter_var, width=20).pack(side=tk.LEFT, padx=(4, 8))
        self.feature_filter_var.trace_add('write', lambda *_: self._apply_test_filter())
        ttk.Checkbutton(
            feature_filter_frame, text='番号順',
            variable=self.sort_by_feature_var, command=self._apply_test_filter,
        ).pack(side=tk.LEFT)

        # Buttons（2列グリッド・常に下部に固定表示）
        btn_frame = ttk.Frame(left_bot)
        btn_frame.pack(fill=tk.X)
        btn_frame.columnconfigure(0, weight=1)
        btn_frame.columnconfigure(1, weight=1)

        debug_cb = ttk.Checkbutton(
            btn_frame, text='デバッグモード (--steps --debug)',
            variable=self.debug_var, command=self._update_cmd_display,
        )
        debug_cb.grid(row=0, column=0, columnspan=2, sticky='w', pady=(0, 4))

        self.run_btn = ttk.Button(btn_frame, text='Run Test', command=self._on_run)
        self.run_btn.grid(row=1, column=0, sticky='ew', padx=(0, 2), pady=2)
        self.stop_btn = ttk.Button(btn_frame, text='Stop', command=self._on_stop)
        self.stop_btn.grid(row=1, column=1, sticky='ew', padx=(2, 0), pady=2)
        self.stop_btn.state(['disabled'])

        self.allure_btn = ttk.Button(btn_frame, text='Open Allure', command=self._on_open_allure)
        self.allure_btn.grid(row=2, column=0, sticky='ew', padx=(0, 2), pady=2)
        self.csv_btn = ttk.Button(btn_frame, text='Open CSV', command=self._on_open_csv)
        self.csv_btn.grid(row=2, column=1, sticky='ew', padx=(2, 0), pady=2)
        self.csv_btn.state(['disabled'])
        self.csv_hint_var = tk.StringVar(value='')
        _Tooltip(self.csv_btn, self.csv_hint_var)

        self.login_hold_btn = ttk.Button(
            btn_frame, text='Login & Hold  (shimamura)',
            command=self._on_login_and_hold,
        )
        self.login_hold_btn.grid(row=3, column=0, columnspan=2, sticky='ew', pady=(4, 2))

        self.settings_btn = ttk.Button(btn_frame, text='Settings (.env)', command=self._on_open_settings)
        self.settings_btn.grid(row=4, column=0, columnspan=2, sticky='ew', pady=(2, 2))

        # ---- 右ペイン ----
        right = ttk.Frame(body)
        right.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

        ttk.Label(right, text='Command (参照用)').pack(anchor='w')
        ttk.Entry(right, textvariable=self.cmd_var, state='readonly').pack(fill=tk.X, pady=(0, 8))

        ttk.Label(right, text='Log').pack(anchor='w')
        self.log_text = ScrolledText(right, wrap=tk.WORD, font=LOG_FONT)
        self.log_text.pack(fill=tk.BOTH, expand=True)
        self.log_text.configure(state='disabled')
        self._configure_log_tags()
        self._bind_log_context_menu()

        # ---- ダウンロードパネル（テスト完了後に自動表示） ----
        self._dl_frame = ttk.LabelFrame(right, text='ダウンロードファイル')
        # 初期は非表示 - _show_downloads_panel() が呼ばれたときに pack する
        dl_cols = ('name', 'size', 'rows', 'enc')
        self._dl_tree = ttk.Treeview(self._dl_frame, columns=dl_cols, show='headings', height=3)
        self._dl_tree.heading('name', text='ファイル名')
        self._dl_tree.heading('size', text='サイズ')
        self._dl_tree.heading('rows', text='件数')
        self._dl_tree.heading('enc', text='形式/エンコード')
        self._dl_tree.column('name', width=260, stretch=True)
        self._dl_tree.column('size', width=70, anchor='e')
        self._dl_tree.column('rows', width=70, anchor='e')
        self._dl_tree.column('enc', width=80, anchor='center')
        self._dl_tree.pack(fill=tk.X, padx=4, pady=(4, 2))
        dl_btn = ttk.Frame(self._dl_frame)
        dl_btn.pack(fill=tk.X, padx=4, pady=(0, 4))
        ttk.Button(dl_btn, text='フォルダを開く', command=self._open_downloads_folder).pack(side=tk.LEFT, padx=(0, 4))
        ttk.Button(dl_btn, text='Excelで開く', command=self._open_selected_dl_file).pack(side=tk.LEFT)

        ttk.Label(self, textvariable=self.status_var, anchor='w').pack(fill=tk.X, padx=8, pady=(0, 4))

    def _load_products(self):
        products = find_products(self.tests_dir)
        if not products:
            messagebox.showwarning('No Products', 'tests/ 配下にサブフォルダが見つかりません。')
            return
        self.product_combo['values'] = products
        self.product_combo.current(0)
        self.product_var.set(products[0])
        self._on_product_select(None)

    def _on_product_select(self, _event):
        product = self.product_var.get()
        self._filtered_test_paths = [t for t in self._all_tests if _get_product_from_test(t) == product]
        self._apply_test_filter()
        self._refresh_profiles(product)

    def _apply_test_filter(self):
        """feature_filter_var と sort_by_feature_var を見て _visible_test_paths を更新し、リストを再描画する。"""
        product = self.product_var.get()
        query = self.feature_filter_var.get().strip()
        sort_by_feature = self.sort_by_feature_var.get()

        if query:
            prefix = f'./tests/{product}/'
            def _matches(path):
                rel = path[len(prefix):] if path.startswith(prefix) else path
                fno = get_feature_no(self._descriptions.get(product, {}).get(rel))
                return fno.startswith(query)
            paths = [p for p in self._filtered_test_paths if _matches(p)]
        else:
            paths = list(self._filtered_test_paths)

        if sort_by_feature:
            prefix = f'./tests/{product}/'
            def _sort_key(path):
                rel = path[len(prefix):] if path.startswith(prefix) else path
                fno = get_feature_no(self._descriptions.get(product, {}).get(rel))
                return (0 if fno else 1, fno, path)
            paths = sorted(paths, key=_sort_key)

        self._visible_test_paths = paths
        display_names = [get_display_name(t, product, self._descriptions) for t in paths]
        formatted = format_test_list(display_names)
        self.test_list.delete(0, tk.END)
        for name in formatted:
            self.test_list.insert(tk.END, name)
        if paths:
            self.test_list.selection_set(0)
            self.test_list.activate(0)
            self.test_var.set(paths[0])
        else:
            self.test_var.set('')
        self._update_desc_label()
        self._update_grep_combo()
        self._update_cmd_display()
        self._update_csv_btn()

    def _refresh_profiles(self, product):
        """product に対応するプロファイルでリストを更新し、ラベルに製品名を表示する。"""
        order = self._descriptions.get('_profile_order', {}).get(product)
        filtered = filter_profiles_for_product(self._all_profiles, product, order)
        has_match = product and any(
            p == product or p.startswith(product + '.') for p in self._all_profiles
        )
        self.profile_label.configure(
            text=f'Profile  [{product}]' if has_match else 'Profile  [全て]'
        )
        current = self.profile_var.get()
        self.profile_list.delete(0, tk.END)
        for p in filtered:
            self.profile_list.insert(tk.END, p)
        idx = filtered.index(current) if current in filtered else 0
        if filtered:
            self.profile_list.selection_set(idx)
            self.profile_list.activate(idx)
            self.profile_var.set(filtered[idx])

    def _on_test_select(self, _event):
        sel = self.test_list.curselection()
        if not sel:
            return
        self.test_var.set(self._visible_test_paths[sel[0]])
        self._update_desc_label()
        self._update_grep_combo()
        self._update_cmd_display()
        self._update_csv_btn()

    def _update_grep_combo(self):
        test_path = os.path.join(self.repo_root, self.test_var.get().lstrip('./'))
        tags = extract_tags_from_test(test_path)
        self.grep_combo['values'] = [''] + tags
        if self.grep_var.get() not in ([''] + tags):
            self.grep_var.set('')
        if tags:
            self.grep_hint_var.set('使えるタグ: ' + '  '.join(tags))
        else:
            self.grep_hint_var.set('')

    def _update_desc_label(self):
        product = self.product_var.get()
        prefix = f'./tests/{product}/'
        test = self.test_var.get()
        key = test[len(prefix):] if test.startswith(prefix) else test
        entry = self._descriptions.get(product, {}).get(key, '')
        self.desc_var.set(get_desc_text(entry))

    def _update_csv_btn(self):
        product = self.product_var.get()
        test = self.test_var.get()
        csvs = find_csvs_for_test(self.repo_root, test, product)
        self._csv_paths = csvs
        if csvs:
            self.csv_btn.state(['!disabled'])
            names = [os.path.basename(p) for p in csvs]
            self.csv_hint_var.set('  '.join(names))
        else:
            self.csv_btn.state(['disabled'])
            self.csv_hint_var.set('')

    def _on_open_csv(self):
        csvs = getattr(self, '_csv_paths', [])
        if not csvs:
            messagebox.showinfo('CSV not found', '対応する CSV ファイルが見つかりません。')
            return
        for path in csvs:
            CsvEditorWindow(self, path)

    def _on_profile_select(self, _event):
        sel = self.profile_list.curselection()
        if not sel:
            return
        self.profile_var.set(self.profile_list.get(sel[0]))
        self._update_cmd_display()

    def _update_cmd_display(self):
        test = self.test_var.get()
        profile = self.profile_var.get()
        if test and profile:
            grep = self.grep_var.get().strip()
            debug = self.debug_var.get()
            self.cmd_var.set(' '.join(build_command(test, profile, grep or None, debug)))
        else:
            self.cmd_var.set('')

    def _set_running(self, running):
        self.is_running = running
        if running:
            self.run_btn.state(['disabled'])
            self.stop_btn.state(['!disabled'])
            self.status_var.set('Running...')
        else:
            self.run_btn.state(['!disabled'])
            self.stop_btn.state(['disabled'])
            self.status_var.set('Ready')

    def _configure_log_tags(self):
        for name, opts in _LOG_TAGS.items():
            self.log_text.tag_configure(name, **opts)

    def _get_log_tag(self, line):
        s = line.strip()
        if s.startswith('==='):
            return 'header'
        if s.startswith('---'):
            return 'debug'
        if 'FAIL  |' in line or '-- FAILURES:' in line:
            return 'fail'
        if 'PASS  |' in line or (re.search(r'\d+ passed', line) and '0 failed' in line):
            return 'pass'
        if s.startswith('×') or s.startswith('x ') or 'Error:' in line or 'ERROR:' in line:
            return 'error'
        if s.startswith('✓') or s.startswith('√') or s.startswith('ok '):
            return 'pass'
        if 'warn' in line.lower() or 'warning' in line.lower():
            return 'warn'
        return None

    def _append_log(self, text):
        self.log_text.configure(state='normal')
        tag = self._get_log_tag(text)
        if tag:
            self.log_text.insert(tk.END, text, tag)
        else:
            self.log_text.insert(tk.END, text)
        self.log_text.see(tk.END)
        self.log_text.configure(state='disabled')

    def _drain_log_queue(self):
        try:
            while True:
                self._append_log(self.log_queue.get_nowait())
        except queue.Empty:
            pass
        self.after(100, self._drain_log_queue)

    def _auto_cleanup_on_start(self):
        """起動時に LOG_CLEANUP_DAYS 日以上古いログを自動アーカイブ・削除する。"""
        def run():
            results = cleanup_old_logs(self.logs_dir)
            results += _cleanup_old_learning_logs(
                os.path.join(REPO_ROOT, 'docs', 'common', 'learning'), LOG_CLEANUP_DAYS
            )
            if results:
                self.log_queue.put(f'=== 自動クリーンアップ（{LOG_CLEANUP_DAYS}日以上古いログ）===\n')
                for r in results:
                    self.log_queue.put(r + '\n')
                self.log_queue.put('==========================================\n\n')
        threading.Thread(target=run, daemon=True).start()

    def _autosave_log_file(self):
        log_content = self.log_text.get('1.0', tk.END).strip()
        if not log_content:
            return
        try:
            os.makedirs(self.logs_dir, exist_ok=True)
            test_name = os.path.basename(self.test_var.get()).replace('_test.js', '')
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filepath = os.path.join(self.logs_dir, f'{test_name}_{timestamp}.log')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(log_content)
            self.log_queue.put(f'\n--- Log saved: {filepath} ---\n')
        except Exception as exc:
            self.log_queue.put(f'\n--- Failed to save log: {exc} ---\n')

    def _show_save_dialog(self):
        log_content = self.log_text.get('1.0', tk.END).strip()
        if not log_content:
            messagebox.showinfo('Log Empty', 'ログが空です。')
            return
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filepath = filedialog.asksaveasfilename(
            initialdir=self.logs_dir,
            initialfile=f'test-log-{timestamp}.txt',
            defaultextension='.txt',
            filetypes=[('Text Documents', '*.txt'), ('All Files', '*.*')],
        )
        if not filepath:
            return
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(log_content)
            messagebox.showinfo('Saved', f'保存しました:\n{filepath}')
        except Exception as exc:
            messagebox.showerror('Error', f'保存に失敗しました:\n{exc}')

    def _on_run(self):
        test = self.test_var.get().strip()
        profile = self.profile_var.get().strip()
        if not test:
            messagebox.showerror('Test required', 'テストファイルを選択してください。')
            return
        if not profile:
            messagebox.showerror('Profile required', 'プロファイルを選択してください。')
            return
        if self.thread and self.thread.is_alive():
            messagebox.showinfo('Running', 'テストは既に実行中です。')
            return

        self._run_start_time = datetime.now().timestamp()
        self._hide_downloads_panel()
        self.log_text.configure(state='normal')
        self.log_text.delete('1.0', tk.END)
        self.log_text.configure(state='disabled')
        self._append_log(f'=== {test}  [{profile}] ===\n')
        self._set_running(True)

        grep = self.grep_var.get().strip()
        debug = self.debug_var.get()
        cmd = build_command(test, profile, grep or None, debug)
        self.thread = threading.Thread(target=self._run_process, args=(cmd, debug), daemon=True)
        self.thread.start()

    def _bind_log_context_menu(self):
        self._log_menu = tk.Menu(self, tearoff=0)
        self._log_menu.add_command(label='Save Log...', command=self._show_save_dialog)
        self._log_menu.add_command(label='Clear Log', command=self._clear_log)
        self.log_text.bind('<Button-3>', self._show_log_context_menu)

    def _show_log_context_menu(self, event):
        try:
            self._log_menu.tk_popup(event.x_root, event.y_root)
        finally:
            self._log_menu.grab_release()

    def _clear_log(self):
        self.log_text.configure(state='normal')
        self.log_text.delete('1.0', tk.END)
        self.log_text.configure(state='disabled')

    def _on_open_settings(self):
        profile = self.profile_var.get().strip()
        if not profile:
            messagebox.showerror('Profile required', 'プロファイルを選択してください。')
            return
        env_path = os.path.join(self.env_dir, f'.env.{profile}')
        if not os.path.isfile(env_path):
            messagebox.showwarning('Not found', f'.env.{profile} が見つかりません:\n{env_path}')
            return
        EnvSettingsWindow(self, env_path)

    def _on_login_and_hold(self):
        """shimamura にログインしてブラウザを手動操作できる状態で開く。
        新しいコンソールウィンドウで I.pause() を実行し、ユーザーが resume/exit を入力するまで待機する。"""
        profile = self.profile_var.get().strip()
        if not profile:
            messagebox.showerror('Profile required', 'プロファイルを選択してください。')
            return
        if not profile.startswith('shimamura'):
            messagebox.showwarning(
                'shimamura 専用',
                f'Login & Hold は shimamura プロファイル専用です。\n現在のプロファイル: {profile}',
            )
            return

        parts = build_command(_LOGIN_HOLD_TEST, profile)
        npm_cmd = subprocess.list2cmdline(parts)
        title = f'Login & Hold [{profile}]'

        try:
            # 新しいコンソールウィンドウで起動（/k = コマンド終了後もウィンドウを残す）
            subprocess.Popen(
                ['cmd.exe', '/c', 'start', title, 'cmd.exe', '/k', npm_cmd],
                cwd=self.repo_root,
            )
            self._append_log(f'\n=== Login & Hold [{profile}] ===\n')
            self._append_log('--- 新しいターミナルウィンドウでブラウザを起動しました\n')
            self._append_log('--- ログイン完了後にブラウザを手動操作できます\n')
            self._append_log('--- ターミナルに "resume" と入力するか Ctrl+C × 2 で終了します\n')
        except Exception as exc:
            messagebox.showerror('Error', f'起動に失敗しました:\n{exc}')

    def _on_open_allure(self):
        profile = self.profile_var.get().strip()
        if not profile:
            messagebox.showerror('Profile required', 'プロファイルを選択してください。')
            return
        allure_dir = os.path.join(self.repo_root, 'allure-results', profile)
        if not os.path.isdir(allure_dir):
            messagebox.showwarning('No Results', f'Allure 結果が見つかりません:\n{allure_dir}\n\n先にテストを実行してください。')
            return
        cmd = ['node', _ALLURE_SCRIPT, profile]
        self._append_log(f'\n=== Open Allure [{profile}] ===\n')
        self._append_log(f'--- run: {" ".join(cmd)}\n')
        threading.Thread(target=self._run_allure_process, args=(cmd,), daemon=True).start()

    def _run_allure_process(self, cmd):
        try:
            proc = self._pipe_process_output(cmd)
            for line in proc.stdout:
                self.log_queue.put(line)
        except Exception as exc:
            self.log_queue.put(f'\nERROR: Allure open failed: {exc}\n')

    def _pipe_process_output(self, cmd, env=None):
        """cmd を実行して stdout を log_queue に流す準備をした Popen オブジェクトを返す。"""
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

    def _hide_downloads_panel(self):
        self._dl_frame.pack_forget()

    def _show_downloads_panel(self):
        """output/downloads/ から実行開始後に作成されたファイルを探して表示する。"""
        dl_dir = os.path.join(self.repo_root, _DOWNLOADS_DIR)
        if not os.path.isdir(dl_dir):
            return
        start = self._run_start_time
        new_files = sorted(
            [
                os.path.join(dl_dir, f)
                for f in os.listdir(dl_dir)
                if f.endswith(('.csv', '.tsv', '.txt'))
                and os.path.getmtime(os.path.join(dl_dir, f)) >= start
            ],
            key=os.path.getmtime,
        )
        if not new_files:
            return
        for item in self._dl_tree.get_children():
            self._dl_tree.delete(item)
        for fpath in new_files:
            size_str = _format_filesize(os.path.getsize(fpath))
            count, unit, enc = _analyze_download_file(fpath)
            self._dl_tree.insert('', tk.END, iid=fpath, values=(
                os.path.basename(fpath), size_str, f'{count:,} {unit}', enc,
            ))
        self._dl_frame.configure(text=f'ダウンロードファイル（{len(new_files)} 件）')
        self._dl_frame.pack(fill=tk.X, pady=(4, 0))

    def _open_downloads_folder(self):
        dl_dir = os.path.join(self.repo_root, _DOWNLOADS_DIR)
        os.makedirs(dl_dir, exist_ok=True)
        os.startfile(dl_dir)

    def _open_selected_dl_file(self):
        sel = self._dl_tree.selection()
        if not sel:
            items = self._dl_tree.get_children()
            if not items:
                return
            sel = (items[0],)
        try:
            os.startfile(sel[0])
        except Exception as exc:
            messagebox.showerror('Error', f'ファイルを開けませんでした:\n{exc}')

    def _on_stop(self):
        if self.proc and self.proc.poll() is None:
            self._append_log('\n--- Stopping... ---\n')
            try:
                self.proc.terminate()
            except Exception as exc:
                self._append_log(f'Failed to terminate: {exc}\n')
        if self.is_running:
            self._set_running(False)
            self._autosave_log_file()

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


def main():
    app = RunnerApp(REPO_ROOT)
    app.mainloop()


if __name__ == '__main__':
    main()
