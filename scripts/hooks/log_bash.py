#!/usr/bin/env python
"""
PostToolUse(Bash) Hook: Bash コマンド実行ログを docs/common/learning/ に自動記録する。

各実行を bash_YYYYMMDD.md に追記することで、セッション中のコマンド学習記録を蓄積する。
"""
import sys
import json
import os
from datetime import datetime

MAX_OUTPUT_LINES = 50
LEARNING_DIR = 'docs/common/learning'


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    command = data.get('tool_input', {}).get('command', '')
    if not command:
        sys.exit(0)

    tool_response = data.get('tool_response', {})
    output = ''
    if isinstance(tool_response, dict):
        output = tool_response.get('output', '') or ''
    elif isinstance(tool_response, str):
        output = tool_response

    lines = output.splitlines()
    if len(lines) > MAX_OUTPUT_LINES:
        lines = lines[:MAX_OUTPUT_LINES] + [f'... (省略: {len(lines) - MAX_OUTPUT_LINES} 行)']
    output = '\n'.join(lines)

    today = datetime.now().strftime('%Y%m%d')
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    log_dir = os.path.join(repo_root, LEARNING_DIR)
    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, f'bash_{today}.md')

    entry = (
        f'## {timestamp}\n'
        f'**Command:**\n'
        f'```\n{command}\n```\n'
        f'**Output:**\n'
        f'```\n{output}\n```\n'
        f'---\n\n'
    )

    try:
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(entry)
    except Exception:
        sys.exit(0)


if __name__ == '__main__':
    main()
