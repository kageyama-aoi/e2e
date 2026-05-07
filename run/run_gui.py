# Generic CodeceptJS test runner GUI
# Uses only Python standard library (Tkinter)

import json
import os
import re
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


def get_product_from_test(test_path):
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


def get_display_name(test_path, product):
    """./tests/<product>/page/foo_test.js → page/foo_test.js"""
    prefix = f'./tests/{product}/'
    if test_path.startswith(prefix):
        return test_path[len(prefix):]
    return test_path


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


def filter_profiles_for_product(all_profiles, product):
    """product に対応するプロファイルを返す。一致なしの場合は全件返す。"""
    if not product:
        return list(all_profiles)
    matched = [p for p in all_profiles if p == product or p.startswith(product + '.')]
    return matched if matched else list(all_profiles)


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


def cleanup_old_logs(logs_dir, days=LOG_CLEANUP_DAYS):
    """logs/ 配下の <name>_<YYYYMMDD_HHMMSS>.log を days 日以上古ければアーカイブして削除する。"""
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


class RunnerApp(tk.Tk):
    def __init__(self, repo_root):
        super().__init__()
        self.title('CodeceptJS Test Runner')
        self.geometry('960x640')
        self.minsize(760, 520)

        self.repo_root = repo_root
        self.env_dir = os.path.join(repo_root, 'env')
        self.tests_dir = os.path.join(repo_root, 'tests')
        self.logs_dir = os.path.join(repo_root, 'logs')

        self.log_queue = queue.Queue()
        self.proc = None
        self.thread = None
        self.is_running = False

        self._all_tests = []
        self._all_profiles = []
        self._filtered_test_paths = []  # test_list の各行に対応するフルパス
        self._descriptions = load_descriptions(os.path.dirname(__file__))

        self.product_var = tk.StringVar()
        self.test_var = tk.StringVar()
        self.profile_var = tk.StringVar()
        self.grep_var = tk.StringVar()
        self.debug_var = tk.BooleanVar()
        self.cmd_var = tk.StringVar()
        self.status_var = tk.StringVar(value='Ready')

        self._build_ui()
        self._all_tests = find_all_tests(self.tests_dir)
        self._all_profiles = find_all_profiles(self.env_dir)
        self._load_products()
        self.after(100, self._drain_log_queue)
        self.after(300, self._auto_cleanup_on_start)

    def _build_ui(self):
        ttk.Label(self, text='CodeceptJS Test Runner', font=('Segoe UI', 14, 'bold')).pack(pady=8)

        body = ttk.Frame(self)
        body.pack(fill=tk.BOTH, expand=True, padx=12, pady=4)

        # ---- 左ペイン ----
        left = ttk.Frame(body)
        left.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 12))

        # Product
        ttk.Label(left, text='Product').grid(row=0, column=0, columnspan=2, sticky='w')
        self.product_list = tk.Listbox(left, width=42, height=4, exportselection=False)
        self.product_list.grid(row=1, column=0, columnspan=2, sticky='ew')
        self.product_list.bind('<<ListboxSelect>>', self._on_product_select)

        # Test File
        ttk.Label(left, text='Test File').grid(row=2, column=0, columnspan=2, sticky='w', pady=(8, 0))
        self.test_list = tk.Listbox(left, width=42, height=10, exportselection=False, font=('Courier New', 9))
        tsb_y = ttk.Scrollbar(left, orient='vertical', command=self.test_list.yview)
        tsb_x = ttk.Scrollbar(left, orient='horizontal', command=self.test_list.xview)
        self.test_list.configure(yscrollcommand=tsb_y.set, xscrollcommand=tsb_x.set)
        self.test_list.grid(row=3, column=0, sticky='nsew')
        tsb_y.grid(row=3, column=1, sticky='ns')
        tsb_x.grid(row=4, column=0, sticky='ew')
        self.test_list.bind('<<ListboxSelect>>', self._on_test_select)

        # Test description
        self.desc_var = tk.StringVar(value='')
        desc_label = ttk.Label(
            left, textvariable=self.desc_var,
            foreground='#555555', wraplength=300, justify='left',
        )
        desc_label.grid(row=5, column=0, columnspan=2, sticky='w', pady=(2, 0))

        # Profile
        self.profile_label = ttk.Label(left, text='Profile')
        self.profile_label.grid(row=6, column=0, columnspan=2, sticky='w', pady=(8, 0))
        self.profile_list = tk.Listbox(left, width=42, height=5, exportselection=False)
        psb = ttk.Scrollbar(left, orient='vertical', command=self.profile_list.yview)
        self.profile_list.configure(yscrollcommand=psb.set)
        self.profile_list.grid(row=7, column=0, sticky='ew')
        psb.grid(row=7, column=1, sticky='ns')
        self.profile_list.bind('<<ListboxSelect>>', self._on_profile_select)

        # Grep filter
        ttk.Label(left, text='Grep (任意)').grid(row=8, column=0, columnspan=2, sticky='w', pady=(8, 0))
        self.grep_combo = ttk.Combobox(left, textvariable=self.grep_var, width=40)
        self.grep_combo.grid(row=9, column=0, columnspan=2, sticky='ew')
        self.grep_combo.bind('<KeyRelease>', lambda _: self._update_cmd_display())
        self.grep_combo.bind('<<ComboboxSelected>>', lambda _: self._update_cmd_display())
        self.grep_hint_var = tk.StringVar(value='')
        ttk.Label(
            left, textvariable=self.grep_hint_var,
            foreground='#4a9eff', wraplength=300, justify='left',
        ).grid(row=10, column=0, columnspan=2, sticky='w')

        # Buttons（2列グリッド）
        btn_frame = ttk.Frame(left)
        btn_frame.grid(row=11, column=0, columnspan=2, sticky='ew', pady=(8, 0))
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

        ttk.Label(self, textvariable=self.status_var, anchor='w').pack(fill=tk.X, padx=8, pady=(0, 4))

    def _load_products(self):
        products = find_products(self.tests_dir)
        if not products:
            messagebox.showwarning('No Products', 'tests/ 配下にサブフォルダが見つかりません。')
            return
        for p in products:
            self.product_list.insert(tk.END, p)
        self.product_list.selection_set(0)
        self.product_list.activate(0)
        self.product_var.set(products[0])
        self._on_product_select(None)

    def _on_product_select(self, _event):
        sel = self.product_list.curselection()
        product = self.product_list.get(sel[0]) if sel else self.product_var.get()
        self.product_var.set(product)

        # テストリストを製品でフィルタリング（表示はサブパスのみ）
        self._filtered_test_paths = [t for t in self._all_tests if get_product_from_test(t) == product]
        display_names = [get_display_name(t, product) for t in self._filtered_test_paths]
        formatted = format_test_list(display_names)
        self.test_list.delete(0, tk.END)
        for name in formatted:
            self.test_list.insert(tk.END, name)
        if self._filtered_test_paths:
            self.test_list.selection_set(0)
            self.test_list.activate(0)
            self.test_var.set(self._filtered_test_paths[0])
        else:
            self.test_var.set('')

        # プロファイルリストを製品でフィルタリング
        self._refresh_profiles(product)
        self._update_desc_label()
        self._update_grep_combo()
        self._update_cmd_display()
        self._update_csv_btn()

    def _refresh_profiles(self, product):
        """product に対応するプロファイルでリストを更新し、ラベルに製品名を表示する。"""
        filtered = filter_profiles_for_product(self._all_profiles, product)
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
        self.test_var.set(self._filtered_test_paths[sel[0]])
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
        display = get_display_name(self.test_var.get(), product)
        desc = self._descriptions.get(product, {}).get(display, '')
        self.desc_var.set(desc)

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
            if os.name == 'nt':
                os.startfile(path)
            else:
                subprocess.Popen(['open' if sys.platform == 'darwin' else 'xdg-open', path])

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

    def _on_open_allure(self):
        profile = self.profile_var.get().strip()
        if not profile:
            messagebox.showerror('Profile required', 'プロファイルを選択してください。')
            return
        allure_dir = os.path.join(self.repo_root, 'allure-results', profile)
        if not os.path.isdir(allure_dir):
            messagebox.showwarning('No Results', f'Allure 結果が見つかりません:\n{allure_dir}\n\n先にテストを実行してください。')
            return
        cmd = ['node', 'scripts/allure/serve_latest.js', profile]
        self._append_log(f'\n=== Open Allure [{profile}] ===\n')
        self._append_log(f'--- run: {" ".join(cmd)}\n')
        threading.Thread(target=self._run_allure_process, args=(cmd,), daemon=True).start()

    def _run_allure_process(self, cmd):
        try:
            proc = subprocess.Popen(
                wrap_command_for_windows(cmd),
                cwd=self.repo_root,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding='utf-8',
                errors='replace',
                bufsize=1,
            )
            for line in proc.stdout:
                self.log_queue.put(line)
        except Exception as exc:
            self.log_queue.put(f'\nERROR: Allure open failed: {exc}\n')

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
            self.proc = subprocess.Popen(
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
            for line in self.proc.stdout:
                self.log_queue.put(line)
            exit_code = self.proc.wait()
            self.log_queue.put(f'\n=== Finished (exit code {exit_code}) ===\n')
        except FileNotFoundError:
            self.log_queue.put('\nERROR: npx が見つかりません。Node.js/npm をインストールしてください。\n')
        except Exception as exc:
            self.log_queue.put(f'\nERROR: {exc}\n')
        finally:
            self.proc = None
            if self.is_running:
                self._set_running(False)
                self._autosave_log_file()


def main():
    app = RunnerApp(REPO_ROOT)
    app.mainloop()


if __name__ == '__main__':
    main()
