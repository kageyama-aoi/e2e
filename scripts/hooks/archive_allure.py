#!/usr/bin/env python
"""
PostToolUse(Bash) Hook: 実行フォルダの自動クリーンアップ（allure-results/ と output/）
codeceptjs / npm test 系コマンドを検知し、成否問わず古い実行フォルダを削除する。
（ファイル名は .claude/settings.local.json から参照されているため archive_allure.py のまま）

規則はランチャー（run/run_gui.py の起動時クリーンアップ）と同じ：
DEFAULT_DAYS（10）日以上古い実行フォルダを zip せずに削除し、各プロファイル最新 DEFAULT_KEEP_LATEST（3）件は残す。
判定は scripts/cleanup/run_dir_cleanup.py の cleanup_all()（#321 で output/ も対象に追加）。

以前は `npm run allure:archive` を subprocess で呼んでいたが、Windows では npm の実体が
npm.cmd のため FileNotFoundError で毎回落ちていた（設定側で stderr を捨てていて気付けなかった #310）。
npm を経由せず、判定関数を直接呼ぶ。
"""
import importlib.util
import json
import re
import sys
from pathlib import Path

_CLEANUP_SCRIPT = Path(__file__).resolve().parent.parent / 'cleanup' / 'run_dir_cleanup.py'

TEST_PATTERNS = [
    r'codeceptjs\s+run',
    r'npm\s+run\s+test',
    r'npm\s+test\b',
    r'npx\s+codeceptjs',
]


def is_test_command(command: str) -> bool:
    return any(re.search(p, command) for p in TEST_PATTERNS)


def _load_cleanup_module():
    spec = importlib.util.spec_from_file_location('run_dir_cleanup', _CLEANUP_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    command = data.get('tool_input', {}).get('command', '')
    if not command or not is_test_command(command):
        sys.exit(0)

    try:
        results = _load_cleanup_module().cleanup_all()
    except Exception as exc:
        print(json.dumps({'systemMessage': f'[Run Dir Cleanup] 失敗: {exc}'}, ensure_ascii=False))
        return

    errors = [line for lines in results.values() for line in lines if line.lstrip().startswith('error:')]
    if errors:
        print(json.dumps({'systemMessage': '[Run Dir Cleanup] 一部失敗\n' + '\n'.join(errors)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
