# GUI test runner for Shimamura syokai test
# Uses only Python standard library (Tkinter)
"""
しまむら会CodeceptJSテストを実行するためのGUIアプリケーション。

このスクリプトは、テストプロファイルを選択して 'syokai_touroku.js' テストを実行するための
シンプルなTkinterベースのUIを提供します。テスト出力をリアルタイムで表示し、
ユーザーがテストの実行を停止できるようにします。

これは、CodeceptJSテスト自体に必要なもの（つまり、Node.jsとnpm）以外の
外部依存関係を持たないスタンドアロンユーティリティとして設計されています。
"""

import os
import sys
import threading
import subprocess
import queue
import tkinter as tk
from tkinter import ttk
from tkinter import messagebox
from tkinter.scrolledtext import ScrolledText
from tkinter import filedialog
from datetime import datetime


def find_profiles(env_dir):
    """
    環境ディレクトリ内で利用可能なテストプロファイルを見つけます。

    プロファイルは '.env.shimamura.<profile>' ファイルの存在によって決定されます。

    Args:
        env_dir (str): 'env' ディレクトリへのパス。

    Returns:
        list[str]: 一意のプロファイル名のソート済みリスト。
    """
    profiles = []
    if not os.path.isdir(env_dir):
        return profiles

    for name in os.listdir(env_dir):
        if not name.startswith('.env.shimamura'):
            continue
        if name.endswith('.template'):
            continue
        # .env.shimamura or .env.shimamura.<profile>
        parts = name.split('.env.')
        if len(parts) != 2:
            continue
        profile = parts[1]
        if profile:
            profiles.append(profile)

    profiles = sorted(set(profiles))
    return profiles


def build_command(profile):
    """
    実行するCodeceptJSコマンドを構築します。

    Args:
        profile (str): 使用するテストプロファイルの名前。

    Returns:
        list[str]: コマンドとその引数を文字列のリストとして返します。
    """
    return [
        'npx',
        'codeceptjs',
        'run',
        './tests/shimamura/syokai_touroku.js',
        '--profile',
        profile,
    ]


def wrap_command_for_windows(cmd):
    """
    Windowsでの適切な実行のためにコマンドをラップします。

    これは、非シェル環境から実行する際に 'npx' が正しく見つけられて実行されることを
    保証するために必要です。コマンドの前に 'cmd.exe /c' を追加します。

    Args:
        cmd (list[str]): ラップするコマンド。

    Returns:
        list[str]: Windows用にラップされたコマンド、または他のOSでは元のコマンド。
    """
    if os.name != 'nt':
        return cmd
    comspec = os.environ.get('ComSpec', 'cmd.exe')
    return [comspec, '/c'] + cmd


