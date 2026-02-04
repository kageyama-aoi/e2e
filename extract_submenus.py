"""
extract_submenus.py

HTMLソースから <tr id="submenu__..."> ブロックを抽出し、
テキストとリンクを JSON / CSV（UTF-8）で出力します。

実行例（PowerShell）:
  python extract_submenus.py
  # 形式選択後に既定パスへ出力:
  #   .\\output\\submenu_extract\\submenu_extract.json
  #   .\\output\\submenu_extract\\submenu_extract.csv
  #   .\\output\\submenu_extract\\submenu_extract_flat.csv
"""

import argparse
import csv
import json
import os
import re
import sys
from html.parser import HTMLParser
from typing import List, Dict, Any, Iterable, Optional, Tuple


class SubmenuExtractor(HTMLParser):
    """
    HTML内の <tr id="submenu__..."> ブロックを抽出するパーサ。

    収集内容:
    - id: サブメニューID（例: submenu__transaction_sub）
    - text: tr内の可視テキストを結合したもの
    - links: 出現順の {href, text} リスト
    """

    def __init__(self) -> None:
        super().__init__()
        self.in_target_tr = False
        self.current_id: Optional[str] = None
        self.current_text_parts: List[str] = []
        self.current_links: List[Dict[str, str]] = []
        self.submenus: List[Dict[str, Any]] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        """開始タグのハンドラ。"""
        attrs = dict(attrs)
        if tag == "tr":
            tr_id = attrs.get("id", "")
            if tr_id.startswith("submenu__"):
                self.in_target_tr = True
                self.current_id = tr_id
                self.current_text_parts = []
                self.current_links = []
        if self.in_target_tr and tag == "a":
            href = attrs.get("href", "")
            self.current_links.append({"href": href, "text": ""})

    def handle_data(self, data: str) -> None:
        """テキストノードのハンドラ。"""
        if not self.in_target_tr:
            return
        text = data.strip()
        if not text:
            return
        self.current_text_parts.append(text)
        if self.current_links:
            self.current_links[-1]["text"] += text

    def handle_endtag(self, tag: str) -> None:
        """終了タグのハンドラ。"""
        if tag == "tr" and self.in_target_tr:
            text = " ".join(self.current_text_parts)
            text = re.sub(r"\s+", " ", text).strip()
            self.submenus.append({
                "id": self.current_id,
                "text": text,
                "links": self.current_links,
            })
            self.in_target_tr = False
            self.current_id = None


def parse_args() -> argparse.Namespace:
    """CLI引数を解析する。"""
    parser = argparse.ArgumentParser(
        description="Extract submenu <tr id='submenu__...'> blocks from HTML."
    )
    parser.add_argument("input", nargs="?", help="Input HTML file (e.g., source.txt)")
    parser.add_argument(
        "--encoding",
        default="auto",
        help="Input file encoding (default: auto; try utf-8 then cp932)",
    )
    parser.add_argument(
        "--errors",
        default="strict",
        choices=["strict", "replace", "ignore"],
        help="Encoding error handling (default: strict)",
    )
    parser.add_argument(
        "--output",
        help="Output file path (UTF-8). If omitted, prints to stdout.",
    )
    parser.add_argument(
        "--format",
        choices=["json", "csv"],
        default="json",
        help="Output format (default: json)",
    )
    parser.add_argument(
        "--flat",
        action="store_true",
        help="CSV only: one row per link (submenu id repeated)",
    )
    return parser.parse_args()


def detect_and_read_input(path: str, encoding: str, errors: str) -> str:
    """
    入力HTMLを文字コード判定付きで読み込む。

    encoding が "auto" の場合:
    - utf-8 → cp932 の順に試行
    - どちらも失敗したら utf-8 + replace で読み込む
    """
    if encoding != "auto":
        with open(path, "r", encoding=encoding, errors=errors) as f:
            return f.read()

    try:
        with open(path, "r", encoding="utf-8", errors="strict") as f:
            html = f.read()
        print("[info] input encoding detected: utf-8", file=sys.stderr)
        return html
    except UnicodeDecodeError:
        try:
            with open(path, "r", encoding="cp932", errors="strict") as f:
                html = f.read()
            print("[info] input encoding detected: cp932 (Shift-JIS)", file=sys.stderr)
            return html
        except UnicodeDecodeError:
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                html = f.read()
            print("[warn] input encoding unclear; decoded with utf-8 (replace)", file=sys.stderr)
            return html


