#!/usr/bin/env python
"""
PostToolUse(Bash) Hook: Allure 自動クリーンアップ
codeceptjs / npm test 系コマンドを検知し、成否問わず古い allure-results を削除する。

規則はランチャー（run/run_gui.py の起動時クリーンアップ）と同じ：
ALLURE_CLEANUP_DAYS 日以上古い実行結果を zip せずに削除し、各プロファイル最新 ALLURE_KEEP_LATEST 件は残す。

以前は `npm run allure:archive` を subprocess で呼んでいたが、Windows では npm の実体が
npm.cmd のため FileNotFoundError で毎回落ちていた（設定側で stderr を捨てていて気付けなかった #310）。
npm を経由せず、判定関数 cleanup_allure_results() を直接呼ぶ。
"""
import importlib.util
import json
import re
import sys
from pathlib import Path

ALLURE_CLEANUP_DAYS = 10
ALLURE_KEEP_LATEST = 3
_CLEANUP_SCRIPT = Path(__file__).resolve().parent.parent / 'allure' / 'archive_allure_results.py'

TEST_PATTERNS = [
    r'codeceptjs\s+run',
    r'npm\s+run\s+test',
    r'npm\s+test\b',
    r'npx\s+codeceptjs',
]


def is_test_command(command: str) -> bool:
    return any(re.search(p, command) for p in TEST_PATTERNS)


def _load_cleanup_module():
    spec = importlib.util.spec_from_file_location('archive_allure_results', _CLEANUP_SCRIPT)
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
        lines = _load_cleanup_module().cleanup_allure_results(
            ALLURE_CLEANUP_DAYS, ALLURE_KEEP_LATEST, archive=False
        )
    except Exception as exc:
        print(json.dumps({'systemMessage': f'[Allure Cleanup] 失敗: {exc}'}, ensure_ascii=False))
        return

    errors = [line for line in lines if line.lstrip().startswith('error:')]
    if errors:
        print(json.dumps({'systemMessage': '[Allure Cleanup] 一部失敗\n' + '\n'.join(errors)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