class RunnerApp(tk.Tk):
    """
    しまむらテストランナーGUIのメインアプリケーションクラス。

    このクラスは、メインウィンドウ、UIウィジェット、およびテストサブプロセスの
    実行と監視のロジックをカプセル化します。

    Attributes:
        repo_root (str): リポジトリルートへの絶対パス。
        env_dir (str): 環境設定ディレクトリへのパス。
        log_queue (queue.Queue): テストスレッドからログメッセージを渡すためのキュー。
        proc (subprocess.Popen | None): 現在実行中のテストサブプロセス。
        thread (threading.Thread | None): テストサブプロセスを実行しているスレッド。
        profile_var (tk.StringVar): 選択されたプロファイル名を保持する変数。
        status_var (tk.StringVar): 現在のステータスを表示するための変数。
    """
    def __init__(self, repo_root):
        """
        RunnerAppを初期化します。

        Args:
            repo_root (str): リポジトリのルートディレクトリ。
        """
        super().__init__()
        self.title('Shimamura Test Runner')
        self.geometry('760x520')
        self.minsize(640, 420)

        self.repo_root = repo_root
        self.env_dir = os.path.join(self.repo_root, 'env')
        self.logs_dir = os.path.join(self.repo_root, 'logs')
        self.log_queue = queue.Queue()
        self.proc = None
        self.thread = None
        self.is_running = False

        self.profile_var = tk.StringVar(value='')
        self.status_var = tk.StringVar(value='Ready')

        self._build_ui()
        self._load_profiles()
        self.after(100, self._drain_log_queue)

    def _build_ui(self):
        """メインユーザーインターフェースを構築し、レイアウトします。"""
        header = ttk.Label(self, text='Shimamura Syokai Test Runner', font=('Segoe UI', 14, 'bold'))
        header.pack(pady=8)

        body = ttk.Frame(self)
        body.pack(fill=tk.BOTH, expand=True, padx=12, pady=8)

        left = ttk.Frame(body)
        left.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 12))

        right = ttk.Frame(body)
        right.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

        profile_label = ttk.Label(left, text='Profile')
        profile_label.pack(anchor='w')

        self.profile_list = tk.Listbox(left, height=12, exportselection=False)
        self.profile_list.pack(fill=tk.Y, expand=False)
        self.profile_list.bind('<<ListboxSelect>>', self._on_profile_select)

        self.run_btn = ttk.Button(left, text='Run Test', command=self._on_run)
        self.run_btn.pack(fill=tk.X, pady=(12, 4))

        self.stop_btn = ttk.Button(left, text='Stop', command=self._on_stop)
        self.stop_btn.pack(fill=tk.X)
        self.stop_btn.state(['disabled'])
        
        self.save_btn = ttk.Button(left, text='Save Log', command=self._show_save_dialog)
        self.save_btn.pack(fill=tk.X, pady=(4,0))

        log_label = ttk.Label(right, text='Log')
        log_label.pack(anchor='w')

        self.log_text = ScrolledText(right, height=18, wrap=tk.WORD)
        self.log_text.pack(fill=tk.BOTH, expand=True)
        self.log_text.configure(state='disabled')

        status_bar = ttk.Label(self, textvariable=self.status_var, anchor='w')
        status_bar.pack(fill=tk.X, padx=8, pady=(0, 6))

    def _load_profiles(self):
        """
        'env'ディレクトリから利用可能なプロファイルをリストボックスに読み込みます。
        """
        profiles = find_profiles(self.env_dir)
        if not profiles:
            messagebox.showwarning('No Profiles', 'No shimamura profiles found in env/.')
            return

        for profile in profiles:
            self.profile_list.insert(tk.END, profile)

        # Default select shimamura if present
        if 'shimamura' in profiles:
            idx = profiles.index('shimamura')
            self.profile_list.selection_set(idx)
            self.profile_list.activate(idx)
            self.profile_var.set('shimamura')
        else:
            self.profile_list.selection_set(0)
            self.profile_list.activate(0)
            self.profile_var.set(profiles[0])

    def _on_profile_select(self, _event):
        """リストボックスでのプロファイル選択を処理します。"""
        sel = self.profile_list.curselection()
        if not sel:
            return
        self.profile_var.set(self.profile_list.get(sel[0]))

    def _set_running(self, running):
        """
        テストが実行中かどうかを反映するようにUIの状態を更新します。

        Args:
            running (bool): テストが開始されている場合はTrue、停止した場合はFalse。
        """
        self.is_running = running
        if running:
            self.run_btn.state(['disabled'])
            self.stop_btn.state(['!disabled'])
            self.save_btn.state(['disabled'])
            self.status_var.set('Running...')
        else:
            self.run_btn.state(['!disabled'])
            self.stop_btn.state(['disabled'])
            self.save_btn.state(['!disabled'])
            self.status_var.set('Ready')

    def _append_log(self, text):
        """
        ログウィジェットにテキスト行を追加します。

        Args:
            text (str): 追加するテキスト。
        """
        self.log_text.configure(state='normal')
        self.log_text.insert(tk.END, text)
        self.log_text.see(tk.END)
        self.log_text.configure(state='disabled')

    def _drain_log_queue(self):
        """定期的にログキューをチェックし、新しいメッセージをUIに追加します。"""
        try:
            while True:
                line = self.log_queue.get_nowait()
                self._append_log(line)
        except queue.Empty:
            pass
        self.after(100, self._drain_log_queue)

    def _autosave_log_file(self):
        """
        現在のログ内容をタイムスタンプ付きファイルに自動保存します。
        """
        log_content = self.log_text.get('1.0', tk.END).strip()
        if not log_content:
            self.log_queue.put('\n--- Log is empty, not saving. ---\n')
            return

        try:
            os.makedirs(self.logs_dir, exist_ok=True)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'syokai_{timestamp}.log'
            filepath = os.path.join(self.logs_dir, filename)

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(log_content)

            self.log_queue.put(f'\n--- Log autosaved to: {filepath} ---\n')
        except Exception as exc:
            self.log_queue.put(f'\n--- Failed to autosave log: {exc} ---\n')

    def _show_save_dialog(self):
        """
        手動でログを保存するためのファイルダイアログを表示します。
        """
        log_content = self.log_text.get('1.0', tk.END).strip()
        if not log_content:
            messagebox.showinfo('Log Empty', 'There is no log content to save.')
            return
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        default_filename = f'shimamura-test-log-{timestamp}.txt'

        filepath = filedialog.asksaveasfilename(
            initialdir=self.logs_dir,
            initialfile=default_filename,
            defaultextension=".txt",
            filetypes=[("Text Documents", "*.txt"), ("All Files", "*.*")]
        )

        if not filepath:
            return # User cancelled

        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(log_content)
            messagebox.showinfo('Success', f'Log successfully saved to:\n{filepath}')
        except Exception as exc:
            messagebox.showerror('Error', f'Failed to save log file:\n{exc}')


    def _on_run(self):
        """「Run Test」ボタンのイベントハンドラ。"""
        profile = self.profile_var.get().strip()
        if not profile:
            messagebox.showerror('Profile required', 'Please select a profile.')
            return

        if self.thread and self.thread.is_alive():
            messagebox.showinfo('Running', 'A test is already running.')
            return
        
        # Clear previous log content
        self.log_text.configure(state='normal')
        self.log_text.delete('1.0', tk.END)
        self.log_text.configure(state='disabled')

        self._append_log(f'=== Running profile: {profile} ===\n')
        self._set_running(True)

        cmd = build_command(profile)
        self.thread = threading.Thread(target=self._run_process, args=(cmd,), daemon=True)
        self.thread.start()

    def _on_stop(self):
        """「Stop」ボタンのイベントハンドラ。"""
        if self.proc and self.proc.poll() is None:
            self._append_log('\n--- Stopping process ---\n')
            try:
                self.proc.terminate() # This will trigger the finally block in _run_process
            except Exception as exc:
                self._append_log(f'Failed to terminate: {exc}\n')
        
        # If the process was already stopped, the finally block might not have run
        if self.is_running:
             self._set_running(False)
             self._autosave_log_file()


    def _run_process(self, cmd):
        """
        テスト実行スレッドのターゲット関数。

        指定されたコマンドをサブプロセスで実行し、その出力を
        ログキューにパイプします。

        Args:
            cmd (list[str]): 実行するコマンド。
        """
        try:
            wrapped_cmd = wrap_command_for_windows(cmd)
            self.proc = subprocess.Popen(
                wrapped_cmd,
                cwd=self.repo_root,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding='utf-8',
                errors='replace',
                bufsize=1,
            )

            for line in self.proc.stdout:
                self.log_queue.put(line)

            exit_code = self.proc.wait()
            self.log_queue.put(f'\n=== Finished (exit code {exit_code}) ===\n')
        except FileNotFoundError:
            self.log_queue.put('\nERROR: npx not found. Install Node.js/npm first.\n')
        except Exception as exc:
            self.log_queue.put(f'\nERROR: {exc}\n')
        finally:
            self.proc = None
            if self.is_running:
                self._set_running(False)
                self._autosave_log_file()


def main():
    """アプリケーションのメインエントリポイント。"""
    # The script is in the repo root
    repo_root = os.path.abspath(os.path.dirname(__file__))
    app = RunnerApp(repo_root)
    app.mainloop()


if __name__ == '__main__':
    main()
