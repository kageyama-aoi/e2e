"""
ドキュメント参照ドリフト検出ツール (Doc Reference Drift Checker)

`docs/` `.claude/skills/` `AGENTS.md` の Markdown が名指ししているファイルパスと
関数名が、実際のソースに存在するかを機械的に確認します。

コードを整理（関数名変更・ユーティリティ新設・Mixin 化）したあと、それを教える
スキル／ガイドが追従していないと、次のテストが古いパターンで量産されます
（2026-09 shimamura 診断で実際に発生）。このスクリプトはその「ズレ」を commit 時に
気付けるようにするためのものです。Python 標準ライブラリのみで動作します。

【チェック内容】
- [path] `pages/…` `tests/…` `support/…` `scripts/…` `data/…` `run/…` `docs/…` 始まりの
         パスが実在するか（`file.js:123` の行番号部分は無視）
- [func] `xxxPage.method(` / `xxxFlowPage.method(` 形式、および `funcName(I, …)` 形式で
         参照されている関数名が pages/ support/ tests/ scripts/ の JS に定義されているか

【除外】
- `{placeholder}` `〇〇` `○○` `<...>` `*` を含むもの、Xxx / Some / foo 等の例示名（スキルのテンプレート）
- コード上の慣用オブジェクト（I / page / document / process 等）のメソッド
- `docs/**/learning/`（Bash 学習ログ。一時ファイルへの言及が多い）
- `scripts/docs/check_doc_refs.ignore` に書いた参照（意図的に実在しないもの。1行1参照）

【使い方】
    # 警告のみ（常に exit 0。pre-commit から呼ぶ）
    python scripts/docs/check_doc_refs.py

    # ズレがあれば exit 1（npm run docs:check-refs / CI 用）
    python scripts/docs/check_doc_refs.py --check

    # 特定ファイル・ディレクトリだけ（ディレクトリは配下の *.md を再帰的に対象にする）
    python scripts/docs/check_doc_refs.py docs/shimamura .claude/skills/shimamura-ichiran-dev

作成日: 2026-09-10（Issue #202）
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

# Windows のコンソール（cp932）でも化けないよう標準出力を UTF-8 にする
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parents[2]

# チェック対象の Markdown
DOC_GLOBS = ["docs/**/*.md", ".claude/skills/**/*.md", "AGENTS.md"]

# チェックから外す Markdown（自動記録される学習ログは一時ファイルへの言及が多い）
DOC_EXCLUDE_PARTS = ("learning",)

# 意図的に実在しない参照を書いている行を黙らせる除外リスト（1行1参照、# はコメント）
IGNORE_FILE = ROOT / "scripts" / "docs" / "check_doc_refs.ignore"

# 関数定義を収集する JS ソース
SOURCE_GLOBS = ["pages/**/*.js", "support/**/*.js", "tests/**/*.js", "scripts/**/*.js"]

# パス参照として扱うトップレベルディレクトリ
PATH_ROOTS = ("pages", "tests", "support", "scripts", "data", "run", "docs")

# `obj.method(` の obj がこれらならチェックしない（CodeceptJS / Playwright / 組み込み）
SKIP_OBJECTS = {
    "I", "page", "document", "window", "console", "fs", "path", "JSON", "Math",
    "String", "Array", "Object", "Promise", "process", "locate", "expect", "el",
    "Date", "Number", "session", "row", "current", "data", "input", "codecept",
    "helpers", "config", "output", "browser", "context", "this", "module", "require",
    "Feature", "Scenario", "Data", "Before", "After", "BeforeSuite", "AfterSuite",
    "args", "params", "options", "opts", "state", "result", "res", "err", "error",
    "str", "text", "value", "arr", "list", "map", "set", "obj", "it", "describe",
}

# プレースホルダ・例示とみなして除外する文字
PLACEHOLDER_CHARS = ("{", "}", "〇", "○", "<", ">", "*", "…", "...")

# 例示名とみなして除外する語（スキルのテンプレ・ガイドの説明用コード）
EXAMPLE_TOKEN_RE = re.compile(
    r"(?i)(xxx|yyy|zzz|some|foo|bar|target|example|sample|yyyymmdd|_tmp_|subdir|/sub/|---|"
    r"^bad$|^good$|^doSomething$|^navigateTo$|^open$|^fill$|^run$|^verify$|^Flow$)"
)

# `pages/tframe/screens/KoshiPage.js:123` のような参照（ASCII のみ。直後の日本語を拾わない）
PATH_RE = re.compile(
    r"(?<![A-Za-z0-9_./\-])(" + "|".join(PATH_ROOTS) + r")/[A-Za-z0-9_.\-{}*<>/]+"
)

# `ichiranPageShimamura.navigateToStudentSearchPage(` のような参照
METHOD_RE = re.compile(r"\b([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\s*\(")

# `verifyValidationErrors(I, ...)` のように I を第1引数で受け取る関数呼び出し
# （直前が `}` のものは `run{FlowName}Flow(I` のようなテンプレなので拾わない）
FUNC_WITH_I_RE = re.compile(r"(?<![\w.$}])([A-Za-z_$][\w$]*)\s*\(\s*I\s*[,)]")

# JS ソースから関数名を拾う（function 宣言 / メソッド定義 / const 代入 / exports）
DEF_RES = [
    re.compile(r"\bfunction\s+([A-Za-z_$][\w$]*)\s*\("),
    re.compile(r"^\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{", re.MULTILINE),
    re.compile(r"\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*="),
    re.compile(r"\b([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?(?:function\b|\()"),
    re.compile(r"\bexports\.([A-Za-z_$][\w$]*)\s*="),
]
EXPORTS_BLOCK_RE = re.compile(r"module\.exports\s*=\s*\{([^}]*)\}", re.DOTALL)


@dataclass
class Finding:
    doc: Path
    line: int
    kind: str  # "path" | "func"
    ref: str
    detail: str

    def format(self) -> str:
        rel = self.doc.relative_to(ROOT).as_posix()
        return f"{rel}:{self.line}: [{self.kind}] '{self.ref}' {self.detail}"


def collect_defined_names() -> set[str]:
    names: set[str] = set()
    for pattern in SOURCE_GLOBS:
        for src in ROOT.glob(pattern):
            if "node_modules" in src.parts:
                continue
            try:
                text = src.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            for regex in DEF_RES:
                names.update(regex.findall(text))
            for block in EXPORTS_BLOCK_RE.findall(text):
                for token in re.split(r"[,\s]+", block):
                    token = token.split(":")[0].strip()
                    if re.fullmatch(r"[A-Za-z_$][\w$]*", token):
                        names.add(token)
    return names


def is_placeholder(text: str) -> bool:
    return any(ch in text for ch in PLACEHOLDER_CHARS) or bool(EXAMPLE_TOKEN_RE.search(text))


def load_ignore_list() -> set[str]:
    if not IGNORE_FILE.exists():
        return set()
    refs: set[str] = set()
    for raw in IGNORE_FILE.read_text(encoding="utf-8").splitlines():
        line = raw.split("#", 1)[0].strip()
        if line:
            refs.add(line)
    return refs


def normalize_path(raw: str) -> str:
    """末尾の句読点・行番号（:123 / :123-456）を落として存在確認用のパスにする"""
    cleaned = raw.rstrip(".,)")
    cleaned = re.sub(r":\d+(?:-\d+)?$", "", cleaned)
    return cleaned


def check_paths(doc: Path, lines: list[str], ignored: set[str]) -> list[Finding]:
    findings: list[Finding] = []
    seen: set[str] = set()
    for lineno, line in enumerate(lines, start=1):
        for match in PATH_RE.finditer(line):
            raw = match.group(0)
            if is_placeholder(raw):
                continue
            rel = normalize_path(raw)
            if rel in seen or rel in ignored:
                continue
            seen.add(rel)
            if (ROOT / rel).exists():
                continue
            findings.append(Finding(doc, lineno, "path", rel, "が存在しません"))
    return findings


def check_functions(doc: Path, lines: list[str], defined: set[str], ignored: set[str]) -> list[Finding]:
    findings: list[Finding] = []
    seen: set[str] = set()
    for lineno, line in enumerate(lines, start=1):
        candidates: list[str] = []
        for obj, method in METHOD_RE.findall(line):
            if obj in SKIP_OBJECTS or is_placeholder(method) or is_placeholder(obj):
                continue
            # Page Object / FlowPage / helpers 系のオブジェクトだけを対象にする
            if not re.search(r"(Page|Mixin|Flow|Shimamura|Tframe|helpers|utils|Helper)", obj):
                continue
            candidates.append(method)
        for func in FUNC_WITH_I_RE.findall(line):
            if is_placeholder(func) or func in SKIP_OBJECTS:
                continue
            candidates.append(func)
        for name in candidates:
            if name in seen or name in defined or name in ignored:
                continue
            seen.add(name)
            findings.append(Finding(doc, lineno, "func", name, "が pages/ support/ に見つかりません"))
    return findings


def iter_docs(explicit: list[str]) -> list[Path]:
    if explicit:
        docs: list[Path] = []
        for p in explicit:
            target = Path(p).resolve() if Path(p).is_absolute() else (ROOT / p).resolve()
            # ディレクトリ指定は配下の *.md を再帰的に展開する
            if target.is_dir():
                docs.extend(sorted(target.rglob("*.md")))
            else:
                docs.append(target)
        return docs
    docs: list[Path] = []
    for pattern in DOC_GLOBS:
        for doc in sorted(ROOT.glob(pattern)):
            if any(part in DOC_EXCLUDE_PARTS for part in doc.parts):
                continue
            docs.append(doc)
    return docs


def main() -> int:
    parser = argparse.ArgumentParser(description="docs/skills の参照パス・関数名ドリフトを検出する")
    parser.add_argument("files", nargs="*", help="チェック対象の md（省略時は docs/ .claude/skills/ AGENTS.md 全部）")
    parser.add_argument("--check", action="store_true", help="ズレがあれば exit 1（既定は警告のみで exit 0）")
    parser.add_argument("--quiet", action="store_true", help="ズレがないときは何も出力しない")
    args = parser.parse_args()

    defined = collect_defined_names()
    ignored = load_ignore_list()
    findings: list[Finding] = []
    for doc in iter_docs(args.files):
        if not doc.exists():
            print(f"[check_doc_refs] 対象が見つかりません: {doc}")
            continue
        lines = doc.read_text(encoding="utf-8", errors="ignore").splitlines()
        findings.extend(check_paths(doc, lines, ignored))
        findings.extend(check_functions(doc, lines, defined, ignored))

    if not findings:
        if not args.quiet:
            print("[check_doc_refs] OK: docs/skills の参照パス・関数名はすべて実在します")
        return 0

    mode = "ERROR" if args.check else "WARN"
    print(f"[check_doc_refs] {mode}: 実在しない参照が {len(findings)} 件あります")
    for f in findings:
        print("  " + f.format())
    if args.check:
        print("  → ドキュメント／スキルを現行コードに合わせて更新してください（/doc-sync カテゴリF）")
        return 1
    print("  → 警告モードのため commit は続行します。npm run docs:check-refs で一覧確認できます")
    return 0


if __name__ == "__main__":
    sys.exit(main())
