#!/usr/bin/env python
"""
PostToolUse(Bash) Hook: Allure 自動アーカイブ
codeceptjs / npm test 系コマンドを検知し、成否問わず allure:archive を実行する。
"""
import sys
import json
import re
import subprocess

TEST_PATTERNS = [
    r'codeceptjs\s+run',
    r'npm\s+run\s+test',
    r'npm\s+test\b',
    r'npx\s+codeceptjs',
]


def is_test_command(command: str) -> bool:
    return any(re.search(p, command) for p in TEST_PATTERNS)


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    command = data.get('tool_input', {}).get('command', '')
    if not command or not is_test_command(command):
        sys.exit(0)

    result = subprocess.run(
        ['npm', 'run', 'allure:archive'],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        msg = f'[Allure Archive] アーカイブ失敗\n{result.stderr.strip()}'
        print(json.dumps({'systemMessage': msg}))


if __name__ == '__main__':
    main()
