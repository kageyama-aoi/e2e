# GUI test runner for Shimamura syokai test
# Uses only Python standard library (Tkinter)

import os
import sys
import threading
import subprocess
import queue
import tkinter as tk
from tkinter import ttk
from tkinter import messagebox
from tkinter.scrolledtext import ScrolledText


def find_profiles(env_dir):
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
    return [
        'npx',
        'codeceptjs',
        'run',
        './tests/shimamura/syokai_touroku.js',
        '--profile',
        profile,
    ]


def wrap_command_for_windows(cmd):
    if os.name != 'nt':
        return cmd
    comspec = os.environ.get('ComSpec', 'cmd.exe')
    return [comspec, '/c'] + cmd


class RunnerApp(tk.Tk):
    def __init__(self, repo_root):
        super().__init__()
        self.title('Shimamura Test Runner')
        self.geometry('760x520')
        self.minsize(640, 420)

        self.repo_root = repo_root
        self.env_dir = os.path.join(self.repo_root, 'env')
        self.log_queue = queue.Queue()
        self.proc = None
        self.thread = None

        self.profile_var = tk.StringVar(value='')
        self.status_var = tk.StringVar(value='Ready')

        self._build_ui()
        self._load_profiles()
        self.after(100, self._drain_log_queue)

    def _build_ui(self):
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

        log_label = ttk.Label(right, text='Log')
        log_label.pack(anchor='w')

        self.log_text = ScrolledText(right, height=18, wrap=tk.WORD)
        self.log_text.pack(fill=tk.BOTH, expand=True)
        self.log_text.configure(state='disabled')

        status_bar = ttk.Label(self, textvariable=self.status_var, anchor='w')
        status_bar.pack(fill=tk.X, padx=8, pady=(0, 6))

    def _load_profiles(self):
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
        sel = self.profile_list.curselection()
        if not sel:
            return
        self.profile_var.set(self.profile_list.get(sel[0]))

    def _set_running(self, running):
        if running:
            self.run_btn.state(['disabled'])
            self.stop_btn.state(['!disabled'])
            self.status_var.set('Running...')
        else:
            self.run_btn.state(['!disabled'])
            self.stop_btn.state(['disabled'])
            self.status_var.set('Ready')

    def _append_log(self, text):
        self.log_text.configure(state='normal')
        self.log_text.insert(tk.END, text)
        self.log_text.see(tk.END)
        self.log_text.configure(state='disabled')

    def _drain_log_queue(self):
        try:
            while True:
                line = self.log_queue.get_nowait()
                self._append_log(line)
        except queue.Empty:
            pass
        self.after(100, self._drain_log_queue)

    def _on_run(self):
        profile = self.profile_var.get().strip()
        if not profile:
            messagebox.showerror('Profile required', 'Please select a profile.')
            return

        if self.thread and self.thread.is_alive():
            messagebox.showinfo('Running', 'A test is already running.')
            return

        self._append_log(f'\n=== Running profile: {profile} ===\n')
        self._set_running(True)

        cmd = build_command(profile)
        self.thread = threading.Thread(target=self._run_process, args=(cmd,), daemon=True)
        self.thread.start()

    def _on_stop(self):
        if self.proc and self.proc.poll() is None:
            self._append_log('\n--- Stopping process ---\n')
            try:
                self.proc.terminate()
            except Exception as exc:
                self._append_log(f'Failed to terminate: {exc}\n')
        self._set_running(False)

    def _run_process(self, cmd):
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
            self._set_running(False)


def main():
    repo_root = os.path.abspath(os.path.dirname(__file__))
    app = RunnerApp(repo_root)
    app.mainloop()


if __name__ == '__main__':
    main()
