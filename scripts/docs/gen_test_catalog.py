"""
テストカタログ生成ツール (Test Catalog Generator)

`tests/` 配下の `*_test.js` を走査し、`run/test_descriptions.json` の 1 行説明と
突き合わせて、人間が読める一覧 `docs/project/test_catalog.md` を生成します。

久々にプロジェクトへ戻ったとき「どんなテストがあるか」を 1 ファイルで把握するための
入口ドキュメントです。Python 標準ライブラリのみで動作します。

【生成物】
- docs/project/test_catalog.md（プロダクト → フォルダ → ファイル → 機能No → 説明 の表）

【ドリフト検出】
- 説明が未登録のテストファイル
- 実体のない説明エントリ（テストが削除・リネームされた可能性）

【使い方】
    # カタログを再生成
    python scripts/docs/gen_test_catalog.py
    # （npm run docs:catalog でも同じ）

    # ドリフトがあれば exit 1（CI・pre-commit フック用。ファイルは書き換えない）
    python scripts/docs/gen_test_catalog.py --check

作成日: 2026-09-01
"""

from __future__ import annotations

import argparse
import datetime
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from zoneinfo import ZoneInfo

# Windows のコンソール（cp932）でも化けないよう標準出力を UTF-8 にする
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parents[2]
TESTS_DIR = ROOT / "tests"
DESC_FILE = ROOT / "run" / "test_descriptions.json"
OUT_FILE = ROOT / "docs" / "project" / "test_catalog.md"

# 表示順。tests/ 直下に存在するものだけ対象にする。
PRODUCT_ORDER = ["shimamura", "tframe", "taskreport", "smoke"]

AUTOGEN_NOTE = (
    "> このファイルは自動生成です。直接編集しないでください。\n"
    "> 再生成: `npm run docs:catalog`（テスト追加・説明変更時は commit 時にも自動更新）\n"
)


@dataclass
class ProductCatalog:
    """1 プロダクト分の集計結果。"""

    name: str
    rows_by_folder: dict[str, list[tuple[str, str, str]]] = field(default_factory=dict)
    total: int = 0
    missing_desc: list[str] = field(default_factory=list)   # 説明が無いテスト（product 相対パス）
    orphan_desc: list[str] = field(default_factory=list)    # 実体が無い説明キー（product 相対パス）


def _description(entry) -> str:
    """test_descriptions.json の値（文字列 or オブジェクト）から説明文を取り出す。"""
    if isinstance(entry, dict):
        return entry.get("description", "")
    return entry or ""


def _feature_no(entry) -> str:
    """test_descriptions.json の値から feature_no を取り出す。なければ空文字。"""
    if isinstance(entry, dict):
        return entry.get("feature_no", "") or ""
    return ""


def load_descriptions() -> dict:
    if not DESC_FILE.exists():
        return {}
    with DESC_FILE.open(encoding="utf-8") as f:
        return json.load(f)


def collect_product(name: str, descriptions: dict) -> ProductCatalog:
    product_dir = TESTS_DIR / name
    catalog = ProductCatalog(name=name)

    test_files = sorted(
        p.relative_to(product_dir).as_posix()
        for p in product_dir.rglob("*_test.js")
    )
    desc_map = {k: v for k, v in descriptions.get(name, {}).items()}

    for rel in test_files:
        entry = desc_map.get(rel)
        if entry is None:
            catalog.missing_desc.append(rel)
        folder = rel.split("/")[0] + "/" if "/" in rel else "(直下)"
        fname = rel.split("/")[-1]
        catalog.rows_by_folder.setdefault(folder, []).append(
            (fname, _feature_no(entry), _description(entry))
        )
        catalog.total += 1

    file_set = set(test_files)
    for key in desc_map:
        if key not in file_set:
            catalog.orphan_desc.append(key)

    return catalog


def render(catalogs: list[ProductCatalog]) -> str:
    now = datetime.datetime.now(ZoneInfo("Asia/Tokyo")).strftime("%Y-%m-%d %H:%M")
    parts: list[str] = []

    grand_total = sum(c.total for c in catalogs)
    breakdown = " / ".join(f"{c.name} {c.total}" for c in catalogs)

    parts.append("# テストカタログ\n")
    parts.append(AUTOGEN_NOTE)
    parts.append(f"> 最終更新: {now} (JST)\n")
    parts.append(f"\n**合計 {grand_total} テスト**（{breakdown}）\n")

    for c in catalogs:
        parts.append(f"\n## {c.name}（{c.total}件）\n")
        for folder in sorted(c.rows_by_folder):
            rows = c.rows_by_folder[folder]
            parts.append(f"\n### {folder}（{len(rows)}件）\n")
            parts.append("\n| テストファイル | 機能No | 説明 |")
            parts.append("\n|---|---|---|")
            for fname, feature_no, desc in rows:
                desc_cell = desc.replace("|", "\\|") if desc else "_（説明未登録）_"
                parts.append(f"\n| `{fname}` | {feature_no or '—'} | {desc_cell} |")
            parts.append("\n")

    drift = [c for c in catalogs if c.missing_desc or c.orphan_desc]
    parts.append("\n## メンテナンス状況\n")
    if not drift:
        parts.append("\n✅ ドリフトなし（全テストに説明あり／不要な説明エントリなし）\n")
    else:
        for c in drift:
            if c.missing_desc:
                parts.append(
                    f"\n### ⚠️ 説明が未登録のテスト（{c.name}）\n"
                    "`run/test_descriptions.json` に 1 行説明を追記してください。\n\n"
                )
                parts.append("".join(f"- `{c.name}/{p}`\n" for p in c.missing_desc))
            if c.orphan_desc:
                parts.append(
                    f"\n### ⚠️ 実体のない説明エントリ（{c.name}）\n"
                    "テストが削除・リネームされた可能性があります。"
                    "`run/test_descriptions.json` を見直してください。\n\n"
                )
                parts.append("".join(f"- `{c.name}/{p}`\n" for p in c.orphan_desc))

    return "".join(parts)


def main() -> int:
    parser = argparse.ArgumentParser(description="テストカタログを生成する")
    parser.add_argument(
        "--check",
        action="store_true",
        help="ドリフトがあれば exit 1（ファイルは書き換えない）",
    )
    args = parser.parse_args()

    descriptions = load_descriptions()
    catalogs = [
        collect_product(name, descriptions)
        for name in PRODUCT_ORDER
        if (TESTS_DIR / name).is_dir()
    ]

    missing = [(c.name, p) for c in catalogs for p in c.missing_desc]
    orphan = [(c.name, p) for c in catalogs for p in c.orphan_desc]

    if args.check:
        if missing or orphan:
            for name, p in missing:
                print(f"[説明未登録] {name}/{p}")
            for name, p in orphan:
                print(f"[実体なし]   {name}/{p}")
            print(f"\nドリフト {len(missing) + len(orphan)} 件。test_descriptions.json を更新してください。")
            return 1
        print("ドリフトなし。")
        return 0

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(render(catalogs), encoding="utf-8")
    rel_out = OUT_FILE.relative_to(ROOT).as_posix()
    total = sum(c.total for c in catalogs)
    print(f"生成: {rel_out}（{total} テスト）")
    if missing or orphan:
        print(f"⚠️ ドリフト {len(missing) + len(orphan)} 件（詳細はカタログ末尾の「メンテナンス状況」）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
