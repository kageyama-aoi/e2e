#!/usr/bin/env python
"""
PostToolUse(Write) Hook: ファイル配置バリデーター
AGENTS.md の配置ルールに照らして、想定外の場所へのファイル作成を警告する。
"""
import sys
import json
import re


KNOWN_DIRS = {
    'tests', 'pages', 'support', 'data', 'scripts', 'run',
    '.claude', '.agent', 'docs', 'env', 'logs', 'output',
    'allure-results', 'allure-report', 'node_modules', '.git', '.spec',
}

ROOT_OK_NAMES = {
    'package.json', 'package-lock.json', 'codecept.conf.js',
    'AGENTS.md', 'README.md', '.gitignore', 'CLAUDE.md',
    'jest.config.js', 'babel.config.js',
}


def to_relative(fp):
    fp = fp.replace('\\', '/')
    m = re.search(r'.*/testcode/e2e/(.*)', fp, re.IGNORECASE)
    return m.group(1).lstrip('./') if m else None


def warn(rel, reason):
    msg = (
        f'[配置確認] {rel}\n'
        f'{reason}\n'
        f'問題なければ無視してください。迷ったら /placement-gate を実行。'
    )
    print(json.dumps({'systemMessage': msg}))


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    fp = data.get('tool_input', {}).get('file_path', '')
    if not fp:
        sys.exit(0)

    rel = to_relative(fp)
    if rel is None:
        sys.exit(0)

    parts = rel.split('/')
    top = parts[0] if parts else ''

    # ルートの既知設定ファイル
    if rel in ROOT_OK_NAMES or rel.startswith('.env'):
        sys.exit(0)

    # 想定外のトップレベルディレクトリ
    if top not in KNOWN_DIRS:
        warn(rel, f'想定外のディレクトリ "{top}/" にファイルが作成されました。')
        return

    # tests/ 配下サブルール: _test.js のみ許可
    if top == 'tests' and not rel.endswith('_test.js'):
        warn(rel, 'tests/ には *_test.js のみ配置可。Page Object は pages/、データは data/ へ。')
        return

    # run/ 配下サブルール: .bat / .py のみ許可
    if top == 'run' and rel.endswith('.js'):
        warn(rel, 'run/ に .js ファイルを置くのは原則NG。ランチャーは .bat / .py が原則。')
        return


if __name__ == '__main__':
    main()
