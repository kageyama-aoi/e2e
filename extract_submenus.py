"""
extract_submenus.py

Extract submenu <tr id="submenu__..."> blocks from an HTML source file and output
their text and links as JSON or CSV (UTF-8).

Examples (PowerShell):
  python extract_submenus.py ..\source.txt --format json --output .\output\submenu_extract\submenu_extract.json 2> .\output\submenu_extract\detect.log
  python extract_submenus.py ..\source.txt --format csv --output .\output\submenu_extract\submenu_extract.csv 2> .\output\submenu_extract\detect.log
  python extract_submenus.py ..\source.txt --format csv --flat --output .\output\submenu_extract\submenu_extract_flat.csv 2> .\output\submenu_extract\detect.log
"""

import argparse
import csv
import json
import re
from html.parser import HTMLParser
from typing import List, Dict, Any


class SubmenuExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_target_tr = False
        self.current_id = None
        self.current_text_parts: List[str] = []
        self.current_links: List[Dict[str, str]] = []
        self.submenus: List[Dict[str, Any]] = []

    def handle_starttag(self, tag: str, attrs) -> None:
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
        if not self.in_target_tr:
            return
        text = data.strip()
        if not text:
            return
        self.current_text_parts.append(text)
        if self.current_links:
            self.current_links[-1]["text"] += text

    def handle_endtag(self, tag: str) -> None:
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
    parser = argparse.ArgumentParser(
        description="Extract submenu <tr id='submenu__...'> blocks from HTML."
    )
    parser.add_argument("input", help="Input HTML file (e.g., source.txt)")
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


def main() -> None:
    args = parse_args()
    encoding_used = args.encoding
    if args.encoding == "auto":
        try:
            with open(args.input, "r", encoding="utf-8", errors="strict") as f:
                html = f.read()
            encoding_used = "utf-8"
            print("[info] input encoding detected: utf-8", file=sys.stderr)
        except UnicodeDecodeError:
            try:
                with open(args.input, "r", encoding="cp932", errors="strict") as f:
                    html = f.read()
                encoding_used = "cp932"
                print("[info] input encoding detected: cp932 (Shift-JIS)", file=sys.stderr)
            except UnicodeDecodeError:
                with open(args.input, "r", encoding="utf-8", errors="replace") as f:
                    html = f.read()
                encoding_used = "utf-8 (replace)"
                print("[warn] input encoding unclear; decoded with utf-8 (replace)", file=sys.stderr)
    else:
        with open(args.input, "r", encoding=args.encoding, errors=args.errors) as f:
            html = f.read()

    parser = SubmenuExtractor()
    parser.feed(html)

    if args.format == "json":
        content = json.dumps(parser.submenus, ensure_ascii=False, indent=2)
        if args.output:
            with open(args.output, "w", encoding="utf-8", newline="") as out:
                out.write(content)
        else:
            print(content)
        return

    # CSV output
    if args.output:
        out_stream = open(args.output, "w", encoding="utf-8", newline="")
    else:
        out_stream = sys.stdout
    writer = csv.writer(out_stream)
    if args.flat:
        writer.writerow(["submenu_id", "submenu_text", "link_text", "href"])
        for item in parser.submenus:
            if not item["links"]:
                writer.writerow([item["id"], item["text"], "", ""])
                continue
            for link in item["links"]:
                writer.writerow([item["id"], item["text"], link.get("text", ""), link.get("href", "")])
    else:
        writer.writerow(["submenu_id", "submenu_text", "links_json"])
        for item in parser.submenus:
            writer.writerow([item["id"], item["text"], json.dumps(item["links"], ensure_ascii=False)])
    if args.output:
        out_stream.close()


if __name__ == "__main__":
    import sys
    main()