def iter_flat_rows(submenus: Iterable[Dict[str, Any]]) -> Iterable[Tuple[str, str, str, str]]:
    """CSVのフラット形式（リンク1行）を生成する。"""
    for item in submenus:
        if not item["links"]:
            yield (item["id"], item["text"], "", "")
            continue
        for link in item["links"]:
            yield (item["id"], item["text"], link.get("text", ""), link.get("href", ""))


def iter_compact_rows(submenus: Iterable[Dict[str, Any]]) -> Iterable[Tuple[str, str, str]]:
    """CSVのコンパクト形式（links_json）を生成する。"""
    for item in submenus:
        links_json = json.dumps(item["links"], ensure_ascii=False)
        yield (item["id"], item["text"], links_json)


def write_output_json(submenus: List[Dict[str, Any]], output: Optional[str]) -> None:
    """JSON出力（UTF-8）。"""
    content = json.dumps(submenus, ensure_ascii=False, indent=2)
    if output:
        with open(output, "w", encoding="utf-8", newline="") as out:
            out.write(content)
    else:
        print(content)


def write_output_csv(submenus: List[Dict[str, Any]], output: Optional[str], flat: bool) -> None:
    """CSV出力（UTF-8）。"""
    if output:
        with open(output, "w", encoding="utf-8", newline="") as out:
            writer = csv.writer(out)
            if flat:
                writer.writerow(["submenu_id", "submenu_text", "link_text", "href"])
                for row in iter_flat_rows(submenus):
                    writer.writerow(row)
            else:
                writer.writerow(["submenu_id", "submenu_text", "links_json"])
                for row in iter_compact_rows(submenus):
                    writer.writerow(row)
    else:
        writer = csv.writer(sys.stdout)
        if flat:
            writer.writerow(["submenu_id", "submenu_text", "link_text", "href"])
            for row in iter_flat_rows(submenus):
                writer.writerow(row)
        else:
            writer.writerow(["submenu_id", "submenu_text", "links_json"])
            for row in iter_compact_rows(submenus):
                writer.writerow(row)


def main() -> None:
    """エントリーポイント。"""
    default_input = os.path.join("..", "source.txt")
    default_output_dir = os.path.join(".", "output", "submenu_extract")
    default_output_json = os.path.join(default_output_dir, "submenu_extract.json")
    default_output_csv = os.path.join(default_output_dir, "submenu_extract.csv")
    default_output_csv_flat = os.path.join(default_output_dir, "submenu_extract_flat.csv")

    args = parse_args()
    if args.input is None:
        args.input = default_input
    if args.output is None and args.format is not None:
        if args.format == "json":
            args.output = default_output_json
        elif args.format == "csv" and args.flat:
            args.output = default_output_csv_flat
        elif args.format == "csv":
            args.output = default_output_csv

    if sys.stdin.isatty() and len(sys.argv) == 1:
        print("出力形式を選んでください: 1) json  2) csv  3) csv(flat)")
        choice = input("選択 (1/2/3) > ").strip()
        if choice == "2":
            args.format = "csv"
            args.flat = False
            args.output = default_output_csv
        elif choice == "3":
            args.format = "csv"
            args.flat = True
            args.output = default_output_csv_flat
        else:
            args.format = "json"
            args.flat = False
            args.output = default_output_json

    if args.output:
        os.makedirs(os.path.dirname(args.output), exist_ok=True)

    html = detect_and_read_input(args.input, args.encoding, args.errors)

    parser = SubmenuExtractor()
    parser.feed(html)

    if args.format == "json":
        write_output_json(parser.submenus, args.output)
        return

    write_output_csv(parser.submenus, args.output, args.flat)


if __name__ == "__main__":
    main()
